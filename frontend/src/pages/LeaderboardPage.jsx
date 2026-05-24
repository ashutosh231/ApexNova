import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Squares from '../components/Squares';
import { useAuth } from '../context/AuthContext';
import getEcho from '../lib/echo';

/* ─── Constants & Styles ─────────────────────────────────── */
const LIME = '#ccff00';
const GOLD = '#FBBF24';
const SILVER = '#9CA3AF';
const BRONZE = '#D97706';
const MONO = "'JetBrains Mono', monospace";

const glassStyle = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.09)',
};

/* ─── Filter options (6 active games) ─────────────────────── */
const GAMES = [
  'All',
  'Snake',
  'Tic Tac Toe',
  'Memory Match',
  'Number Guessing',
  'Chess Blitz',
];
const TIMES = ['Today', 'Weekly', 'All-time'];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/* Build a cheap deterministic sparkline from the user id + score
   so it's stable across refreshes and doesn't reset every poll. */
const buildSparkline = (id, finalScore, len = 10) => {
  const points = [];
  let cur = Math.max(0, finalScore - 800);
  // Mulberry32-style PRNG seeded by id so each user has a stable shape
  let seed = (Number(id) || 1) * 9301 + 49297;
  for (let i = 0; i < len; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const r = (seed / 0x7fffffff) - 0.4;
    cur += r * 200;
    cur = Math.max(0, cur);
    points.push(cur);
  }
  // Ensure last point matches the final score
  points[points.length - 1] = finalScore;
  return points;
};

/* ─── Minimal SVG Sparkline Chart ────────────────────────── */
const Sparkline = ({ data, color = LIME, height = 40, strokeWidth = 2 }) => {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const width = 100;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4);
    return `${x},${y}`;
  }).join(' ');

  const gradId = `lb-grad-${color.replace('#', '')}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#${gradId})`} />
      <motion.polyline
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/* ─── Animated Background ─────────────────────────────────── */
const AnimatedBackground = () => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      <Squares
        direction="diagonal"
        speed={0.4}
        squareSize={40}
        borderColor="rgba(255,255,255,0.06)"
        hoverFillColor="rgba(204,255,0,0.18)"
      />
    </div>
    <motion.div
      animate={{ x: ['-5%', '5%', '-5%'], y: ['-5%', '5%', '-5%'], scale: [1, 1.1, 1] }}
      transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        position: 'absolute', top: '-10%', left: '-10%', width: '60vw', height: '60vw',
        background: 'radial-gradient(ellipse at center, rgba(204,255,0,0.1) 0%, transparent 60%)',
        mixBlendMode: 'screen',
      }}
    />
    <motion.div
      animate={{ x: ['10%', '-10%', '10%'], y: ['10%', '-5%', '10%'], scale: [1, 1.2, 1] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      style={{
        position: 'absolute', bottom: '-20%', right: '-10%', width: '70vw', height: '70vw',
        background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.08) 0%, transparent 60%)',
        mixBlendMode: 'screen',
      }}
    />
    <motion.div
      animate={{ x: ['-5%', '10%', '-5%'], y: ['10%', '-10%', '10%'] }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      style={{
        position: 'absolute', top: '30%', left: '20%', width: '50vw', height: '50vw',
        background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.05) 0%, transparent 60%)',
        mixBlendMode: 'screen',
      }}
    />
    <motion.div
      animate={{ x: ['5%', '-5%', '5%'], y: ['-10%', '10%', '-10%'] }}
      transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      style={{
        position: 'absolute', top: '10%', right: '10%', width: '50vw', height: '50vw',
        background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.06) 0%, transparent 60%)',
        mixBlendMode: 'screen',
      }}
    />
    <div aria-hidden style={{
      position: 'absolute', inset: 0, opacity: 0.12,
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\")",
      mixBlendMode: 'overlay',
    }} />
  </div>
);

