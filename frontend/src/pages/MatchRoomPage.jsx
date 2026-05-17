import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, authHeaders } from '../lib/api';
import { useRoomChannel } from '../hooks/useRoomChannel';
import RoomInvitePanel from '../components/RoomInvitePanel';
import TournamentGameRouter from '../components/games/TournamentGameRouter';
import {
  BACKEND_GAME_DEFAULT_TOURNAMENT,
  DEFAULT_TOURNAMENT_ID,
  getTournamentConfig,
  getTournamentFromBackendGame,
  syncSessionFromTournament,
} from '../data/tournamentConfig.js';

const LIME = '#ccff00';
const GREEN = '#10b981';
const PURPLE = '#a855f7';
const DEFAULT_THEME = { accent: LIME, secondary: GREEN, label: 'Tournament', emoji: '🎮' };
const MONO = "'JetBrains Mono', monospace";

/* ────────── Avatar ────────── */
const Avatar = ({ name, url, size = 40, accent = LIME, glow = false }) => (
  <div
    className={glow ? 'avatar-glow' : ''}
    style={{ '--av-color': accent, position: 'relative', flexShrink: 0 }}
  >
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `${accent}1a`,
      border: `1.5px solid ${accent}55`,
      display: 'grid', placeItems: 'center',
      fontSize: size * 0.4, fontWeight: 800, color: accent,
      overflow: 'hidden',
    }}>
      {url
        ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (name || '?').charAt(0).toUpperCase()
      }
    </div>
  </div>
);

/* ────────── Animated Tournament Header ────────── */
const ArenaHeader = ({ theme, onBack, phaseLabel }) => (
  <header style={{ position: 'relative', zIndex: 50, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: `linear-gradient(135deg, ${theme.accent}, ${theme.secondary})`,
          display: 'grid', placeItems: 'center',
          boxShadow: `0 6px 22px -8px ${theme.accent}`,
        }}>
          <span style={{ fontSize: 18, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }}>{theme.emoji}</span>
        </div>
        <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.04em', color: '#fff' }}>
          Apex<span style={{ color: theme.accent }}>Nova</span>
        </span>
      </a>
      <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.12)' }} />
      <div className="arena-pill arena-pill-live" style={{ '--c': theme.accent, color: theme.accent, borderColor: `${theme.accent}55`, background: `${theme.accent}12` }}>
        <span className="arena-dot" />
        {theme.label}
      </div>
      {phaseLabel && (
        <div className="arena-pill" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
          {phaseLabel}
        </div>
      )}
    </div>

    <button onClick={onBack} className="arena-btn-ghost">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
      Return to Lobby
    </button>
  </header>
);

/* ════════════════════════════════════════════
   PHASE 1 — MODE SELECTION (ultra-realistic gaming)
═══════════════════════════════════════════ */
const HERO_IMAGES = {
  snake: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80',
  tic_tac_toe: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=1920&q=80',
  memory: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1920&q=80',
  number: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1920&q=80',
  chess: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=1920&q=80',
  _default: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80',
};

