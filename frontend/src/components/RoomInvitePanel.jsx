import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { API_BASE_URL, authHeaders } from '../lib/api';

const glassPanel = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.09)',
};

const INVITE_RESEND_COOLDOWN_MS = 30_000;

function cooldownSecondsLeft(untilMs) {
  if (!untilMs) return 0;
  return Math.max(0, Math.ceil((untilMs - Date.now()) / 1000));
}

function PanelAvatar({ name, url, size, accent }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `${accent}14`,
        border: `1.5px solid ${accent}55`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 700,
        color: accent,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {url ? (
        <img src={url} alt={name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        (name || '?').charAt(0).toUpperCase()
      )}
    </div>
  );
}

/**
 * Match lobby right column: friends (online first) + search any player + room invite.
 */
export default function RoomInvitePanel({
  token,
  roomCode,
  user,
  friends = [],
  room,
  accent,
  secondary,
  fontFamily = "'Space Grotesk',sans-serif",
  onInviteSent,
  onInviteError,
}) {
  const [playerSearch, setPlayerSearch] = useState('');
  const [searchHits, setSearchHits] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [inviteSent, setInviteSent] = useState(null);
  const [inviteCooldownUntil, setInviteCooldownUntil] = useState({});
  const [, setCooldownTick] = useState(0);

  useEffect(() => {
    const ids = Object.keys(inviteCooldownUntil);
    if (ids.length === 0) return undefined;
    const t = setInterval(() => setCooldownTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [inviteCooldownUntil]);

  const friendIds = useMemo(() => new Set((friends || []).map((f) => f.id)), [friends]);

  const sortedFriends = useMemo(() => {
    return [...(friends || [])]
      .filter((f) => f.id !== user?.id)
      .sort((a, b) => {
        const ao = a.status === 'online' ? 1 : 0;
        const bo = b.status === 'online' ? 1 : 0;
        return bo - ao;
      });
  }, [friends, user?.id]);

  useEffect(() => {
    const q = playerSearch.trim();
    if (q.length < 2) {
      setSearchHits([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearchBusy(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/lobby/friends/search?q=${encodeURIComponent(q)}&for=room_invite`,
          { headers: authHeaders(token) }
        );
        if (!res.ok) {
          setSearchHits([]);
          return;
        }
        const data = await res.json();
        setSearchHits((Array.isArray(data) ? data : []).filter((u) => !friendIds.has(u.id)));
      } catch {
        setSearchHits([]);
      } finally {
        setSearchBusy(false);
      }
    }, 320);
    return () => clearTimeout(t);
  }, [playerSearch, token, friendIds]);

  const sendInvite = useCallback(
    async (target) => {
      if (!roomCode || inviteSent === target.id) return;
      const inRoom = room?.players?.some((p) => p.id === target.id);
      if (inRoom) return;
      if (cooldownSecondsLeft(inviteCooldownUntil[target.id]) > 0) return;
      setInviteSent(target.id);
      try {
        const res = await fetch(`${API_BASE_URL}/rooms/invite`, {
          method: 'POST',
          headers: authHeaders(token, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({ friend_id: target.id, room_code: roomCode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invite failed');
        onInviteSent?.(target.name);
        setInviteCooldownUntil((prev) => ({
          ...prev,
          [target.id]: Date.now() + INVITE_RESEND_COOLDOWN_MS,
        }));
      } catch (e) {
        onInviteError?.(e.message || 'Invite failed');
      } finally {
        setInviteSent(null);
      }
    },
    [roomCode, token, room?.players, inviteSent, inviteCooldownUntil, onInviteSent, onInviteError]
  );

  return (
    <div
      style={{
        ...glassPanel,
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: 420,
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          color: '#fff',
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        👥 Invite players
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.35)',
            padding: '10px 16px 6px',
          }}
        >
          Friends
        </div>
        {sortedFriends.length === 0 && (
          <div style={{ padding: '8px 16px 12px', textAlign: 'center', color: 'rgba(255,255,255,0.28)', fontSize: 12 }}>
            No friends yet — search below to invite anyone.
          </div>
        )}
        {sortedFriends.map((friend) => {
          const inRoom = room?.players?.some((p) => p.id === friend.id);
          const online = friend.status === 'online';
          const waitSec = cooldownSecondsLeft(inviteCooldownUntil[friend.id]);
          const busy = inviteSent === friend.id;
          return (
            <div
              key={friend.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <PanelAvatar name={friend.name} url={friend.avatar_url} size={32} accent={accent} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 13,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {friend.name}
                </div>
                <div style={{ fontSize: 10, color: online ? secondary : 'rgba(255,255,255,0.32)' }}>
                  {online ? '● Online' : 'Offline'} · @{friend.gamer_tag}
                </div>
              </div>
              {inRoom ? (
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Joined
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => sendInvite(friend)}
                  disabled={busy || waitSec > 0}
                  style={{
                    background: busy || waitSec > 0 ? `${secondary}18` : `${accent}12`,
                    color: busy || waitSec > 0 ? secondary : accent,
                    border: `1px solid ${busy || waitSec > 0 ? secondary + '55' : accent + '40'}`,
                    borderRadius: 8,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: busy || waitSec > 0 ? 'default' : 'pointer',
                  }}
                >
                  {busy ? 'Sending…' : waitSec > 0 ? `${waitSec}s` : 'Invite'}
                </button>
              )}
            </div>
          );
        })}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '8px 12px' }} />

        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.35)',
            padding: '4px 16px 8px',
          }}
        >
          Search anyone
        </div>
        <div style={{ padding: '0 12px 10px' }}>
          <input
            value={playerSearch}
            onChange={(e) => setPlayerSearch(e.target.value)}
            placeholder="Name, gamer tag, or email (2+ chars)"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'rgba(0,0,0,0.28)',
              border: `1px solid ${accent}28`,
              borderRadius: 8,
              padding: '8px 10px',
              color: '#fff',
              fontSize: 12,
              fontFamily,
              outline: 'none',
            }}
          />
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>
            Invite players who are not on your friends list yet.
          </div>
        </div>

        {searchBusy && (
          <div style={{ padding: '4px 16px 8px', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Searching…</div>
        )}
        {!searchBusy && playerSearch.trim().length >= 2 && searchHits.length === 0 && (
          <div style={{ padding: '4px 16px 12px', fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>No matches.</div>
        )}
        {searchHits.map((hit) => {
          const inRoom = room?.players?.some((p) => p.id === hit.id);
          const waitSec = cooldownSecondsLeft(inviteCooldownUntil[hit.id]);
          const busy = inviteSent === hit.id;
          return (
            <div
              key={hit.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <PanelAvatar name={hit.name} url={hit.avatar_url} size={32} accent={accent} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 13,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {hit.name}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>@{hit.gamer_tag}</div>
              </div>
              {inRoom ? (
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Joined
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => sendInvite(hit)}
                  disabled={busy || waitSec > 0}
                  style={{
                    background: busy || waitSec > 0 ? `${secondary}18` : `${accent}12`,
                    color: busy || waitSec > 0 ? secondary : accent,
                    border: `1px solid ${busy || waitSec > 0 ? secondary + '55' : accent + '40'}`,
                    borderRadius: 8,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: busy || waitSec > 0 ? 'default' : 'pointer',
                  }}
                >
                  {busy ? 'Sending…' : waitSec > 0 ? `${waitSec}s` : 'Invite'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
