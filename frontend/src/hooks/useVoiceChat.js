import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  ConnectionState,
} from 'livekit-client';
import { API_BASE_URL, authHeaders } from '../lib/api';

/**
 * Live voice chat powered by LiveKit Cloud.
 *
 * Flow per client:
 *   1. GET /api/livekit/token?room={roomCode}  →  { url, token, identity, name }
 *   2. room.connect(url, token) — joins the LiveKit room
 *   3. room.localParticipant.setMicrophoneEnabled(true) — captures + publishes mic
 *   4. RoomEvent.TrackSubscribed → audio plays automatically (LiveKit attaches)
 *
 * LiveKit handles SFU routing, NAT traversal, and audio rendering, so we just
 * mirror the participant state into React.
 *
 * Exposed API (matches what VoiceChatPanel already consumes):
 *   - localMuted, toggleMute
 *   - deafened, toggleDeafen
 *   - error, micState ('idle' | 'requesting' | 'live' | 'denied' | 'error')
 *   - speakingPeers   { [identity]: boolean }
 *   - connectedPeers  { [identity]: boolean }
 *   - localSpeaking, localLevel               — for VU meter
 *
 * Note: identity here = the user's numeric id as string, set server-side
 * when minting the token. VoiceChatPanel keys peers by player.id which is
 * the same numeric id, so its lookups still work.
 */