const ModeSelection = ({ onSolo, onFriend, theme = DEFAULT_THEME, gameKey }) => {
  const accent = theme.accent;
  const sec = theme.secondary;
  const PINK = '#bd00ff';
  const heroImg = HERO_IMAGES[gameKey] || HERO_IMAGES._default;

  const stats = [
    { label: 'Avg Latency', value: '24ms', color: accent },
    { label: 'Live Players', value: '8,102', color: '#fff' },
    { label: 'Active Rooms', value: '342', color: '#38bdf8' },
    { label: 'Prize Pool', value: '$12.4K', color: PINK },
    { label: 'Fair Play', value: 'Verified', color: sec },
    { label: 'Region', value: 'Global', color: accent },
  ];

  return (
    <div style={{ position: 'relative', padding: '0 0 80px', maxWidth: '100%', margin: '0 auto' }}>
      {/* ── Cinematic Hero Section ── */}
      <div style={{ position: 'relative', height: 'clamp(420px, 55vh, 640px)', overflow: 'hidden', marginBottom: 48 }}>
        <img src={heroImg} alt="" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.2) contrast(1.1) brightness(0.3)', transform: 'scale(1.05)' }} />
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(6,6,8,0.2) 0%, rgba(6,6,8,0.85) 65%, #060608 100%), radial-gradient(ellipse 60% 50% at 50% 30%, ${accent}22, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 20%, ${PINK}18, transparent 60%)` }} />
        {/* Animated light streaks */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '12%', left: '-20%', width: '140%', height: 2, background: `linear-gradient(90deg, transparent, ${accent}88, transparent)`, transform: 'rotate(-3deg)', animation: 'lightStreak 6s ease-in-out infinite', opacity: 0.6 }} />
          <div style={{ position: 'absolute', top: '38%', left: '-20%', width: '140%', height: 1, background: `linear-gradient(90deg, transparent, ${PINK}66, transparent)`, transform: 'rotate(2deg)', animation: 'lightStreak 8s ease-in-out infinite 2s', opacity: 0.4 }} />
        </div>
        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
          {/* Esports shield logo */}
          <motion.div initial={{ opacity: 0, scale: 0.5, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ marginBottom: 22 }}>
            <img src="https://cdn-icons-png.flaticon.com/512/7016/7016337.png" alt="Tournament Shield" style={{ width: 90, height: 90, filter: `drop-shadow(0 0 30px ${accent}88) drop-shadow(0 0 60px ${accent}44)`, animation: 'floatBadge 4s ease-in-out infinite' }} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="arena-pill" style={{ marginBottom: 18, color: accent, background: 'rgba(0,0,0,0.5)', borderColor: `${accent}55`, backdropFilter: 'blur(12px)', display: 'inline-flex' }}>
            <span className="arena-dot" />
            {theme.label} — Select engagement
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ margin: 0, fontWeight: 900, color: '#fff', fontSize: 'clamp(3rem, 8vw, 6rem)', lineHeight: 0.9, letterSpacing: '-0.06em', textShadow: `0 4px 40px rgba(0,0,0,0.8), 0 0 80px ${accent}33` }}>
            Choose{' '}
            <span style={{ background: `linear-gradient(105deg, ${accent} 0%, #fff 60%, ${sec} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', fontStyle: 'italic' }}>your</span>{' '}
            mode
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ marginTop: 16, color: 'rgba(235,235,235,0.7)', fontSize: 18, lineHeight: 1.6, maxWidth: 560, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
            Solo training drills or full PvP arena. Real-time stakes, real prizes, zero delay.
          </motion.p>
        </div>
      </div>

      {/* ── Bento Grid ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
        {/* Big Solo card — cinematic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mode-card"
          style={{
            gridColumn: 'span 12',
            '--mc-glow': accent, '--mc-glow-2': sec,
            '--mc-bloom': `${accent}25`, '--mc-bloom-2': `${sec}18`,
            minHeight: 380, padding: 0, overflow: 'hidden',
          }}
          onClick={onSolo}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSolo()}
        >
          {/* Card background image */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <img src="https://images.unsplash.com/photo-1614294149010-950b698f72c0?auto=format&fit=crop&w=1400&q=70" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.18, filter: 'saturate(1.3)' }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, rgba(6,6,8,0.92) 0%, rgba(6,6,8,0.7) 50%, ${accent}12 100%)` }} />
          </div>
          {/* Floating game controller icon */}
          <div style={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)', opacity: 0.08, pointerEvents: 'none' }}>
            <img src="https://cdn-icons-png.flaticon.com/512/686/686589.png" alt="" style={{ width: 260, height: 260, filter: `drop-shadow(0 0 40px ${accent})` }} />
          </div>

          <div style={{ position: 'relative', zIndex: 1, padding: '36px 38px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="mode-card-icon" style={{ '--mc-glow': accent, boxShadow: `0 0 40px ${accent}55, inset 0 0 20px ${accent}22` }}>
                  <img src="https://cdn-icons-png.flaticon.com/512/3612/3612569.png" alt="AI" style={{ width: 38, height: 38, filter: `drop-shadow(0 0 8px ${accent})` }} />
                </div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: accent, marginBottom: 2 }}>Mode 01</div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>Solo Campaign</div>
                </div>
              </div>
              <div className="arena-pill" style={{ background: `${accent}12`, borderColor: `${accent}40`, color: accent, backdropFilter: 'blur(8px)' }}>
                <span className="arena-dot" /> Optimised for training
              </div>
            </div>

            <div style={{ marginTop: 32 }}>
              <h2 style={{ margin: 0, fontWeight: 900, fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)', letterSpacing: '-0.05em', color: '#fff', lineHeight: 0.95, textShadow: `0 2px 20px rgba(0,0,0,0.5)` }}>
                Combat <span style={{ color: accent, fontStyle: 'italic', textShadow: `0 0 30px ${accent}66` }}>System AI</span>
              </h2>
              <p style={{ margin: '14px 0 0', color: 'rgba(235,235,235,0.6)', fontSize: 16, maxWidth: 500, lineHeight: 1.55 }}>
                Sharpen mechanical precision against an adaptive bot. Score submitted to global leaderboards. Climb ranks, earn XP.
              </p>
            </div>

            <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { label: 'Multiplier', value: '1.2×', icon: '⚡' },
                  { label: 'Difficulty', value: 'Adaptive', icon: '🧠' },
                  { label: 'Time', value: '60s', icon: '⏱' },
                ].map((s) => (
                  <div key={s.label} style={{
                    padding: '12px 16px', borderRadius: 14,
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(8px)',
                    minWidth: 100,
                  }}>
                    <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.45)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>{s.icon}</span> {s.label}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 17, color: s.value === 'Adaptive' ? '#fff' : accent, fontStyle: s.value === 'Adaptive' ? 'italic' : 'normal' }}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
              <button className="arena-btn" style={{ '--btn-color': accent, '--btn-color-2': sec, padding: '15px 30px', fontSize: 15 }}>
                <iconify-icon icon="lucide:play-circle" width="22" />
                Start mission
              </button>
            </div>
          </div>
        </motion.div>

        {/* Friend card — dramatic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="mode-card"
          style={{
            gridColumn: 'span 7',
            '--mc-glow': PURPLE, '--mc-glow-2': PINK,
            '--mc-bloom': `${PURPLE}25`, '--mc-bloom-2': `${PINK}15`,
            minHeight: 300, padding: 0, overflow: 'hidden',
          }}
          onClick={onFriend}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onFriend()}
        >
          {/* Background */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <img src="https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=900&q=70" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15, filter: 'saturate(1.4) hue-rotate(20deg)' }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, rgba(6,6,8,0.92) 0%, rgba(6,6,8,0.7) 60%, ${PURPLE}15 100%)` }} />
          </div>
          {/* Floating swords icon */}
          <div style={{ position: 'absolute', right: 20, bottom: 20, opacity: 0.06, pointerEvents: 'none' }}>
            <img src="https://cdn-icons-png.flaticon.com/512/2503/2503508.png" alt="" style={{ width: 180, height: 180, filter: `drop-shadow(0 0 30px ${PURPLE})` }} />
          </div>
          <div className="pulse-ring" style={{ '--mc-glow': `${PURPLE}55` }} />

          <div style={{ position: 'relative', zIndex: 1, padding: '32px 34px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="mode-card-icon" style={{ '--mc-glow': PURPLE, boxShadow: `0 0 40px ${PURPLE}55, inset 0 0 20px ${PURPLE}22` }}>
                  <img src="https://cdn-icons-png.flaticon.com/512/3176/3176298.png" alt="PvP" style={{ width: 36, height: 36, filter: `drop-shadow(0 0 8px ${PURPLE})` }} />
                </div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#d8b4fe', marginBottom: 2 }}>Mode 02</div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>Multiplayer</div>
                </div>
              </div>
              <div className="arena-pill" style={{ background: `${PURPLE}15`, borderColor: `${PURPLE}40`, color: '#d8b4fe', backdropFilter: 'blur(8px)' }}>
                <span className="arena-dot" /> 2.4K live now
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 24 }}>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', letterSpacing: '-0.04em', color: '#fff', textShadow: `0 2px 16px rgba(0,0,0,0.5)` }}>
                Versus <span style={{ color: PURPLE, fontStyle: 'italic', textShadow: `0 0 24px ${PURPLE}66` }}>Arena</span>
              </h3>
              <p style={{ margin: '10px 0 18px', color: 'rgba(235,235,235,0.6)', fontSize: 14, lineHeight: 1.55, maxWidth: 380 }}>
                Real opponents, real-time. Invite friends, queue solo, climb global prestige.
              </p>
              <button className="arena-btn" style={{ '--btn-color': PURPLE, '--btn-color-2': PINK, color: '#fff', padding: '12px 24px' }}>
                <iconify-icon icon="lucide:swords" width="18" />
                Initialise sync
              </button>
            </div>
          </div>
        </motion.div>

        {/* Jackpot card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.36 }}
          className="arena-card-glow arena-card"
          style={{
            gridColumn: 'span 5',
            padding: 26,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            '--glow-color': '#00f0ff', '--glow-color-2': PINK,
            minHeight: 280,
          }}
        >
          <div>
            <div className="arena-pill" style={{ background: 'rgba(0,240,255,0.10)', borderColor: 'rgba(0,240,255,0.35)', color: '#00f0ff', marginBottom: 16 }}>
              <iconify-icon icon="lucide:trophy" width="11" /> Live jackpot
            </div>
            <div style={{ fontWeight: 900, fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', color: '#00f0ff', letterSpacing: '-0.04em', fontStyle: 'italic' }}>
              $12,450.00
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: 'rgba(235,235,235,0.45)' }}>
              Across all active brackets
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.40)', marginBottom: 2 }}>
                Top prize today
              </div>
              <div style={{ fontWeight: 800, color: '#fff' }}>$5,000</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3].map((n) => (
                <span key={n} style={{ width: 18, height: 18, borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${PINK})`, border: '2px solid #060608' }} />
              ))}
              <span style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)', border: '2px solid #060608',
                display: 'grid', placeItems: 'center',
                fontSize: 9, fontWeight: 700, color: 'rgba(235,235,235,0.6)',
              }}>+9</span>
            </div>
          </div>
        </motion.div>
      </div>
      </div>

      {/* Stat marquee */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="arena-marquee"
        style={{ marginTop: 60, padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="arena-marquee-track">
          {[...stats, ...stats, ...stats].map((s, i) => (
            <div key={i} className="arena-marquee-item" style={{ '--marquee-accent': s.color }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
              {s.label} <b>{s.value}</b>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Keyframes for this component */}
      <style>{`
        @keyframes lightStreak {
          0%, 100% { transform: translateX(-30%) rotate(-3deg); opacity: 0; }
          50% { transform: translateX(30%) rotate(-3deg); opacity: 0.7; }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
      `}</style>
    </div>
  );
};

/* ════════════════════════════════════════════
   PHASE 2 — MATCH LOBBY (friend room)
═══════════════════════════════════════════ */
const MatchLobby = ({ token, user, initialRoomCode, onMatchStart, onBack, theme = DEFAULT_THEME }) => {
  const accent = theme.accent;
  const sec = theme.secondary;
  const [roomCode] = useState(initialRoomCode || '');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [friends, setFriends] = useState([]);
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
          <p style={{ marginTop: 8, color: 'rgba(235,235,235,0.5)' }}>Invalid or missing room code. Please invite friends from the Lobby.</p>
          <button onClick={onBack} className="arena-btn" style={{ marginTop: 20, '--btn-color': accent, '--btn-color-2': sec }}>
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
      {/* Countdown overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="countdown-overlay"
            style={{ '--cd-color': accent }}
          >
            <div className="countdown-ring" style={{ '--cd-color': `${accent}66` }} />
            <div className="countdown-ring" style={{ '--cd-color': `${accent}66`, animationDelay: '0.4s' }} />
            <div style={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
              <div style={{ fontFamily: MONO, fontSize: 13, color: accent, textTransform: 'uppercase', letterSpacing: '0.32em', marginBottom: 14 }}>
                Match Starting
              </div>
              <motion.div
                key={countdown}
                initial={{ scale: 1.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="countdown-number"
                style={{ '--cd-color': accent }}
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
            Room briefing
          </div>
          <h1 style={{ margin: 0, color: '#fff', fontWeight: 900, fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', letterSpacing: '-0.04em' }}>
            {theme.label}{' '}
            <span style={{ color: accent, fontStyle: 'italic' }}>Lobby</span>
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <motion.button
            onClick={copyCode}
            whileTap={{ scale: 0.97 }}
            className="room-code-display"
            style={{ '--rc-accent': `${accent}55` }}
          >
            <div>
              <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.45)' }}>
                Room code
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '0.18em', marginTop: 2 }}>
                {roomCode}
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, color: copied ? sec : accent,
              fontFamily: MONO, letterSpacing: '0.1em',
            }}>
              {copied ? '✓ COPIED' : 'COPY'}
            </span>
          </motion.button>
          <button onClick={refreshRoom} className="arena-btn-ghost" style={{ color: accent, borderColor: `${accent}40`, background: `${accent}0a` }}>
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

      {/* Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(280px, 1fr) minmax(280px, 1fr)', gap: 16 }}>
        {/* ── Left: players + ready bar + actions ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="arena-card-glow arena-card" style={{ '--glow-color': `${accent}88`, '--glow-color-2': `${sec}66`, padding: 0 }}>
            <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>👥</span>
                <span style={{ fontWeight: 800, color: '#fff', fontSize: 15 }}>Roster</span>
                <span className="arena-pill" style={{ fontSize: 9 }}>
                  {playerCount} / 4
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontFamily: MONO, color: 'rgba(235,235,235,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: sec, boxShadow: `0 0 8px ${sec}` }} />
                {readyCount}/{playerCount} ready
              </div>
            </div>

            {/* Ready progress bar */}
            <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${readyPct}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  height: '100%',
                  background: `linear-gradient(90deg, ${accent}, ${sec})`,
                  boxShadow: `0 0 12px ${accent}`,
                }}
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
                  <Avatar name={p.name} url={p.avatar_url} size={42} accent={p.id === user?.id ? accent : '#fff'} glow={p.id === user?.id} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontWeight: 700, fontSize: 14 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                      {p.is_host && (
                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 999, background: 'rgba(255,215,0,0.10)', border: '1px solid rgba(255,215,0,0.30)', color: '#FFD700', fontFamily: MONO, letterSpacing: '0.1em' }}>HOST</span>
                      )}
                      {p.id === user?.id && (
                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 999, background: `${accent}15`, border: `1px solid ${accent}35`, color: accent, fontFamily: MONO, letterSpacing: '0.1em' }}>YOU</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(235,235,235,0.45)', marginTop: 2 }}>@{p.gamer_tag}</div>
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 700, fontFamily: MONO, letterSpacing: '0.08em',
                    padding: '5px 12px', borderRadius: 999,
                    background: p.ready ? `${sec}18` : 'rgba(255,255,255,0.05)',
                    color: p.ready ? sec : 'rgba(235,235,235,0.45)',
                    border: `1px solid ${p.ready ? `${sec}50` : 'rgba(255,255,255,0.10)'}`,
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
                  <div style={{ width: 42, height: 42, borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.12)', display: 'grid', placeItems: 'center', fontSize: 14 }}>
                    +
                  </div>
                  Empty slot — waiting for players
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={toggleReady}
              className={me?.ready ? 'arena-btn-ghost' : 'arena-btn'}
              style={{
                flex: 1,
                ...(me?.ready ? {} : { '--btn-color': accent, '--btn-color-2': sec }),
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
                style={{
                  flex: 1,
                  '--btn-color': PURPLE, '--btn-color-2': '#bd00ff',
                  padding: '14px 22px', fontSize: 15, color: '#fff',
                }}
              >
                {starting ? '⟳ Starting…' : '▶ Start match'}
              </button>
            )}
          </div>
        </div>

        {/* ── Middle: Chat ── */}
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
              <div key={m.id || i} className={`chat-bubble ${m.user_id === user?.id ? 'is-me' : ''}`}>
                <Avatar name={m.name} url={m.avatar_url} size={26} accent={m.user_id === user?.id ? accent : '#fff'} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: m.user_id === user?.id ? accent : `hsl(${(i * 73) % 360}, 65%, 75%)`, marginBottom: 2 }}>
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
              onFocus={(e) => (e.target.style.borderColor = `${accent}55`)}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
            <button
              onClick={sendMsg}
              disabled={sending || !msg.trim()}
              style={{
                background: msg.trim() ? `linear-gradient(135deg, ${accent}, ${sec})` : 'rgba(255,255,255,0.05)',
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

        {/* ── Right: Invite panel ── */}
        <RoomInvitePanel
          token={token}
          roomCode={roomCode}
          user={user}
          friends={friends}
          room={room}
          accent={accent}
          secondary={sec}
          fontFamily="'Space Grotesk', sans-serif"
          onInviteError={(m) => setError(m)}
        />
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════
   PHASE 3 — GAME SCREEN
═══════════════════════════════════════════ */
const GameScreen = ({ token, user, roomCode, isSolo, onFinished, backendGame, gameKey, themeAccent, themeSecondary }) => {
  const [submitted, setSubmitted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [soloResult, setSoloResult] = useState(null); // holds result data until user clicks "View Results"
  const { room } = useRoomChannel(roomCode);
  const startTime = useRef(Date.now());
  const accent = themeAccent || LIME;
  const sec = themeSecondary || GREEN;

  useEffect(() => {
    if (room?.status === 'finished' && !isSolo) onFinished(room);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status]);

  // Live timer
  useEffect(() => {
    startTime.current = Date.now();
    const iv = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec2 = s % 60;
    return `${m}:${sec2.toString().padStart(2, '0')}`;
  };

  const handleGameOver = useCallback(async (score) => {
    if (submitted) return;
    setSubmitted(true);
    try {
      if (isSolo) {
        const res = await fetch(`${API_BASE_URL}/profile/score`, {
          method: 'POST',
          headers: authHeaders(token, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({ score, game: backendGame }),
        });
        const data = await res.json();
        // Don't transition immediately — store result and wait for user action
        setSoloResult({ status: 'finished', players: [{ id: user?.id, name: user?.name, avatar_url: user?.avatar_url, score, is_host: true }], points_earned: data.points_earned });
      } else if (roomCode) {
        const res = await fetch(`${API_BASE_URL}/rooms/${roomCode}/score`, {
          method: 'POST',
          headers: authHeaders(token, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({ score }),
        });
        const data = await res.json();
        if (data.finished) onFinished(data.room);
      }
    } catch {
      if (isSolo) setSoloResult(null);
      else onFinished(null);
    }
  }, [submitted, isSolo, roomCode, token, user, onFinished, backendGame]);

  return (
    <div style={{ padding: '16px 24px 60px', maxWidth: 1400, margin: '0 auto' }}>
      {/* ── Gaming Dashboard Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'start' }}>
        {/* Main game area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Top HUD bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="arena-card-glow"
            style={{
              '--glow-color': `${accent}66`, '--glow-color-2': `${sec}44`,
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 18, padding: '14px 22px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar name={user?.name} url={user?.avatar_url} size={42} accent={accent} glow />
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '-0.02em' }}>{user?.name || 'Player'}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.45)', marginTop: 2 }}>
                  {isSolo ? 'Solo campaign' : 'Live match'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Timer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <iconify-icon icon="lucide:clock" width="14" style={{ color: 'rgba(235,235,235,0.5)' }} />
                <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '0.08em' }}>
                  {formatTime(elapsed)}
                </span>
              </div>
              {/* Mode badge */}
              <div className="arena-pill arena-pill-live" style={{ background: `${accent}12`, borderColor: `${accent}45`, color: accent }}>
                <span className="arena-dot" />
                {isSolo ? 'AI Match' : 'PvP Live'}
              </div>
            </div>
          </motion.div>

          {/* Game canvas wrapper */}
          <div style={{ position: 'relative' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="arena-card-glow arena-scanline"
            style={{
              '--glow-color': `${accent}55`, '--glow-color-2': `${sec}44`,
              '--scan-color': `${accent}12`,
              background: 'rgba(6,6,8,0.9)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 22, padding: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
              boxShadow: `0 20px 80px -20px ${accent}22, inset 0 0 60px rgba(0,0,0,0.4)`,
            }}
          >
            <TournamentGameRouter
              gameKey={gameKey}
              playerName={user?.name || 'You'}
              onGameOver={handleGameOver}
              autoStart={true}
              allowRestart={isSolo && !soloResult}
              themeAccent={themeAccent}
              themeSecondary={themeSecondary}
            />
          </motion.div>

          {/* Solo game-over overlay — waits for user to proceed */}
          {soloResult && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                position: 'absolute', inset: 0, zIndex: 20,
                background: 'rgba(6,6,8,0.92)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                borderRadius: 22,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 18, padding: 32,
              }}
            >
              <motion.div
                initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                style={{ fontSize: 64, filter: `drop-shadow(0 6px 24px ${accent}66)` }}
              >
                🎯
              </motion.div>
              <div style={{ fontWeight: 900, fontSize: 28, color: '#fff', letterSpacing: '-0.04em', textAlign: 'center' }}>
                Run complete
              </div>
              <div style={{
                fontFamily: MONO, fontSize: 42, fontWeight: 900, color: accent,
                textShadow: `0 0 40px ${accent}55`,
                lineHeight: 1,
              }}>
                {(soloResult.players[0]?.score || 0).toLocaleString()}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.5)' }}>
                Final score · {formatTime(elapsed)} elapsed
              </div>
              {soloResult.points_earned && (
                <div style={{
                  padding: '8px 16px', borderRadius: 999,
                  background: `${accent}12`, border: `1px solid ${accent}35`,
                  color: accent, fontSize: 13, fontWeight: 700, fontFamily: MONO,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <iconify-icon icon="lucide:trending-up" width="14" />
                  +{soloResult.points_earned} XP earned
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button
                  onClick={() => onFinished(soloResult)}
                  className="arena-btn"
                  style={{ '--btn-color': accent, '--btn-color-2': sec, padding: '14px 30px', fontSize: 15 }}
                >
                  <iconify-icon icon="lucide:bar-chart-2" width="18" />
                  View results
                </button>
                <button
                  onClick={() => { setSoloResult(null); setSubmitted(false); }}
                  className="arena-btn-ghost"
                  style={{ padding: '14px 24px' }}
                >
                  <iconify-icon icon="lucide:repeat" width="16" />
                  Play again
                </button>
              </div>
            </motion.div>
          )}
          </div>

          {/* Submitted status for multiplayer */}
          {submitted && !isSolo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '14px 22px', borderRadius: 14,
                background: `${accent}10`,
                border: `1px solid ${accent}35`,
                color: accent, fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 10, fontFamily: MONO, letterSpacing: '0.1em', textTransform: 'uppercase',
              }}
            >
              <span className="arena-dot" />
              Score submitted — waiting for opponents
            </motion.div>
          )}
        </div>

        {/* ── Right sidebar — stats panel ── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 100 }}
        >
          {/* Game info card */}
          <div className="arena-card" style={{ padding: '20px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: `linear-gradient(135deg, ${accent}, ${sec})`,
                display: 'grid', placeItems: 'center',
                boxShadow: `0 4px 16px -4px ${accent}`,
              }}>
                <img src="https://cdn-icons-png.flaticon.com/512/7016/7016337.png" alt="" style={{ width: 22, height: 22, filter: 'brightness(0) invert(1)' }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>Match info</div>
                <div style={{ fontSize: 11, color: 'rgba(235,235,235,0.45)' }}>{gameKey?.replace(/_/g, ' ')}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Mode', value: isSolo ? 'Solo' : 'Multiplayer', icon: '🎮' },
                { label: 'Difficulty', value: 'Adaptive', icon: '🧠' },
                { label: 'Multiplier', value: '1.2×', icon: '⚡' },
                { label: 'Elapsed', value: formatTime(elapsed), icon: '⏱' },
              ].map((stat) => (
                <div key={stat.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{stat.icon}</span>
                    <span style={{ fontSize: 12, color: 'rgba(235,235,235,0.55)', fontWeight: 600 }}>{stat.label}</span>
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: '#fff' }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips card */}
          <div className="arena-card" style={{ padding: '18px 16px' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <iconify-icon icon="lucide:lightbulb" width="14" style={{ color: accent }} />
              Pro tips
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Use WASD or arrow keys',
                'Eat food to grow & score',
                'Avoid walls and yourself',
                'Speed increases every 50pts',
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'rgba(235,235,235,0.55)', lineHeight: 1.4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: `${accent}88`, marginTop: 5, flexShrink: 0 }} />
                  {tip}
                </div>
              ))}
            </div>
          </div>

          {/* Live status */}
          <div className="arena-card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', margin: '0 auto 10px',
              background: `linear-gradient(135deg, ${accent}22, ${sec}22)`,
              border: `2px solid ${accent}44`,
              display: 'grid', placeItems: 'center',
              animation: 'arenaDot 2s ease-in-out infinite',
            }}>
              <iconify-icon icon="lucide:radio" width="20" style={{ color: accent }} />
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent }}>
              {submitted ? 'Score submitted' : 'Match in progress'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(235,235,235,0.40)', marginTop: 4 }}>
              {isSolo ? 'Solo session active' : `Room: ${roomCode || '—'}`}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════
   PHASE 4 — RESULTS (podium + confetti)
═══════════════════════════════════════════ */
const ResultScreen = ({ room, user, onPlayAgain, onLobby, roomCode, theme = DEFAULT_THEME }) => {
  const accent = theme.accent;
  const sec = theme.secondary;
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

  const confettiColors = [accent, sec, '#FFD700', '#bd00ff', '#00f0ff', '#fb7185'];

  return (
    <div style={{ position: 'relative', minHeight: '70vh', overflow: 'hidden' }}>
      {/* Confetti */}
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
        <motion.div
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 36 }}
        >
          <motion.div
            initial={{ scale: 0.4, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            style={{ fontSize: 64, marginBottom: 10, filter: 'drop-shadow(0 6px 20px rgba(255,215,0,0.5))' }}
          >
            {meWon ? '🏆' : meIndex === 1 ? '🥈' : meIndex === 2 ? '🥉' : '🎯'}
          </motion.div>
          <div className="arena-pill" style={{ background: `${accent}10`, borderColor: `${accent}40`, color: accent, marginBottom: 12 }}>
            <span className="arena-dot" /> Match complete
          </div>
          <h2 style={{ margin: 0, color: '#fff', fontWeight: 900, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.05em' }}>
            {meWon ? 'Victory' : meIndex === 0 && players.length === 1 ? 'Run finished' : 'Match over'}
          </h2>
          <div style={{ marginTop: 8, color: 'rgba(235,235,235,0.55)', fontSize: 15 }}>
            You finished <strong style={{ color: accent }}>{myRankLabel}</strong>
            {winner && players.length > 1 && (
              <> — congrats to <strong style={{ color: '#FFD700' }}>{winner.name}</strong></>
            )}
          </div>
        </motion.div>

        {/* Podium for top 3 */}
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

        {/* Full scoreboard */}
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
                style={{ borderRadius: 0, background: isSelf ? `${accent}08` : 'transparent', borderTop: '1px solid rgba(255,255,255,0.04)', borderColor: 'transparent' }}
              >
                <div style={{ width: 28, textAlign: 'center', fontWeight: 800, fontFamily: MONO, color: i < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][i] : 'rgba(235,235,235,0.5)' }}>
                  {rankIcon}
                </div>
                <Avatar name={p.name} url={p.avatar_url} size={36} accent={isSelf ? accent : '#fff'} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, color: isSelf ? accent : '#fff', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </span>
                    {isSelf && (
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 999, background: `${accent}15`, border: `1px solid ${accent}35`, color: accent, fontFamily: MONO, letterSpacing: '0.1em' }}>YOU</span>
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

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="arena-card"
          style={{ padding: '20px 22px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: `linear-gradient(135deg, ${accent}22, ${sec}22)`,
              border: `1px solid ${accent}35`,
              display: 'grid', placeItems: 'center',
            }}>
              <iconify-icon icon="lucide:trophy" width="22" style={{ color: accent }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>
                {players.length === 1 ? 'Solo run' : 'Match'} complete
              </div>
              <div style={{ fontSize: 12, color: 'rgba(235,235,235,0.50)', marginTop: 2 }}>
                Your score: <strong style={{ color: accent }}>{(players.find((p) => p.id === user?.id)?.score || 0).toLocaleString()}</strong>
                {room?.points_earned ? ` · +${room.points_earned} XP` : ''}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'Time', value: '—', icon: '⏱' },
              { label: 'Rank', value: myRankLabel, icon: '🏅' },
            ].map((s) => (
              <div key={s.label} style={{
                padding: '8px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 12 }}>{s.icon}</div>
                <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: '#fff', marginTop: 2 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <button
            onClick={() => onPlayAgain(false)}
            className="arena-btn"
            style={{ '--btn-color': accent, '--btn-color-2': sec, padding: '14px 32px' }}
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
   ROOT — MATCH ROOM PAGE
═══════════════════════════════════════════ */
const MatchRoomPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tournamentSlug = searchParams.get('tournament');
  const gameSlug = searchParams.get('game');
  const earlyRoomCode = searchParams.get('room') || '';
  const [roomGame, setRoomGame] = useState(null);

  const tournament = useMemo(() => {
    if (tournamentSlug) return getTournamentConfig(tournamentSlug);
    if (gameSlug && BACKEND_GAME_DEFAULT_TOURNAMENT[gameSlug]) return getTournamentFromBackendGame(gameSlug);
    if (roomGame && BACKEND_GAME_DEFAULT_TOURNAMENT[roomGame]) return getTournamentFromBackendGame(roomGame);
    return getTournamentConfig(DEFAULT_TOURNAMENT_ID);
  }, [tournamentSlug, gameSlug, roomGame]);

  const themeUI = useMemo(
    () => ({ accent: tournament.accent, secondary: tournament.secondary, label: tournament.label, emoji: tournament.emoji }),
    [tournament]
  );

  useEffect(() => { syncSessionFromTournament(tournament.id); }, [tournament.id]);

  useEffect(() => {
    if (!token || !earlyRoomCode || tournamentSlug || gameSlug) return;
    fetch(`${API_BASE_URL}/rooms/${earlyRoomCode}`, { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((d) => { if (d.room?.game) setRoomGame(d.room.game); })
      .catch(() => {});
  }, [token, earlyRoomCode, tournamentSlug, gameSlug]);

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
    navigate('/lobby');
  };

  const handleSolo = () => {
    setIsSolo(true);
    setRoomCode('');
    setRoomData(null);
    setPhase('playing');
  };

  const handleFriend = () => navigate('/lobby');

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
        '--arena-bloom-1': `${themeUI.accent}26`,
        '--arena-bloom-2': `${themeUI.secondary}1a`,
        '--arena-bloom-3': 'rgba(56,189,248,0.10)',
        '--arena-bloom-4': 'rgba(189,0,255,0.10)',
        '--arena-orb-1': `${themeUI.accent}28`,
        '--arena-orb-2': 'rgba(168,85,247,0.18)',
        '--arena-orb-3': `${themeUI.secondary}18`,
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

      <ArenaHeader theme={themeUI} onBack={goLobby} phaseLabel={phaseLabel} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {phase === 'select' && (
            <motion.div key="select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <ModeSelection onSolo={handleSolo} onFriend={handleFriend} theme={themeUI} gameKey={tournament.gameKey} />
            </motion.div>
          )}
          {phase === 'lobby' && (
            <motion.div key="lobby" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <MatchLobby
                token={token} user={user}
                initialRoomCode={roomCode}
                theme={themeUI}
                onMatchStart={handleMatchStart}
                onBack={() => { setPhase('select'); setRoomCode(''); }}
              />
            </motion.div>
          )}
          {phase === 'playing' && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GameScreen
                token={token} user={user}
                roomCode={roomCode} isSolo={isSolo}
                onFinished={handleFinished}
                backendGame={tournament.backendGame}
                gameKey={tournament.gameKey}
                themeAccent={tournament.accent}
                themeSecondary={tournament.secondary}
              />
            </motion.div>
          )}
          {phase === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <ResultScreen
                room={roomData} user={user}
                theme={themeUI}
                onPlayAgain={handlePlayAgain}
                onLobby={goLobby}
                roomCode={roomCode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MatchRoomPage;
