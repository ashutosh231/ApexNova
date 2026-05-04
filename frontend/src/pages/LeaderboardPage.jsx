import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Squares from '../components/Squares';

/* ─── Constants & Styles ─────────────────────────────────── */
const LIME = '#ccff00';
const GOLD = '#FBBF24';
const SILVER = '#9CA3AF';
const BRONZE = '#D97706';

const glassStyle = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.09)',
};

/* ─── Dummy Data ─────────────────────────────────────────── */
const GAMES = [
  'All',
  'Snake',
  'Tic Tac Toe',
  'Reaction Test',
  'Memory Match',
  'Number Guessing',
  'Word Blitz',
  'Chess Blitz',
  'Color Surge',
  'Math Rush',
  'Math Maze',
  'Ability Duels',
];
const TIMES = ['Today', 'Weekly', 'All-time'];

// Helper to generate sparkline data
const generateSparkline = (points, start, variance) => {
  let current = start;
  return Array.from({ length: points }, () => {
    current += (Math.random() - 0.4) * variance; // slight upward bias
    return current;
  });
};

import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/* ─── Minimal SVG Sparkline Chart ────────────────────────── */
// Very lightweight custom SVG line chart for the "Progress Graph"
const Sparkline = ({ data, color = LIME, height = 40, strokeWidth = 2 }) => {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // prevent div by 0

  const width = 100; // viewBox scale
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4); // leaving 4px padding
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* Fill Area */}
      <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#grad-${color.replace('#', '')})`} />
      {/* Line */}
      <motion.polyline
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
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

/* ─── Beast-Level Animated Background ────────────────────── */
const AnimatedBackground = () => {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* Interactive Squares Grid (Beast Level Background) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <Squares 
          direction="diagonal" 
          speed={0.4} 
          squareSize={40} 
          borderColor="rgba(255,255,255,0.06)" 
          hoverFillColor="rgba(204,255,0,0.18)" 
        />
      </div>

      {/* Floating Glowing Orbs (Mesh Gradient) */}
      <motion.div
        animate={{ x: ['-5%', '5%', '-5%'], y: ['-5%', '5%', '-5%'], scale: [1, 1.1, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '-10%', left: '-10%', width: '60vw', height: '60vw',
          background: 'radial-gradient(ellipse at center, rgba(204,255,0,0.1) 0%, transparent 60%)',
          mixBlendMode: 'screen'
        }}
      />
      <motion.div
        animate={{ x: ['10%', '-10%', '10%'], y: ['10%', '-5%', '10%'], scale: [1, 1.2, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        style={{
          position: 'absolute', bottom: '-20%', right: '-10%', width: '70vw', height: '70vw',
          background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.08) 0%, transparent 60%)',
          mixBlendMode: 'screen'
        }}
      />
      <motion.div
        animate={{ x: ['-5%', '10%', '-5%'], y: ['10%', '-10%', '10%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{
          position: 'absolute', top: '30%', left: '20%', width: '50vw', height: '50vw',
          background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.05) 0%, transparent 60%)',
          mixBlendMode: 'screen'
        }}
      />
      <motion.div
        animate={{ x: ['5%', '-5%', '5%'], y: ['-10%', '10%', '-10%'] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        style={{
          position: 'absolute', top: '10%', right: '10%', width: '50vw', height: '50vw',
          background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.06) 0%, transparent 60%)',
          mixBlendMode: 'screen'
        }}
      />

      {/* Noise Texture */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, opacity: 0.12,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\")",
        mixBlendMode: 'overlay',
      }} />

      <style>{`
        @keyframes drift-grid {
          0% { transform: translateY(0) }
          100% { transform: translateY(80px) }
        }
      `}</style>
    </div>
  );
};

