import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import getEcho from '../lib/echo';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, authHeaders } from '../lib/api';

const LIME = '#ccff00';
const GREEN = '#10b981';
const INVITE_RESPONSE_TIMEOUT_MS = 30_000;
const MotionDiv = motion.div;

const INVITE_GAME_LABEL = {
  snake: 'Snake Championship',
  memory: 'Memory Match',
  tic_tac_toe: 'Tic Tac Toe',
  reaction: 'Reaction Speed',
  number: 'Number Guessing',
  word_blitz: 'Word Blitz',
  chess: 'Chess Blitz',
  color_surge: 'Color Surge',
  math_rush: 'Math Rush',
  math_maze: 'Math Maze',
  ability_duels: 'Ability Duels',
};

const glass = {
  background: 'rgba(20,20,25,0.85)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.15)',
  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
};

function mergeInvitesByRoom(prev, incoming) {
  const map = new Map();
  for (const p of prev) map.set(p.room_code, p);
  for (const s of incoming) {
    const previous = map.get(s.room_code);
    const expiresAtMs = Date.parse(s.expires_at || '') || previous?.expiresAtMs || Date.now() + INVITE_RESPONSE_TIMEOUT_MS;
    map.set(s.room_code, { ...previous, ...s, expiresAtMs });
  }
  return [...map.values()];
}

function inviteSecondsLeft(invite) {
  return Math.max(0, Math.ceil(((invite?.expiresAtMs || 0) - Date.now()) / 1000));
}

function inFriendRoomPath(pathname, search, roomCode) {
  if (!roomCode) return false;
  const params = new URLSearchParams(search);
  const r = params.get('room');
  if (!r || r.toUpperCase() !== String(roomCode).toUpperCase()) return false;
  return pathname === '/match-room' || pathname === '/memory-match-room';
}