/* ─── Top 3 Podium Card ───────────────────────────────────── */
const TopPlayerCard = ({ player, place }) => {
  const isFirst = place === 1;
  const colors = {
    1: { hex: GOLD, glow: 'rgba(251, 191, 36, 0.25)', icon: 'tabler:crown' },
    2: { hex: SILVER, glow: 'rgba(156, 163, 175, 0.15)', icon: 'tabler:medal-2' },
    3: { hex: BRONZE, glow: 'rgba(217, 119, 6, 0.15)', icon: 'tabler:award' },
  };
  const c = colors[place];
  const height = isFirst ? 280 : 250;
  const mt = isFirst ? 0 : 30;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + (place * 0.1), duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        ...glassStyle,
        position: 'relative',
        height,
        marginTop: mt,
        borderRadius: '1.5rem',
        padding: '24px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(to bottom, ${c.glow}, rgba(255,255,255,0.02))`,
        border: `1px solid ${c.hex}40`,
        boxShadow: `0 8px 32px ${c.glow}, inset 0 1px 0 ${c.hex}40`,
      }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      {/* Crown icon for 1st place */}
      {isFirst && (
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: -22, color: GOLD, filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.7))', display: 'inline-flex' }}
        >
          <iconify-icon icon="tabler:crown" width="36" />
        </motion.div>
      )}

      {/* Rank Badge */}
      <div style={{
        position: 'absolute', top: 12, right: 12,
        width: 28, height: 28, borderRadius: '50%',
        background: c.hex, color: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 13,
      }}>
        #{place}
      </div>

      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        border: `2px solid ${c.hex}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, fontWeight: 700, color: '#fff',
        fontFamily: "'Space Grotesk', sans-serif",
        marginBottom: 16,
        boxShadow: `0 0 20px ${c.glow}`,
        overflow: 'hidden',
      }}>
        {player.avatar}
      </div>

      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: '#fff', margin: '0 0 4px 0', textAlign: 'center' }}>
        {player.user}
      </h3>
      <div style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(235,235,235,0.5)', marginBottom: 16 }}>
        {player.game}
      </div>

      <div style={{
        fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 24,
        color: c.hex, textShadow: `0 0 12px ${c.glow}`,
      }}>
        {player.score.toLocaleString()}
      </div>
    </motion.div>
  );
};

/* ─── Main Leaderboard Page ──────────────────────────────── */
const LeaderboardPage = () => {
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState('All');
  const [activeTime, setActiveTime] = useState('All-time');
  const [search, setSearch] = useState('');
  const [visibleRows, setVisibleRows] = useState(10);
  const [pulseKey, setPulseKey] = useState(0);
  const [updatedIds, setUpdatedIds] = useState(new Set()); // user ids that just changed score
  const prevScoresRef = useRef(new Map());                 // id → previous score, for diff highlighting

  /* Fetcher — memoised so polling + ws share it */
  const fetchLeaderboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const url = new URL(`${API_BASE_URL}/leaderboard`);
      url.searchParams.append('game', activeGame);
      url.searchParams.append('time', activeTime);
      url.searchParams.append('limit', '50');

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!res.ok || !json.leaderboard) return;

      const formatted = json.leaderboard.map((item) => ({
        id: item.id.toString(),
        rank: item.rank,
        user: item.name,
        gamerTag: item.gamer_tag,
        game: activeGame === 'All' ? 'All Games' : activeGame,
        score: item.best_score,
        points: item.points,
        gamesPlayed: item.games_played,
        wins: item.wins,
        avatar: item.avatar_url
          ? <img src={item.avatar_url} alt={item.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          : (item.name || '?').charAt(0).toUpperCase(),
        isCurrentUser: item.is_self,
        sparkline: buildSparkline(item.id, item.best_score),
      }));

      // Detect newly-updated rows for highlight pulse
      const updated = new Set();
      formatted.forEach((row) => {
        const prev = prevScoresRef.current.get(row.id);
        if (prev !== undefined && prev !== row.score) updated.add(row.id);
        prevScoresRef.current.set(row.id, row.score);
      });
      if (updated.size > 0) {
        setUpdatedIds(updated);
        // Clear after the highlight animation runs
        setTimeout(() => setUpdatedIds(new Set()), 2200);
        setPulseKey((k) => k + 1); // trigger live indicator pulse
      }

      setData(formatted);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token, activeGame, activeTime]);

  /* Initial + filter-change fetch */
  useEffect(() => {
    if (!token) return;
    // reset previous-score map when filters change
    prevScoresRef.current = new Map();
    setUpdatedIds(new Set());
    fetchLeaderboard(false);
  }, [token, activeGame, activeTime, fetchLeaderboard]);

  /* Soft polling fallback — every 25s when tab is visible */
  useEffect(() => {
    if (!token) return undefined;
    const tick = () => {
      if (document.visibilityState === 'visible') fetchLeaderboard(true);
    };
    const iv = setInterval(tick, 25_000);
    return () => clearInterval(iv);
  }, [token, fetchLeaderboard]);

  /* Real-time WebSocket sync via public 'leaderboard' channel */
  useEffect(() => {
    const echo = getEcho();
    if (!echo) return undefined;
    let channel;
    try {
      channel = echo.channel('leaderboard');
      channel.listen('.leaderboard.updated', () => {
        // Brief debounce to coalesce multiple updates from a finished match
        fetchLeaderboard(true);
      });
    } catch (err) {
      console.warn('[Leaderboard] echo subscribe error:', err.message);
    }
    return () => {
      try {
        channel?.stopListening('.leaderboard.updated');
        echo.leave('leaderboard');
      } catch { /* noop */ }
    };
  }, [fetchLeaderboard]);

  /* Refresh on tab focus too — covers cases where WS missed */
  useEffect(() => {
    const onFocus = () => fetchLeaderboard(true);
    const onVis = () => { if (document.visibilityState === 'visible') fetchLeaderboard(true); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [fetchLeaderboard]);

  /* Filter (search only — game/time go through API) */
  const filteredData = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((item) =>
      item.user.toLowerCase().includes(q) ||
      (item.gamerTag || '').toLowerCase().includes(q)
    );
  }, [data, search]);

  const top3 = filteredData.slice(0, 3);
  const showPodium = !search && top3.length === 3;
  // When the podium is shown, the table starts from rank 4.
  // Otherwise (search active or fewer than 3 players) show everyone in the table.
  const tableStart = showPodium ? 3 : 0;
  const restList = filteredData.slice(tableStart, tableStart + visibleRows);
  const currentUserRecord = data.find((u) => u.isCurrentUser);

  return (
    <div style={{ minHeight: '100vh', background: '#060608', position: 'relative', overflow: 'hidden', paddingBottom: 100 }}>
      <AnimatedBackground />

      {/* ── Sticky Top Bar ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(6,6,8,0.85)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none',
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: 'rgba(235,235,235,0.6)',
            padding: '7px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', transition: 'all 0.2s ease',
          }}>
            <iconify-icon icon="tabler:arrow-left" width="14" />
            Home
          </Link>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, overflow: 'hidden',
              background: '#0a0a0c',
              boxShadow: `0 0 18px -6px ${LIME}`,
            }}>
              <img
                src="https://img.magnific.com/premium-vector/gamer-logo-design-gaming-logo_327429-18.jpg"
                alt="ApexNova"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: '#ebebeb', letterSpacing: '-0.05em' }}>
              Apex<span style={{ color: LIME }}>Nova</span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => fetchLeaderboard(false)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(235,235,235,0.85)',
                padding: '6px 12px', borderRadius: 999,
                fontSize: 12, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif",
                cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${LIME}55`; e.currentTarget.style.color = LIME; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = 'rgba(235,235,235,0.85)'; }}
            >
              <iconify-icon icon="tabler:refresh" width="13" />
              Refresh
            </button>
            <motion.span
              key={pulseKey}
              animate={pulseKey > 0 ? { scale: [1, 1.06, 1], boxShadow: ['none', `0 0 18px ${LIME}88`, 'none'] } : {}}
              transition={{ duration: 0.8 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 10, color: LIME, padding: '5px 12px', background: 'rgba(204,255,0,0.10)', border: '1px solid rgba(204,255,0,0.30)', borderRadius: 999, letterSpacing: '0.14em', fontWeight: 700 }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: LIME, boxShadow: `0 0 8px ${LIME}`, animation: 'lb-pulse 1.6s ease-in-out infinite' }} />
              LIVE STANDINGS
            </motion.span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>

        {/* ── Page Header ── */}
        <div style={{ textAlign: 'center', paddingTop: 60, paddingBottom: 40 }}>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.05em', color: '#fff', margin: '0 0 12px 0' }}
          >
            Global <span style={{ color: LIME, textShadow: '0 0 40px rgba(204,255,0,0.4)' }}>Leaderboard</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, color: 'rgba(235,235,235,0.6)', margin: 0 }}
          >
            Track rankings and compete in real-time
          </motion.p>
        </div>

        {/* ── Filters ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          style={{ ...glassStyle, padding: '16px 20px', borderRadius: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}
        >
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {GAMES.map((g) => (
              <button
                key={g}
                onClick={() => setActiveGame(g)}
                style={{
                  background: activeGame === g ? LIME : 'rgba(255,255,255,0.05)',
                  color: activeGame === g ? '#000' : '#ebebeb',
                  border: activeGame === g ? `1px solid ${LIME}` : '1px solid rgba(255,255,255,0.1)',
                  padding: '8px 16px', borderRadius: 999, fontSize: 13,
                  fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                  boxShadow: activeGame === g ? `0 0 16px ${LIME}40` : 'none',
                }}
              >
                {g}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 999, padding: 4, border: '1px solid rgba(255,255,255,0.08)' }}>
              {TIMES.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTime(t)}
                  style={{
                    background: activeTime === t ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: activeTime === t ? '#fff' : 'rgba(255,255,255,0.5)',
                    padding: '6px 14px', borderRadius: 999, border: 'none', fontSize: 12,
                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search player…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                  padding: '8px 16px 8px 36px', borderRadius: 999, fontSize: 13,
                  fontFamily: "'Space Grotesk', sans-serif", width: 180,
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = LIME)}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
              <iconify-icon
                icon="tabler:search"
                width="14"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }}
              />
            </div>
          </div>
        </motion.div>

        {/* ── Loading State ── */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 0', flexDirection: 'column', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.08)', borderTopColor: LIME, animation: 'lb-spin 0.8s linear infinite' }} />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif" }}>
              Loading rankings…
            </span>
          </div>
        )}

        {!loading && (
          <>
            {/* ── Top 3 Podium ── */}
            {showPodium && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr) minmax(0,1fr)', gap: 16, alignItems: 'end', marginBottom: 60 }}>
                <TopPlayerCard player={top3[1]} place={2} />
                <TopPlayerCard player={top3[0]} place={1} />
                <TopPlayerCard player={top3[2]} place={3} />
              </div>
            )}

            {/* ── Your Rank Card ── */}
            {currentUserRecord && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
                style={{ ...glassStyle, borderRadius: '1.25rem', padding: '24px', marginBottom: 40, border: `1px solid ${LIME}50`, background: `linear-gradient(90deg, rgba(204,255,0,0.03), rgba(0,0,0,0.4))` }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(204,255,0,0.1)', border: `2px solid ${LIME}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: LIME, overflow: 'hidden' }}>
                      {currentUserRecord.avatar}
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: LIME, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                        Your Rank — #{currentUserRecord.rank}
                      </div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800, color: '#fff' }}>
                        {currentUserRecord.user}
                      </div>
                    </div>
                  </div>
                  <div style={{ height: 50, position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', right: '105%', textAlign: 'right', fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                      Recent run
                    </div>
                    <Sparkline data={currentUserRecord.sparkline} height={40} />
                    <div style={{ marginLeft: 16, fontFamily: MONO, fontSize: 18, color: LIME, fontWeight: 700 }}>
                      {currentUserRecord.score.toLocaleString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Leaderboard Table ── */}
            <div style={{ ...glassStyle, borderRadius: '1.25rem', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 2fr 1.5fr 1fr 100px', gap: 16, padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', fontFamily: MONO, fontSize: 11, color: 'rgba(235,235,235,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <div>Rank</div>
                <div>Player</div>
                <div>Game</div>
                <div style={{ textAlign: 'right' }}>Score</div>
                <div style={{ textAlign: 'right' }}>Wins</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <AnimatePresence mode="popLayout">
                  {restList.map((row, i) => {
                    const justUpdated = updatedIds.has(row.id);
                    return (
                      <motion.div
                        key={row.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{
                          opacity: 1, x: 0,
                          backgroundColor: justUpdated
                            ? ['rgba(204,255,0,0.20)', 'rgba(204,255,0,0.05)']
                            : (row.isCurrentUser
                                ? 'rgba(204,255,0,0.05)'
                                : (i % 2 === 0 ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0.01)')),
                        }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, delay: justUpdated ? 0 : i * 0.04, backgroundColor: { duration: 1.8 } }}
                        style={{
                          display: 'grid', gridTemplateColumns: '80px 2fr 1.5fr 1fr 100px', gap: 16,
                          padding: '16px 24px', alignItems: 'center',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: row.rank <= 3 ? '#fff' : 'rgba(255,255,255,0.5)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          #{row.rank}
                          {justUpdated && (
                            <motion.span
                              initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                              style={{ fontSize: 9, color: LIME, fontFamily: MONO, letterSpacing: '0.1em', padding: '1px 5px', background: 'rgba(204,255,0,0.15)', border: `1px solid ${LIME}40`, borderRadius: 4, fontWeight: 800 }}
                            >
                              NEW
                            </motion.span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ position: 'relative' }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: 'rgba(255,255,255,0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, fontWeight: 700, color: '#fff',
                              fontFamily: "'Space Grotesk', sans-serif",
                              border: row.isCurrentUser ? `1px solid ${LIME}` : 'none',
                              overflow: 'hidden',
                            }}>
                              {row.avatar}
                            </div>
                          </div>
                          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: row.isCurrentUser ? LIME : '#ebebeb' }}>
                            {row.user}
                            {row.isCurrentUser && (
                              <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px', borderRadius: 4, border: `1px solid ${LIME}40`, background: 'rgba(204,255,0,0.10)', color: LIME, fontFamily: MONO, letterSpacing: '0.1em' }}>YOU</span>
                            )}
                          </span>
                        </div>
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, color: 'rgba(235,235,235,0.6)' }}>
                          {row.game}
                        </div>
                        <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 600, color: '#fff', textAlign: 'right' }}>
                          {row.score.toLocaleString()}
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, fontFamily: MONO, fontSize: 13, fontWeight: 600, color: row.wins ? LIME : 'rgba(235,235,235,0.4)' }}>
                          {row.wins ? <iconify-icon icon="tabler:trophy" width="13" /> : null}
                          {row.wins || '—'}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredData.length === 0 && (
                  <div style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <iconify-icon icon="tabler:trophy-off" width="40" style={{ color: 'rgba(255,255,255,0.25)' }} />
                    No players found matching your criteria.
                  </div>
                )}
              </div>
            </div>

            {/* Load More */}
            {tableStart + visibleRows < filteredData.length && (
              <div style={{ textAlign: 'center', marginTop: 30 }}>
                <button
                  onClick={() => setVisibleRows((v) => v + 10)}
                  style={{
                    ...glassStyle,
                    padding: '12px 32px', borderRadius: 999,
                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: '#ebebeb',
                    cursor: 'pointer', transition: 'all 0.2s',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                >
                  <iconify-icon icon="tabler:chevron-down" width="14" />
                  Load more rankings
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes lb-spin { to { transform: rotate(360deg); } }
        @keyframes lb-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.9); }
        }
      `}</style>
    </div>
  );
};

export default LeaderboardPage;