export function useVoiceChat({ roomCode, userId, players, token, enabled }) {
  const [localMuted, setLocalMuted] = useState(false);
  const [deafened, setDeafened]     = useState(false);
  const [error, setError]           = useState('');
  const [micState, setMicState]     = useState('idle');
  const [speakingPeers, setSpeakingPeers] = useState({});
  const [connectedPeers, setConnectedPeers] = useState({});
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [localLevel, setLocalLevel]       = useState(0);

  const roomRef          = useRef(null);
  const tokenRef         = useRef(token);
  const audioElementsRef = useRef({}); // identity -> { el, track }

  useEffect(() => { tokenRef.current = token; }, [token]);

  /* ── Apply deafen flag to all attached <audio> elements ── */
  useEffect(() => {
    Object.values(audioElementsRef.current).forEach(({ el }) => {
      try { if (el) el.muted = !!deafened; } catch { /* ignore */ }
    });
  }, [deafened]);

  const detachAllPeers = useCallback(() => {
    Object.entries(audioElementsRef.current).forEach(([, entry]) => {
      try { entry.track?.detach()?.forEach((el) => el.remove()); } catch { /* ignore */ }
      try { entry.el?.remove(); } catch { /* ignore */ }
    });
    audioElementsRef.current = {};
  }, []);

  /* ── Tear down everything ── */
  const teardown = useCallback(async () => {
    const room = roomRef.current;
    detachAllPeers();
    if (room) {
      try { await room.disconnect(true); } catch { /* ignore */ }
    }
    roomRef.current = null;
    setSpeakingPeers({});
    setConnectedPeers({});
    setLocalSpeaking(false);
    setLocalLevel(0);
  }, [detachAllPeers]);

  /* ── Connect / disconnect lifecycle ── */
  useEffect(() => {
    if (!enabled || !roomCode || !userId || !tokenRef.current) return undefined;
    let cancelled = false;
    setMicState('requesting');
    setError('');

    (async () => {
      try {
        // 1. Fetch a fresh access token from our backend
        const url = new URL(`${API_BASE_URL}/livekit/token`);
        url.searchParams.set('room', roomCode);
        const res = await fetch(url, {
          headers: authHeaders(tokenRef.current),
        });
        if (!res.ok) {
          let msg = 'Voice service unavailable';
          try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
          throw new Error(msg);
        }
        const cred = await res.json();
        if (cancelled) return;

        // 2. Build the room
        const room = new Room({
          adaptiveStream: false,
          dynacast: true,
        });
        roomRef.current = room;

        // 3. Wire events BEFORE connecting
        room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
          if (track.kind !== Track.Kind.Audio) return;
          const identity = participant.identity;
          const el = track.attach();
          el.autoplay = true;
          el.playsInline = true;
          el.style.display = 'none';
          el.muted = !!deafened;
          document.body.appendChild(el);
          audioElementsRef.current[identity] = { el, track };
        });

        room.on(RoomEvent.TrackUnsubscribed, (track, _publication, participant) => {
          if (track.kind !== Track.Kind.Audio) return;
          const identity = participant.identity;
          try { track.detach()?.forEach((e) => e.remove()); } catch { /* ignore */ }
          const entry = audioElementsRef.current[identity];
          if (entry?.el) {
            try { entry.el.remove(); } catch { /* ignore */ }
          }
          delete audioElementsRef.current[identity];
        });

        room.on(RoomEvent.ParticipantConnected, (participant) => {
          setConnectedPeers((prev) => ({ ...prev, [participant.identity]: true }));
        });

        room.on(RoomEvent.ParticipantDisconnected, (participant) => {
          const identity = participant.identity;
          setConnectedPeers((prev) => {
            const next = { ...prev }; delete next[identity]; return next;
          });
          setSpeakingPeers((prev) => {
            const next = { ...prev }; delete next[identity]; return next;
          });
          const entry = audioElementsRef.current[identity];
          if (entry) {
            try { entry.track?.detach()?.forEach((e) => e.remove()); } catch { /* ignore */ }
            try { entry.el?.remove(); } catch { /* ignore */ }
            delete audioElementsRef.current[identity];
          }
        });

        room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
          // speakers is an array of Participant objects currently speaking
          const speakingMap = {};
          let myLevel = 0;
          let mySpeaking = false;
          for (const p of speakers) {
            speakingMap[p.identity] = true;
            if (p.isLocal) {
              myLevel = p.audioLevel || 0;
              mySpeaking = true;
            }
          }
          // Filter out the local participant from peers map
          const localId = room.localParticipant?.identity;
          if (localId) delete speakingMap[localId];
          setSpeakingPeers(speakingMap);
          setLocalSpeaking(mySpeaking && !localMuted);
          setLocalLevel(Math.min(1, myLevel));
        });

        room.on(RoomEvent.Disconnected, () => {
          if (cancelled) return;
          setMicState('idle');
        });

        // 4. Connect
        await room.connect(cred.url, cred.token, {
          autoSubscribe: true,
        });
        if (cancelled) {
          try { await room.disconnect(true); } catch { /* ignore */ }
          return;
        }

        // Pre-populate connected peers with whoever's already in the room
        const initialConnected = {};
        for (const [, p] of room.remoteParticipants) {
          initialConnected[p.identity] = true;
        }
        setConnectedPeers(initialConnected);

        // 5. Capture + publish mic
        await room.localParticipant.setMicrophoneEnabled(true);
        if (cancelled) {
          try { await room.disconnect(true); } catch { /* ignore */ }
          return;
        }

        setMicState('live');
      } catch (err) {
        if (cancelled) return;
        console.error('[voice] enable failed:', err);
        const msg = (err && err.message) || 'Failed to enable voice';
        if (/permission|allowed|denied/i.test(msg)) {
          setError('Microphone permission denied');
          setMicState('denied');
        } else if (/not.*found|device|no.*microphone/i.test(msg)) {
          setError('No microphone found');
          setMicState('error');
        } else {
          setError(msg);
          setMicState('error');
        }
        teardown();
      }
    })();

    return () => {
      cancelled = true;
      teardown();
      setMicState('idle');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, roomCode, userId]);

  /* ── Mute toggle (mic) ── */
  const toggleMute = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !localMuted;
    try {
      await room.localParticipant.setMicrophoneEnabled(!next);
    } catch (err) {
      console.warn('[voice] toggleMute failed:', err);
    }
    setLocalMuted(next);
  }, [localMuted]);

  /* ── Deafen toggle (incoming) ── */
  const toggleDeafen = useCallback(() => {
    setDeafened((d) => !d);
  }, []);

  /* `players` prop is unused now (LiveKit gives us authoritative roster via
     ParticipantConnected/Disconnected) but we keep the param for backward
     compat with the existing call sites. */
  void players;

  return {
    localMuted,
    toggleMute,
    deafened,
    toggleDeafen,
    error,
    micState,
    speakingPeers,
    connectedPeers,
    localSpeaking,
    localLevel,
  };
}

/* See ConnectionState/Track exports — keeps ESLint happy when these are
   imported but only used as types/constants conditionally. */
void ConnectionState;