/* ─── Top 3 Podium Card Component ────────────────────────── */
const TopPlayerCard = ({ player, place }) => {
  const isFirst = place === 1;
  const colors = {
    1: { hex: GOLD, glow: 'rgba(251, 191, 36, 0.25)' },
    2: { hex: SILVER, glow: 'rgba(156, 163, 175, 0.15)' },
    3: { hex: BRONZE, glow: 'rgba(217, 119, 6, 0.15)' }
  };
  const c = colors[place];

  // Different heights to create a podium effect visually
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
      {/* Crown for 1st place */}
      {isFirst && (
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: -20, fontSize: 32, filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.6))' }}
        >
          👑
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
      }}>
        {player.avatar}
      </div>

      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: '#fff', margin: '0 0 4px 0' }}>
        {player.user}
      </h3>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(235,235,235,0.5)', marginBottom: 16 }}>
        {player.game}
      </div>

      <div style={{
        fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 24,
        color: c.hex, textShadow: `0 0 12px ${c.glow}`
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
  const [cursorFx, setCursorFx] = useState({ hover: false });

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const url = new URL(`${API_BASE_URL}/leaderboard`);
        url.searchParams.append('game', activeGame);
        url.searchParams.append('time', activeTime);
        
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (res.ok && json.leaderboard) {
          const formatted = json.leaderboard.map(item => ({
            id: item.id.toString(),
            rank: item.rank,
            user: item.name,
            game: activeGame === 'All' ? 'All Games' : activeGame,
            score: item.best_score,
            change: 0,
            avatar: item.avatar_url ? <img src={item.avatar_url} alt={item.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : (item.name || '?').charAt(0).toUpperCase(),
            active: false,
            isCurrentUser: item.is_self,
            sparkline: generateSparkline(10, Math.max(0, item.best_score - 500), 500),
          }));
          setData(formatted);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchLeaderboard();
  }, [token, activeGame, activeTime]);

  /* Cursor Setup */
  const cursorRef = useRef(null);
  const followerRef = useRef(null);
  useEffect(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    let fx = 0, fy = 0, cx = 0, cy = 0;
    const onMove = e => {
      cx = e.clientX; cy = e.clientY;
      if (cursor) { cursor.style.left = cx + 'px'; cursor.style.top = cy + 'px'; }
    };
    const loop = () => {
      fx += (cx - fx) * 0.12; fy += (cy - fy) * 0.12;
      if (follower) { follower.style.left = fx + 'px'; follower.style.top = fy + 'px'; }
      requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', onMove);
    loop();
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Filtering (only search on frontend now)
  const filteredData = data.filter(item => {
    if (search && !item.user.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const top3 = filteredData.slice(0, 3);
  const restList = filteredData.slice(3, visibleRows);
  const currentUserRecord = data.find(u => u.isCurrentUser);

  return (
    <div style={{ minHeight: '100vh', background: '#060608', position: 'relative', overflow: 'hidden', paddingBottom: 100 }}>
      {/* ── Custom Cursor ── */}
      <div ref={cursorRef} className="cursor" style={{ transform: cursorFx.hover ? 'translate(-50%,-50%) scale(2)' : 'translate(-50%,-50%) scale(1)' }} />
      <div ref={followerRef} className="cursor-follower" style={{ opacity: cursorFx.hover ? 0 : 1 }} />

      {/* ── Background Grid & Glows ── */}
      <AnimatedBackground />

      {/* ── Sticky Top Bar ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(6,6,8,0.85)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/" onMouseEnter={() => setCursorFx({hover:true})} onMouseLeave={() => setCursorFx({hover:false})} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none',
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: 'rgba(235,235,235,0.6)',
            padding: '7px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', transition: 'all 0.2s ease',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Home
          </Link>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: '#ebebeb', letterSpacing: '-0.05em' }}>
            Apex<span style={{ color: LIME }}>Nova</span>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: LIME, padding: '4px 10px', background: 'rgba(204,255,0,0.1)', borderRadius: 999 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: LIME, animation: 'pulse-dot 2s infinite' }} />
              LIVE STANDINGS
            </span>
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
          {/* Games Toggles */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {GAMES.map(g => (
              <button key={g} onClick={() => setActiveGame(g)} style={{
                background: activeGame === g ? LIME : 'rgba(255,255,255,0.05)',
                color: activeGame === g ? '#000' : '#ebebeb',
                border: activeGame === g ? `1px solid ${LIME}` : '1px solid rgba(255,255,255,0.1)',
                padding: '8px 16px', borderRadius: 999, fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
              }}>
                {g}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            {/* Time Toggle */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 999, padding: 4, border: '1px solid rgba(255,255,255,0.08)' }}>
              {TIMES.map(t => (
                <button key={t} onClick={() => setActiveTime(t)} style={{
                  background: activeTime === t ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: activeTime === t ? '#fff' : 'rgba(255,255,255,0.5)',
                  padding: '6px 14px', borderRadius: 999, border: 'none', fontSize: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, cursor: 'pointer'
                }}>
                  {t}
                </button>
              ))}
            </div>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <input 
                type="text" placeholder="Search player..." value={search} onChange={e => setSearch(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                  padding: '8px 16px 8px 36px', borderRadius: 999, fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", width: 180,
                  outline: 'none', transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = LIME}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
          </div>
        </motion.div>

        {/* ── Loading State ── */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 0', flexDirection: 'column', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid rgba(255,255,255,0.08)`, borderTopColor: LIME, animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif" }}>Loading rankings...</span>
          </div>
        )}

        {!loading && (
          <>
            {/* ── Top 3 Podium ── */}
            {!search && activeGame === 'All' && top3.length === 3 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr) minmax(0,1fr)', gap: 16, alignItems: 'end', marginBottom: 60 }}>
                <TopPlayerCard player={top3[1]} place={2} />
                <TopPlayerCard player={top3[0]} place={1} />
                <TopPlayerCard player={top3[2]} place={3} />
              </div>
            )}

        {/* ── Combined "Your Rank" Graph & Card Highlight ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{ ...glassStyle, borderRadius: '1.25rem', padding: '24px', marginBottom: 40, border: `1px solid ${LIME}50`, background: `linear-gradient(90deg, rgba(204,255,0,0.03), rgba(0,0,0,0.4))` }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(204,255,0,0.1)', border: `2px solid ${LIME}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: LIME }}>
                {currentUserRecord?.avatar}
              </div>
              <div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: LIME, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Your Rank - #{currentUserRecord?.rank}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800, color: '#fff' }}>{currentUserRecord?.user}</div>
              </div>
            </div>
            
            {/* Minimal Progress Line Chart Component inline */}
            <div style={{ height: 50, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', right: '105%', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Recent run</div>
              <Sparkline data={currentUserRecord?.sparkline} height={40} />
              <div style={{ marginLeft: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: LIME, fontWeight: 700 }}>
                {currentUserRecord?.score.toLocaleString()}
                <span style={{ fontSize: 12, marginLeft: 6, color: currentUserRecord?.change >= 0 ? LIME : '#ef4444' }}>
                  {currentUserRecord?.change >= 0 ? '▲' : '▼'} {Math.abs(currentUserRecord?.change)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Leaderboard Table ── */}
        <div style={{ ...glassStyle, borderRadius: '1.25rem', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '80px 2fr 1.5fr 1fr 100px', gap: 16, padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(235,235,235,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <div>Rank</div>
            <div>Player</div>
            <div>Game</div>
            <div style={{ textAlign: 'right' }}>Score</div>
            <div style={{ textAlign: 'right' }}>Change</div>
          </div>

          {/* Rows */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <AnimatePresence mode="popLayout">
              {restList.map((row, i) => (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  style={{
                    display: 'grid', gridTemplateColumns: '80px 2fr 1.5fr 1fr 100px', gap: 16, padding: '16px 24px', alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: row.isCurrentUser ? 'rgba(204,255,0,0.05)' : (i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'),
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = row.isCurrentUser ? 'rgba(204,255,0,0.1)' : 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = row.isCurrentUser ? 'rgba(204,255,0,0.05)' : (i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)');
                  }}
                >
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: row.rank <= 3 ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                    #{row.rank}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: "'Space Grotesk', sans-serif", border: row.isCurrentUser ? `1px solid ${LIME}` : 'none' }}>
                        {row.avatar}
                      </div>
                      {/* Live Indicator */}
                      {row.active && <div style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, background: '#10B981', border: '2px solid #060608', borderRadius: '50%', animation: 'pulse-dot 2s infinite' }} title="Live Now" />}
                    </div>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: row.isCurrentUser ? LIME : '#ebebeb' }}>
                      {row.user} {row.isCurrentUser && '(You)'}
                    </span>
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, color: 'rgba(235,235,235,0.6)' }}>
                    {row.game}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 600, color: '#fff', textAlign: 'right' }}>
                    {row.score.toLocaleString()}
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: row.change === 0 ? 'rgba(235,235,235,0.4)' : (row.change > 0 ? LIME : '#ef4444') }}>
                    {row.change > 0 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"></polyline></svg>}
                    {row.change < 0 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>}
                    {row.change === 0 ? '-' : Math.abs(row.change)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredData.length === 0 && (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk', sans-serif" }}>
                No players found matching your criteria.
              </div>
            )}
          </div>
        </div>

        {/* Load More Option */}
        {visibleRows < filteredData.length && (
          <div style={{ textAlign: 'center', marginTop: 30 }}>
            <button
              onClick={() => setVisibleRows(v => v + 5)}
              onMouseEnter={() => setCursorFx({hover:true})} onMouseLeave={() => setCursorFx({hover:false})}
              style={{
                ...glassStyle,
                padding: '12px 32px', borderRadius: 999,
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: '#ebebeb',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              Load More Rankings
            </button>
          </div>
        )}
        </>
        )}

      </div>
    </div>
  );
};

export default LeaderboardPage;