const GlobalInviteListener = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [invites, setInvites] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [joining, setJoining] = useState(false);
  const [inviteTick, setInviteTick] = useState(0);

  useEffect(() => {
    if (!user || !token) return;

    const fetchPendingInvites = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/lobby/game-invites/pending`, {
          headers: authHeaders(token),
        });
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data.invites) ? data.invites : [];
        setInvites((prev) => {
          const serverCodes = new Set(list.map((i) => i.room_code));
          const echoOnly = prev.filter(
            (p) => !serverCodes.has(p.room_code) && p.invite_id == null
          );
          return mergeInvitesByRoom(echoOnly, list);
        });
      } catch {
        /* ignore */
      }
    };

    fetchPendingInvites();
    const poll = setInterval(fetchPendingInvites, 4000);

    const echo = getEcho();
    if (!echo) {
      return () => clearInterval(poll);
    }

    const channel = echo.private(`user.${user.id}`);

    channel.listen('.game.invite', (data) => {
      const inv = data.inviter;
      if (!inv?.room_code) return;
      if (inFriendRoomPath(location.pathname, location.search, inv.room_code)) return;

      setInvites((prev) => mergeInvitesByRoom(prev, [inv]));
    });

    channel.listen('.friend.request', (data) => {
      setFriendRequests((prev) => [...prev, data.requester]);
    });

    return () => {
      clearInterval(poll);
      echo.leave(`user.${user.id}`);
    };
  }, [user, token, location.pathname, location.search]);

  const handleAccept = async (invite) => {
    if (joining) return;
    const rawCode = String(invite?.room_code ?? '').trim();
    if (!rawCode) {
      alert('Invalid room code.');
      return;
    }
    const roomCodePath = encodeURIComponent(rawCode);
    setJoining(true);

    try {
      const res = await fetch(`${API_BASE_URL}/rooms/${roomCodePath}/join`, {
        method: 'POST',
        headers: authHeaders(token, { 'Content-Type': 'application/json' }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        /* non-JSON body */
      }

      if (!res.ok) {
        const msg = data.error || data.message || `Could not join room (HTTP ${res.status}).`;
        alert(msg);
        return;
      }

      removeInvite(rawCode);
      const g = encodeURIComponent(invite.game || 'snake');
      const gameRoute = invite.game === 'memory' ? '/memory-match-room' : '/match-room';
      navigate(`${gameRoute}?mode=friend&room=${encodeURIComponent(rawCode)}&game=${g}`);
    } catch (err) {
      console.error(err);
      alert('Network error while joining match.');
    } finally {
      setJoining(false);
    }
  };

  const removeInvite = (roomCode) => {
    setInvites((prev) => prev.filter((inv) => inv.room_code !== roomCode));
  };

  const declineInvite = async (invite) => {
    if (!token) {
      removeInvite(invite.room_code);
      return;
    }
    try {
      const body = invite.invite_id
        ? { invite_id: invite.invite_id }
        : { room_code: invite.room_code };
      await fetch(`${API_BASE_URL}/lobby/game-invites/decline`, {
        method: 'POST',
        headers: authHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
      });
    } catch {
      /* still dismiss locally */
    } finally {
      removeInvite(invite.room_code);
    }
  };

  useEffect(() => {
    if (invites.length === 0) return undefined;
    const timer = setInterval(() => setInviteTick((tick) => tick + 1), 1000);
    return () => clearInterval(timer);
  }, [invites.length]);

  useEffect(() => {
    const expired = invites.filter((invite) => invite.expiresAtMs && invite.expiresAtMs <= Date.now());
    expired.forEach(async (invite) => {
      if (!token) {
        removeInvite(invite.room_code);
        return;
      }
      try {
        const body = invite.invite_id
          ? { invite_id: invite.invite_id }
          : { room_code: invite.room_code };
        await fetch(`${API_BASE_URL}/lobby/game-invites/decline`, {
          method: 'POST',
          headers: authHeaders(token, { 'Content-Type': 'application/json' }),
          body: JSON.stringify(body),
        });
      } catch {
        /* still dismiss locally */
      } finally {
        removeInvite(invite.room_code);
      }
    });
  }, [invites, inviteTick, token]);

  const handleAcceptFriend = async (requester) => {
    try {
      const res = await fetch(`${API_BASE_URL}/lobby/friends/accept`, {
        method: 'POST',
        headers: authHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ sender_id: requester.id })
      });
      if (res.ok) {
        removeFriendRequest(requester.id);
        window.dispatchEvent(new Event('friend-list-updated'));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to accept friend request');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while accepting friend request.');
    }
  };

  const handleRejectFriend = async (requester) => {
    try {
      await fetch(`${API_BASE_URL}/lobby/friends/reject`, {
        method: 'POST',
        headers: authHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ sender_id: requester.id })
      });
    } catch (err) {
      console.error(err);
    } finally {
      removeFriendRequest(requester.id);
    }
  };

  const removeFriendRequest = (id) => {
    setFriendRequests(prev => prev.filter(req => req.id !== id));
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <AnimatePresence>
        {invites.map((invite) => {
          const secondsLeft = inviteSecondsLeft(invite);
          return (
          <MotionDiv
            key={invite.room_code}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            style={{
              ...glass,
              borderRadius: 16,
              padding: '16px 20px',
              width: 320,
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: 'rgba(204,255,0,0.1)', border: `1.5px solid ${LIME}60`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: LIME, fontWeight: 700, fontSize: 16, overflow: 'hidden', flexShrink: 0
              }}>
                {invite.avatar_url ? (
                  <img src={invite.avatar_url} alt={invite.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (invite.name || '?').charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div style={{ fontSize: 11, color: LIME, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 2 }}>Game Invite</div>
                <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>
                  <span style={{ color: LIME }}>{invite.name}</span> invited you to play {INVITE_GAME_LABEL[invite.game] || 'ApexNova'}!
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                  Auto-cancels in {secondsLeft}s
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => handleAccept(invite)}
                disabled={joining}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg, ${LIME}, ${GREEN})`,
                  color: '#000', fontWeight: 800, fontSize: 14,
                  opacity: joining ? 0.7 : 1
                }}
              >
                {joining ? 'Joining...' : 'Accept'}
              </button>
              <button
                type="button"
                onClick={() => declineInvite(invite)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
                  color: '#fff', fontWeight: 600, fontSize: 14
                }}
              >
                Reject
              </button>
            </div>
          </MotionDiv>
          );
        })}

        {friendRequests.map((req) => (
          <MotionDiv
            key={req.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            style={{
              ...glass,
              borderRadius: 16,
              padding: '16px 20px',
              width: 320,
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: 'rgba(204,255,0,0.1)', border: `1.5px solid ${LIME}60`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: LIME, fontWeight: 700, fontSize: 16, overflow: 'hidden', flexShrink: 0
              }}>
                {req.avatar_url ? (
                  <img src={req.avatar_url} alt={req.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (req.name || '?').charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div style={{ fontSize: 11, color: LIME, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 2 }}>Friend Request</div>
                <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>
                  <span style={{ color: LIME }}>{req.gamer_tag}</span> sent you a friend request!
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => handleAcceptFriend(req)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg, ${LIME}, ${GREEN})`,
                  color: '#000', fontWeight: 800, fontSize: 14
                }}
              >
                Accept
              </button>
              <button
                onClick={() => handleRejectFriend(req)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
                  color: '#fff', fontWeight: 600, fontSize: 14
                }}
              >
                Reject
              </button>
            </div>
          </MotionDiv>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default GlobalInviteListener;
