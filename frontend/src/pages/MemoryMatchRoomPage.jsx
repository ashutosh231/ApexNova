import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, authHeaders } from '../lib/api';
import { useRoomChannel } from '../hooks/useRoomChannel';
import PixelMemoryGame from '../components/PixelMemoryGame';
import RoomInvitePanel from '../components/RoomInvitePanel';
import { getTournamentConfig, syncSessionFromTournament } from '../data/tournamentConfig.js';

const CYAN = '#00ffff';
const PINK = '#ff00ff';
const PURPLE = '#bd00ff';
const MONO = "'JetBrains Mono', monospace";

/* ── Pixel Avatar ────────────────────────────── */
const Avatar = ({ name, url, size = 40, accent = CYAN, glow = false }) => (
  <div className={glow ? 'avatar-glow' : ''} style={{ '--av-color': accent, position: 'relative', flexShrink: 0 }}>
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: `${accent}1a`,
      border: `2px solid ${accent}55`,
      display: 'grid', placeItems: 'center',
      fontSize: size * 0.4, fontWeight: 800, color: accent,
      overflow: 'hidden',
      boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.4)`,
    }}>
      {url
        ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (name || '?').charAt(0).toUpperCase()
      }
    </div>
  </div>
);

/* ════════════════════════════════════════════
   PHASE 1 — MODE SELECTION
═══════════════════════════════════════════ */
const ModeSelection = ({ onSolo, onFriend, title }) => (
  <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: '60px 24px 80px' }}>
    <div style={{ textAlign: 'center', marginBottom: 50 }}>
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="arena-pill"
        style={{
          marginBottom: 18, color: CYAN,
          background: `${CYAN}10`, borderColor: `${CYAN}40`,
          fontFamily: MONO,
        }}
      >
        <span className="arena-dot" />
        {title}
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{
          margin: 0, fontWeight: 900, color: '#fff',
          fontSize: 'clamp(2.4rem, 6vw, 4.8rem)',
          letterSpacing: '-0.06em', lineHeight: 0.95,
        }}
      >
        Choose{' '}
        <span style={{
          background: `linear-gradient(105deg, ${CYAN}, ${PINK})`,
          WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
          fontStyle: 'italic',
        }}>your</span>{' '}
        path
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        style={{ marginTop: 18, color: 'rgba(235,235,235,0.55)', fontSize: 16 }}
      >
        Test your recall vs. silicon, or sync up with friends in real-time.
      </motion.p>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
      {[
        {
          title: 'Memory vs CPU', desc: 'Solo grind against an adaptive memory bot. Score uploads to the global leaderboard.',
          icon: 'tabler:robot', cta: 'Start mission', action: onSolo, accent: CYAN, accent2: '#00b8d4',
        },
        {
          title: 'Memory vs Friends', desc: 'Sync up with up to 3 friends in real-time. Best recall wins prestige.',
          icon: 'lucide:users', cta: 'Open lobby', action: onFriend, accent: PINK, accent2: PURPLE,
        },
      ].map(({ title: cardTitle, desc, icon, cta, action, accent, accent2 }, i) => (
        <motion.div
          key={cardTitle}
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 + i * 0.1 }}
          className="mode-card"
          style={{
            '--mc-glow': accent, '--mc-glow-2': accent2,
            '--mc-bloom': `${accent}25`, '--mc-bloom-2': `${accent2}18`,
            minHeight: 320, cursor: 'pointer',
          }}
          onClick={action}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && action()}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <div className="mode-card-icon" style={{ '--mc-glow': accent, borderRadius: 16 }}>
              <iconify-icon icon={icon} width="40" />
            </div>
            <span className="arena-pill" style={{ background: `${accent}10`, borderColor: `${accent}40`, color: accent }}>
              <span className="arena-dot" /> {i === 0 ? 'Solo' : 'Versus'}
            </span>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 28, position: 'relative', zIndex: 1 }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em' }}>
              {cardTitle}
            </h2>
            <p style={{ margin: '10px 0 18px', color: 'rgba(235,235,235,0.55)', fontSize: 14, lineHeight: 1.55 }}>
              {desc}
            </p>
            <button
              className="arena-btn"
              style={{ '--btn-color': accent, '--btn-color-2': accent2, color: i === 0 ? '#000' : '#fff' }}
              onClick={(e) => { e.stopPropagation(); action(); }}
            >
              <iconify-icon icon={i === 0 ? 'lucide:play-circle' : 'lucide:swords'} width="18" />
              {cta}
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

/* ════════════════════════════════════════════
   PHASE 2 — MATCH LOBBY (Friend Room)
═══════════════════════════════════════════ */
const MatchLobby = ({ token, user, initialRoomCode, onMatchStart, onBack, lobbyTitle }) => {
  const [roomCode] = useState(initialRoomCode || '');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [friends, setFriends] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const msgEndRef = useRef(null);
  const countdownStarted = useRef(false);

  const { room, setRoom, messages, setMessages } = useRoomChannel(roomCode || null);

  const api = useCallback(async (path, method = 'GET', body = null) => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method, headers: authHeaders(token, body ? { 'Content-Type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : null,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
    return data;
  }, [token]);

  useEffect(() => {
    if (roomCode) {
      api(`/rooms/${roomCode}/messages`).then((d) => setMessages(d.messages || [])).catch(() => {});
      api(`/rooms/${roomCode}`).then((d) => setRoom(d.room)).catch(() => setError('Failed to load room'));
      api(`/lobby/overview`).then((d) => setFriends(d.friends || [])).catch(() => {});
    }
  }, [roomCode, api, setMessages, setRoom]);

  useEffect(() => {
    if (!roomCode) return undefined;
    const poll = setInterval(async () => {
      try { const d = await api(`/rooms/${roomCode}`); setRoom(d.room); } catch { /* silent */ }
    }, 2000);
    return () => clearInterval(poll);
  }, [roomCode, api, setRoom]);

  useEffect(() => {
    if (!roomCode) return undefined;
    const pollChat = setInterval(async () => {
      try { const d = await api(`/rooms/${roomCode}/messages`); setMessages(d.messages || []); } catch { /* silent */ }
    }, 3000);
    return () => clearInterval(pollChat);
  }, [roomCode, api, setMessages]);

  const toggleReady = async () => {
    setError('');
    try { const d = await api(`/rooms/${roomCode}/ready`, 'POST'); setRoom(d.room); }
    catch (e) { setError(e.message); }
  };

  const refreshRoom = async () => {
    if (!roomCode) return;
    try { const d = await api(`/rooms/${roomCode}`); setRoom(d.room); }
    catch { setError('Failed to refresh room'); }
  };

  const startMatch = async () => {
    setStarting(true); setError('');
    try { await api(`/rooms/${roomCode}/start`, 'POST'); }
    catch (e) { setError(e.message); setStarting(false); }
  };

  const sendMsg = async () => {
    if (!msg.trim() || sending) return;
    setSending(true);
    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      id: tempId, user_id: user.id, name: user.name,
      gamer_tag: user.gamer_tag, avatar_url: user.avatar_url,
      message: msg.trim(), created_at: new Date().toISOString(), isMe: true,
    };
    setMessages((p) => [...p, optimistic]);
    setMsg('');
    try {
      await api(`/rooms/${roomCode}/chat`, 'POST', { message: optimistic.message });
      const d = await api(`/rooms/${roomCode}/messages`);
      setMessages(d.messages || []);
    } catch { /* keep optimistic */ }
    finally { setSending(false); }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard denied */ }
  };

  const roomRef = useRef(room);
  useEffect(() => { roomRef.current = room; }, [room]);

  useEffect(() => {
    if (room?.status !== 'active') {
      countdownStarted.current = false;
      return;
    }
    if (countdownStarted.current) return;
    countdownStarted.current = true;
    setCountdown(3);
    let n = 3;
    const iv = setInterval(() => {
      n--;
      if (n === 0) {
        clearInterval(iv);
        setCountdown(null);
        onMatchStart(roomCode, roomRef.current);
      } else {
        setCountdown(n);
      }
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status]);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const me = room?.players?.find((p) => p.id === user?.id);
  const isHost = room?.players?.find((p) => p.is_host)?.id === user?.id;
  const allReady = room?.players?.length > 1 && room?.players?.every((p) => p.ready);

  if (!roomCode) {
    return (
      <div style={{ maxWidth: 540, margin: '60px auto', padding: '24px', textAlign: 'center' }}>
        <div className="arena-card" style={{ padding: 36 }}>
          <div style={{ fontSize: 38, marginBottom: 8 }}>🚪</div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 26, fontWeight: 800 }}>Lobby unavailable</h2>
          <p style={{ marginTop: 8, color: 'rgba(235,235,235,0.5)' }}>Invalid or missing room code.</p>
          <button onClick={onBack} className="arena-btn" style={{ marginTop: 20, '--btn-color': CYAN, '--btn-color-2': PINK }}>
            Return to Lobby →
          </button>
        </div>
      </div>
    );
  }

  const leaveRoom = async () => {
    try { await fetch(`${API_BASE_URL}/rooms/${roomCode}/leave`, { method: 'POST', headers: authHeaders(token) }); } catch { /* ignore */ }
    onBack();
  };

  const playerCount = room?.players?.length || 0;
  const readyCount = room?.players?.filter((p) => p.ready).length || 0;
  const readyPct = playerCount ? (readyCount / playerCount) * 100 : 0;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 24px 80px' }}>
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 24, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            style={{
              position: 'fixed', top: 0, left: '50%', zIndex: 9999,
              background: 'rgba(0,255,255,0.10)', backdropFilter: 'blur(14px)',
              border: `1px solid ${CYAN}55`, padding: '12px 22px', borderRadius: 999,
              color: CYAN, fontWeight: 700, fontSize: 13,
              boxShadow: `0 14px 50px ${CYAN}30`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}
          >
            <span className="arena-dot" />
            {toastMsg}
            <button
              onClick={() => setToastMsg('')}
              style={{ background: 'none', border: 'none', color: CYAN, opacity: 0.6, cursor: 'pointer', padding: 0, marginLeft: 6, fontSize: 14 }}
            >✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Countdown */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="countdown-overlay"
            style={{ '--cd-color': CYAN }}
          >
            <div className="countdown-ring" style={{ '--cd-color': `${CYAN}55` }} />
            <div className="countdown-ring" style={{ '--cd-color': `${PINK}55`, animationDelay: '0.4s' }} />
            <div style={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
              <div style={{ fontFamily: MONO, fontSize: 13, color: CYAN, textTransform: 'uppercase', letterSpacing: '0.32em', marginBottom: 14 }}>
                Match Starting
              </div>
              <motion.div
                key={countdown}
                initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="countdown-number"
                style={{ '--cd-color': CYAN }}
              >
                {countdown}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top status row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.4)', marginBottom: 4 }}>
            Sync briefing
          </div>
          <h1 style={{ margin: 0, color: '#fff', fontWeight: 900, fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', letterSpacing: '-0.04em' }}>
            {lobbyTitle}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <motion.button
            onClick={copyCode}
            whileTap={{ scale: 0.97 }}
            className="room-code-display"
            style={{ '--rc-accent': `${CYAN}66` }}
          >
            <div>
              <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.45)' }}>
                Room code
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '0.18em', marginTop: 2 }}>
                {roomCode}
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: copied ? PINK : CYAN, fontFamily: MONO, letterSpacing: '0.1em' }}>
              {copied ? '✓ COPIED' : 'COPY'}
            </span>
          </motion.button>
          <button onClick={refreshRoom} className="arena-btn-ghost" style={{ color: CYAN, borderColor: `${CYAN}40`, background: `${CYAN}0a` }}>
            <iconify-icon icon="lucide:refresh-cw" width="14" /> Refresh
          </button>
          <button onClick={leaveRoom} className="arena-btn-ghost">Leave</button>
        </div>
      </div>

      {error && (
        <div className="arena-card" style={{ padding: '12px 16px', marginBottom: 18, color: '#f87171', borderColor: 'rgba(248,113,113,0.30)', background: 'rgba(248,113,113,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <iconify-icon icon="lucide:alert-circle" width="18" />
          <span style={{ fontSize: 13 }}>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(280px, 1fr) minmax(280px, 1fr)', gap: 16 }}>
        {/* Players */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="arena-card-glow arena-card" style={{ '--glow-color': `${CYAN}88`, '--glow-color-2': `${PINK}66`, padding: 0 }}>
            <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🧠</span>
                <span style={{ fontWeight: 800, color: '#fff', fontSize: 15 }}>Roster</span>
                <span className="arena-pill" style={{ fontSize: 9 }}>
                  {playerCount} / 4
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontFamily: MONO, color: 'rgba(235,235,235,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: PINK, boxShadow: `0 0 8px ${PINK}` }} />
                {readyCount}/{playerCount} ready
              </div>
            </div>

            <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${readyPct}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: '100%', background: `linear-gradient(90deg, ${CYAN}, ${PINK})`, boxShadow: `0 0 12px ${CYAN}` }}
              />
            </div>

            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(room?.players || []).map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`player-tile ${p.id === user?.id ? 'is-self' : ''} ${p.ready ? 'is-ready' : ''}`}
                >
                  <Avatar name={p.name} url={p.avatar_url} size={42} accent={p.id === user?.id ? CYAN : '#fff'} glow={p.id === user?.id} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontWeight: 700, fontSize: 14 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                      {p.is_host && (
                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 999, background: 'rgba(255,215,0,0.10)', border: '1px solid rgba(255,215,0,0.30)', color: '#FFD700', fontFamily: MONO, letterSpacing: '0.1em' }}>HOST</span>
                      )}
                      {p.id === user?.id && (
                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 999, background: `${CYAN}15`, border: `1px solid ${CYAN}35`, color: CYAN, fontFamily: MONO, letterSpacing: '0.1em' }}>YOU</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(235,235,235,0.45)', marginTop: 2 }}>@{p.gamer_tag}</div>
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 700, fontFamily: MONO, letterSpacing: '0.08em',
                    padding: '5px 12px', borderRadius: 999,
                    background: p.ready ? `${PINK}18` : 'rgba(255,255,255,0.05)',
                    color: p.ready ? PINK : 'rgba(235,235,235,0.45)',
                    border: `1px solid ${p.ready ? `${PINK}50` : 'rgba(255,255,255,0.10)'}`,
                  }}>
                    {p.ready ? '✓ READY' : 'WAITING'}
                  </div>
                </motion.div>
              ))}

              {Array.from({ length: Math.max(0, 4 - playerCount) }).map((_, i) => (
                <div key={`empty-${i}`} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 14,
                  border: '1px dashed rgba(255,255,255,0.08)',
                  color: 'rgba(235,235,235,0.25)', fontSize: 13, fontStyle: 'italic',
                }}>
                  <div style={{ width: 42, height: 42, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.12)', display: 'grid', placeItems: 'center', fontSize: 14 }}>
                    +
                  </div>
                  Empty slot
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={toggleReady}
              className={me?.ready ? 'arena-btn-ghost' : 'arena-btn'}
              style={{
                flex: 1,
                ...(me?.ready ? {} : { '--btn-color': CYAN, '--btn-color-2': PINK }),
                padding: '14px 22px', fontSize: 15,
              }}
            >
              {me?.ready ? '✕ Cancel ready' : '✓ Ready up'}
            </button>
            {isHost && (
              <button
                onClick={startMatch}
                disabled={!allReady || starting}
                className="arena-btn"
                style={{ flex: 1, '--btn-color': PINK, '--btn-color-2': PURPLE, padding: '14px 22px', fontSize: 15, color: '#fff' }}
              >
                {starting ? '⟳ Starting…' : '▶ Start match'}
              </button>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="arena-card" style={{ display: 'flex', flexDirection: 'column', height: 480 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>💬</span>
            <span style={{ fontWeight: 800, color: '#fff', fontSize: 14 }}>Squad chat</span>
            <span className="arena-pill" style={{ marginLeft: 'auto', fontSize: 9 }}>
              {messages.length} msg
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.length === 0 && (
              <div style={{ color: 'rgba(235,235,235,0.30)', fontSize: 12, textAlign: 'center', marginTop: 20, fontStyle: 'italic' }}>
                Be the first to say GG.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={m.id || i} className={`chat-bubble ${m.user_id === user?.id ? 'is-me' : ''}`} style={m.user_id === user?.id ? { background: `${CYAN}10`, borderColor: `${CYAN}30` } : undefined}>
                <Avatar name={m.name} url={m.avatar_url} size={26} accent={m.user_id === user?.id ? CYAN : '#fff'} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: m.user_id === user?.id ? CYAN : `hsl(${(i * 73) % 360}, 65%, 75%)`, marginBottom: 2 }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(235,235,235,0.85)', lineHeight: 1.4 }}>{m.message}</div>
                </div>
              </div>
            ))}
            <div ref={msgEndRef} />
          </div>

          <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
              placeholder="Say GG…"
              style={{
                flex: 1, minWidth: 0,
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '9px 12px',
                color: '#fff', fontSize: 13,
                outline: 'none', fontFamily: 'inherit',
              }}
              onFocus={(e) => (e.target.style.borderColor = `${CYAN}55`)}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
            <button
              onClick={sendMsg}
              disabled={sending || !msg.trim()}
              style={{
                background: msg.trim() ? `linear-gradient(135deg, ${CYAN}, ${PINK})` : 'rgba(255,255,255,0.05)',
                border: 'none', borderRadius: 10, width: 36, height: 36,
                cursor: msg.trim() ? 'pointer' : 'not-allowed',
                display: 'grid', placeItems: 'center',
                opacity: msg.trim() ? 1 : 0.5,
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={msg.trim() ? '#000' : '#fff'} strokeWidth="2.5">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Invite */}
        <RoomInvitePanel
          token={token}
          roomCode={roomCode}
          user={user}
          friends={friends}
          room={room}
          accent={CYAN}
          secondary={PINK}
          fontFamily="'Space Grotesk', sans-serif"
          onInviteSent={(name) => {
            setToastMsg(`Invite sent to ${name}!`);
            setTimeout(() => setToastMsg(''), 4000);
          }}
          onInviteError={(m) => setError(m)}
        />
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════
   PHASE 3 — GAME SCREEN
═══════════════════════════════════════════ */
const GameScreen = ({ token, user, roomCode, isSolo, onFinished }) => {
  const [submitted, setSubmitted] = useState(false);
  const { room } = useRoomChannel(roomCode);

  useEffect(() => {
    if (room?.status === 'finished' && !isSolo) onFinished(room);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status]);

  const handleGameOver = useCallback(async (score) => {
    if (submitted) return;
    setSubmitted(true);
    try {
      if (isSolo) {
        const res = await fetch(`${API_BASE_URL}/profile/score`, {
          method: 'POST',
          headers: authHeaders(token, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({ score, game: 'memory' }),
        });
        const data = await res.json();
        onFinished({ status: 'finished', players: [{ id: user?.id, name: user?.name, avatar_url: user?.avatar_url, score, is_host: true }], points_earned: data.points_earned });
      } else if (roomCode) {
        const res = await fetch(`${API_BASE_URL}/rooms/${roomCode}/score`, {
          method: 'POST',
          headers: authHeaders(token, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({ score }),
        });
        const data = await res.json();
        if (data.finished) onFinished(data.room);
      }
    } catch { onFinished(null); }
  }, [submitted, isSolo, roomCode, token, user, onFinished]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', minHeight: '70vh', justifyContent: 'center' }}>
      <PixelMemoryGame playerName={user?.name || 'You'} onGameOver={handleGameOver} autoStart={true} allowRestart={isSolo} />
      {submitted && !isSolo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 22, padding: '12px 22px', borderRadius: 999,
            background: `${CYAN}15`, border: `1px solid ${CYAN}40`,
            color: CYAN, fontSize: 13, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: 10,
            fontFamily: MONO, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}
        >
          <span className="arena-dot" />
          Score submitted — waiting for opponents
        </motion.div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════
   PHASE 4 — RESULTS (podium + confetti)
═══════════════════════════════════════════ */
const ResultScreen = ({ room, user, onPlayAgain, onLobby, roomCode }) => {
  const { room: liveRoom } = useRoomChannel(roomCode, room);

  useEffect(() => {
    if (liveRoom?.status === 'waiting') onPlayAgain(true);
  }, [liveRoom?.status, onPlayAgain]);

  const players = useMemo(
    () => [...(room?.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0)),
    [room]
  );
  const winner = players[0];
  const meIndex = players.findIndex((p) => p.id === user?.id);
  const myRankLabel = meIndex < 0 ? '—' : `#${meIndex + 1}`;
  const meWon = meIndex === 0 && players.length > 1;

  const confettiColors = [CYAN, PINK, '#FFD700', PURPLE, '#00f0ff', '#fb7185'];

  return (
    <div style={{ position: 'relative', minHeight: '70vh', overflow: 'hidden' }}>
      {meWon && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {Array.from({ length: 30 }).map((_, i) => {
            const left = (i * 31) % 100;
            const delay = (i % 12) * 0.18;
            const color = confettiColors[i % confettiColors.length];
            const xOff = ((i * 47) % 80) - 40;
            return (
              <span
                key={i}
                className="confetti-piece"
                style={{
                  left: `${left}%`,
                  top: 0,
                  background: color,
                  animationDelay: `${delay}s`,
                  '--cf-x': `${xOff}px`,
                  boxShadow: `0 0 8px ${color}`,
                }}
              />
            );
          })}
        </div>
      )}

      <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto', padding: '60px 24px 40px' }}>
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 36 }}>
          <motion.div
            initial={{ scale: 0.4, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            style={{ fontSize: 64, marginBottom: 10, filter: 'drop-shadow(0 6px 20px rgba(255,215,0,0.5))' }}
          >
            {meWon ? '🏆' : meIndex === 1 ? '🥈' : meIndex === 2 ? '🥉' : '🎯'}
          </motion.div>
          <div className="arena-pill" style={{ background: `${CYAN}10`, borderColor: `${CYAN}40`, color: CYAN, marginBottom: 12 }}>
            <span className="arena-dot" /> Match complete
          </div>
          <h2 style={{ margin: 0, color: '#fff', fontWeight: 900, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.05em' }}>
            {meWon ? 'Victory' : meIndex === 0 && players.length === 1 ? 'Run finished' : 'Match over'}
          </h2>
          <div style={{ marginTop: 8, color: 'rgba(235,235,235,0.55)', fontSize: 15 }}>
            You finished <strong style={{ color: CYAN }}>{myRankLabel}</strong>
            {winner && players.length > 1 && (
              <> — congrats to <strong style={{ color: '#FFD700' }}>{winner.name}</strong></>
            )}
          </div>
        </motion.div>

        {players.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="podium"
            style={{ marginBottom: 30 }}
          >
            {[1, 0, 2].map((idx) => {
              const p = players[idx];
              if (!p) return <div key={idx} />;
              const cls = idx === 0 ? 'podium-1' : idx === 1 ? 'podium-2' : 'podium-3';
              return (
                <motion.div
                  key={p.id}
                  initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + idx * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className={`podium-step ${cls}`}
                >
                  <Avatar name={p.name} url={p.avatar_url} size={52} accent={idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : '#CD7F32'} glow={idx === 0} />
                  <div className="podium-rank" style={{ marginTop: 10, color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : '#CD7F32' }}>
                    {['🥇', '🥈', '🥉'][idx]}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </div>
                  <div style={{ marginTop: 4, fontFamily: MONO, fontSize: 18, fontWeight: 800, color: idx === 0 ? '#FFD700' : '#fff' }}>
                    {(p.score || 0).toLocaleString()}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="arena-card"
          style={{ overflow: 'hidden', marginBottom: 24 }}
        >
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>Final scoreboard</span>
            <span className="arena-pill" style={{ fontSize: 9 }}>
              {players.length} {players.length === 1 ? 'PLAYER' : 'PLAYERS'}
            </span>
          </div>
          {players.map((p, i) => {
            const isSelf = p.id === user?.id;
            const rankIcon = ['🥇', '🥈', '🥉'][i] || `#${i + 1}`;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className={`player-tile ${isSelf ? 'is-self' : ''}`}
                style={{ borderRadius: 0, background: isSelf ? `${CYAN}08` : 'transparent', borderTop: '1px solid rgba(255,255,255,0.04)', borderColor: 'transparent' }}
              >
                <div style={{ width: 28, textAlign: 'center', fontWeight: 800, fontFamily: MONO, color: i < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][i] : 'rgba(235,235,235,0.5)' }}>
                  {rankIcon}
                </div>
                <Avatar name={p.name} url={p.avatar_url} size={36} accent={isSelf ? CYAN : '#fff'} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, color: isSelf ? CYAN : '#fff', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </span>
                    {isSelf && (
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 999, background: `${CYAN}15`, border: `1px solid ${CYAN}35`, color: CYAN, fontFamily: MONO, letterSpacing: '0.1em' }}>YOU</span>
                    )}
                  </div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, color: i === 0 ? '#FFD700' : '#fff' }}>
                  {(p.score || 0).toLocaleString()}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <button
            onClick={() => onPlayAgain(false)}
            className="arena-btn"
            style={{ '--btn-color': CYAN, '--btn-color-2': PINK, padding: '14px 32px' }}
          >
            <iconify-icon icon="lucide:repeat" width="16" />
            Play again
          </button>
          <button onClick={onLobby} className="arena-btn-ghost" style={{ padding: '14px 32px' }}>
            <iconify-icon icon="lucide:home" width="16" />
            Back to lobby
          </button>
        </motion.div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════
   ROOT — MEMORY MATCH ROOM PAGE
═══════════════════════════════════════════ */
const MemoryMatchRoomPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tournamentIdRaw = searchParams.get('tournament') || 'pixel-memory-ultra';
  const tournament = getTournamentConfig(tournamentIdRaw);

  useEffect(() => { syncSessionFromTournament(tournamentIdRaw); }, [tournamentIdRaw]);

  const initMode = searchParams.get('mode');
  const initRoom = searchParams.get('room') || '';

  const [phase, setPhase] = useState(() => initMode === 'solo' ? 'playing' : initMode === 'friend' ? 'lobby' : 'select');
  const [roomCode, setRoomCode] = useState(initRoom);
  const [roomData, setRoomData] = useState(null);
  const [isSolo, setIsSolo] = useState(initMode === 'solo');

  const roomCodeRef = useRef(roomCode);
  const isSoloRef = useRef(isSolo);

  useEffect(() => {
    roomCodeRef.current = roomCode;
    isSoloRef.current = isSolo;
  }, [roomCode, isSolo]);

  useEffect(() => {
    const leave = () => {
      if (roomCodeRef.current && !isSoloRef.current && token) {
        navigator.sendBeacon(`${API_BASE_URL}/rooms/${roomCodeRef.current}/leave?token=${token}`);
      }
    };
    window.addEventListener('beforeunload', leave);
    window.addEventListener('popstate', leave);
    return () => {
      window.removeEventListener('beforeunload', leave);
      window.removeEventListener('popstate', leave);
    };
  }, [token]);

  const goLobby = () => {
    if (roomCodeRef.current && !isSoloRef.current && token) {
      navigator.sendBeacon(`${API_BASE_URL}/rooms/${roomCodeRef.current}/leave?token=${token}`);
    }
    navigate('/memory-lobby');
  };

  const handleSolo = () => {
    setIsSolo(true);
    setRoomCode('');
    setRoomData(null);
    setPhase('playing');
  };

  const handleFriend = () => navigate('/memory-lobby');

  const handleMatchStart = (code, room) => {
    setRoomCode(code); setRoomData(room); setPhase('playing');
  };

  const handleFinished = (room) => {
    setRoomData(room); setPhase('result');
  };

  const handlePlayAgain = async (autoReset = false) => {
    if (isSolo) {
      setPhase('playing');
    } else if (roomCode) {
      if (autoReset !== true) {
        try {
          await fetch(`${API_BASE_URL}/rooms/${roomCode}/play-again`, { method: 'POST', headers: authHeaders(token) });
        } catch { /* ignore */ }
      }
      setPhase('lobby');
    } else {
      setPhase('select');
    }
  };

  const phaseLabel = phase === 'select' ? 'Mode select' : phase === 'lobby' ? 'Briefing' : phase === 'playing' ? 'In match' : 'Debrief';

  return (
    <div
      className="arena-shell"
      style={{
        '--arena-bloom-1': `${CYAN}1c`,
        '--arena-bloom-2': `${PINK}18`,
        '--arena-bloom-3': `${PURPLE}14`,
        '--arena-bloom-4': 'rgba(56, 189, 248, 0.10)',
        '--arena-orb-1': `${CYAN}28`,
        '--arena-orb-2': `${PINK}22`,
        '--arena-orb-3': `${PURPLE}18`,
      }}
    >
      <div className="arena-bg-layer">
        <div className="arena-mesh" />
        <div className="arena-grid" />
        <div className="arena-orb arena-orb-1" />
        <div className="arena-orb arena-orb-2" />
        <div className="arena-orb arena-orb-3" />
        <div className="arena-noise" />
      </div>

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 50, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `linear-gradient(135deg, ${CYAN}, ${PINK})`,
              display: 'grid', placeItems: 'center',
              boxShadow: `0 6px 22px -8px ${CYAN}`,
            }}>
              <span style={{ fontSize: 18 }}>{tournament.emoji || '🧩'}</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.04em', color: '#fff' }}>
              Apex<span style={{ color: CYAN }}>Nova</span>
            </span>
          </a>
          <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.12)' }} />
          <div className="arena-pill" style={{ color: CYAN, borderColor: `${CYAN}55`, background: `${CYAN}12` }}>
            <span className="arena-dot" />
            {tournament.label}
          </div>
          <div className="arena-pill" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
            {phaseLabel}
          </div>
        </div>

        <button onClick={goLobby} className="arena-btn-ghost">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Memory Lobby
        </button>
      </header>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {phase === 'select' && (
            <motion.div key="select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <ModeSelection onSolo={handleSolo} onFriend={handleFriend} title={tournament.label} />
            </motion.div>
          )}
          {phase === 'lobby' && (
            <motion.div key="lobby" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <MatchLobby
                token={token} user={user}
                initialRoomCode={roomCode}
                lobbyTitle={`${tournament.label} Lobby`}
                onMatchStart={handleMatchStart}
                onBack={() => { setPhase('select'); setRoomCode(''); }}
              />
            </motion.div>
          )}
          {phase === 'playing' && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GameScreen token={token} user={user} roomCode={roomCode} isSolo={isSolo} onFinished={handleFinished} />
            </motion.div>
          )}
          {phase === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <ResultScreen room={roomData} user={user} onPlayAgain={handlePlayAgain} onLobby={goLobby} roomCode={roomCode} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MemoryMatchRoomPage;
