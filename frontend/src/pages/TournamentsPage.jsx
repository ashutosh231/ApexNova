import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ALL_TOURNAMENTS, buildFilters } from '../data/allTournaments.js';
import { getTournamentConfig, syncSessionFromTournament } from '../data/tournamentConfig.js';

const LIME = '#ccff00';
const PURPLE = '#bd00ff';
const CYAN = '#00f0ff';
const PINK = '#fb7185';
const MONO = "'JetBrains Mono', monospace";
const BLOOM_FILTERS = buildFilters(ALL_TOURNAMENTS);

/* ── Theme per game ─────────────────────────────────── */
const GAME_THEME = {
  'snake-championship': { c1: '#ccff00', c2: '#10b981', emoji: '🐍' },
  'tictactoe-masters': { c1: '#f97316', c2: '#ef4444', emoji: '❌' },
  'memory-grand-prix': { c1: '#a78bfa', c2: '#7c3aed', emoji: '🧠' },
  'number-guessing-open': { c1: '#facc15', c2: '#f59e0b', emoji: '🔢' },
  'pixel-memory-ultra': { c1: '#00ffff', c2: '#ff00ff', emoji: '🧩' },
  'chess-blitz-open': { c1: '#60a5fa', c2: '#6366f1', emoji: '♟️' },
};

/* ── Helpers ─────────────────────────────────────────── */
function fillPct(str) {
  const [a, b] = str.split('/');
  const cur = parseInt(a.replace(/,/g, ''), 10);
  const max = parseInt(b.trim().replace(/,/g, ''), 10);
  if (!max) return 0;
  return Math.min(100, Math.round((cur / max) * 100));
}

function tagColor(tag) {
  if (tag === 'LIVE') return { bg: 'rgba(204,255,0,0.14)', border: 'rgba(204,255,0,0.55)', text: LIME };
  if (tag === 'FINALS') return { bg: 'rgba(251,113,133,0.14)', border: 'rgba(251,113,133,0.55)', text: PINK };
  if (tag === 'REGISTERING') return { bg: 'rgba(56,189,248,0.14)', border: 'rgba(56,189,248,0.55)', text: '#38bdf8' };
  return { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.20)', text: 'rgba(235,235,235,0.8)' };
}

function diffColor(d) {
  if (d === 'Hard') return PINK;
  if (d === 'Easy') return '#10b981';
  return '#f59e0b';
}

/* ── Tournament Card ──────────────────────────────────── */
function TournamentCard({ t, index, large = false }) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const pct = fillPct(t.players);
  const tc = tagColor(t.tagLabel);
  const theme = GAME_THEME[t.id] || { c1: LIME, c2: '#10b981' };
  const c1 = theme.c1;
  const c2 = theme.c2;

  const handleJoin = (e) => {
    if (e) e.stopPropagation();
    syncSessionFromTournament(t.id);
    const cfg = getTournamentConfig(t.id);
    navigate(cfg.usesMemoryShell ? `/memory-match-room?tournament=${t.id}` : `/match-room?tournament=${t.id}`);
  };

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleJoin}
      style={{
        position: 'relative',
        borderRadius: 22,
        overflow: 'hidden',
        cursor: 'pointer',
        background: '#0a0a0c',
        border: `1px solid ${hovered ? `${c1}55` : 'rgba(255,255,255,0.06)'}`,
        boxShadow: hovered
          ? `0 30px 70px -20px rgba(0,0,0,0.7), 0 0 50px -10px ${c1}30, inset 0 0 0 1px ${c1}22`
          : '0 12px 36px -12px rgba(0,0,0,0.5)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease, box-shadow 0.4s ease',
        minHeight: large ? 380 : 340,
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Image area */}
      <div style={{ position: 'relative', height: large ? 220 : 180, overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={t.coverImage}
          alt={t.name}
          loading="lazy"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
            filter: 'saturate(1.15) contrast(1.05)',
            transform: hovered ? 'scale(1.08)' : 'scale(1.02)',
            transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)',
          }}
        />
        {/* Multi-layer gradient overlay */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
          background: `
            linear-gradient(180deg, rgba(10,10,12,0) 0%, rgba(10,10,12,0.4) 60%, rgba(10,10,12,1) 100%),
            radial-gradient(ellipse 80% 60% at 30% 0%, ${c1}22 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 100% 100%, ${c2}1a 0%, transparent 70%)
          `,
        }} />
        {/* Diagonal scanline that animates on hover */}
        <div aria-hidden style={{
          position: 'absolute', top: '-50%', left: '-25%', width: '150%', height: 2,
          background: `linear-gradient(90deg, transparent, ${c1}99, transparent)`,
          transform: hovered ? 'translateY(180px) rotate(-8deg)' : 'translateY(-100px) rotate(-8deg)',
          transition: 'transform 0.9s cubic-bezier(0.16,1,0.3,1)',
          opacity: hovered ? 0.7 : 0,
          filter: 'blur(1px)',
        }} />

        {/* Status pill */}
        <div style={{
          position: 'absolute', top: 14, left: 14,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 999,
          background: `linear-gradient(135deg, ${tc.bg}, rgba(0,0,0,0.4))`,
          border: `1px solid ${tc.border}`,
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          fontFamily: MONO, fontSize: 10, fontWeight: 800, letterSpacing: '0.16em',
          color: tc.text, textTransform: 'uppercase',
          boxShadow: `0 4px 12px -4px ${tc.text}66`,
        }}>
          {t.isLive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: tc.text, boxShadow: `0 0 8px ${tc.text}`, animation: 'arenaDot 1.4s ease-in-out infinite' }} />}
          {t.tagLabel}
        </div>

        {/* Time chip */}
        <div style={{
          position: 'absolute', top: 14, right: 14,
          padding: '6px 12px', borderRadius: 999,
          background: 'rgba(0,0,0,0.55)',
          border: '1px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(10px)',
          fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
          color: 'rgba(235,235,235,0.85)',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <iconify-icon icon="lucide:clock" width="11" />
          {t.timeLeft}
        </div>

        {/* Game emoji watermark */}
        <div style={{
          position: 'absolute', right: -8, bottom: -8,
          fontSize: large ? 110 : 90,
          opacity: 0.18,
          filter: `drop-shadow(0 0 30px ${c1})`,
          pointerEvents: 'none',
          transform: hovered ? 'translate(-4px, -4px) scale(1.08) rotate(-6deg)' : 'translate(0, 0) scale(1) rotate(-3deg)',
          transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {t.emoji}
        </div>
      </div>

      {/* Body */}
      <div style={{ position: 'relative', padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {/* Top row: chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'rgba(235,235,235,0.6)',
            padding: '4px 9px', borderRadius: 6,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>{t.game}</span>
          <span style={{
            fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
            color: diffColor(t.difficulty),
            padding: '4px 9px', borderRadius: 6,
            background: `${diffColor(t.difficulty)}12`,
            border: `1px solid ${diffColor(t.difficulty)}40`,
          }}>{t.difficulty}</span>
        </div>

        {/* Title */}
        <h3 style={{
          margin: 0,
          fontWeight: 800,
          fontSize: large ? 22 : 18,
          letterSpacing: '-0.04em',
          color: '#fff',
          lineHeight: 1.15,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: large ? 24 : 20 }}>{t.emoji}</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t.name}
          </span>
        </h3>

        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
          padding: '12px 14px',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 12,
        }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.40)', marginBottom: 3 }}>
              Players
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <iconify-icon icon="lucide:users" width="13" style={{ color: 'rgba(235,235,235,0.5)' }} />
              {t.players}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.40)', marginBottom: 3 }}>
              Prize Pool
            </div>
            <div style={{ fontWeight: 900, fontSize: 16, color: c1, letterSpacing: '-0.02em', textShadow: `0 0 16px ${c1}55` }}>
              {t.prize}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.4)' }}>
              Filled
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 800, color: c1 }}>
              {pct}%
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`, borderRadius: 999,
              background: `linear-gradient(90deg, ${c1}, ${c2})`,
              boxShadow: `0 0 10px ${c1}66`,
              transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleJoin}
          style={{
            marginTop: 'auto',
            width: '100%',
            padding: '13px 0',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 800, fontSize: 13,
            letterSpacing: '0.02em',
            color: '#0a0a0c',
            background: `linear-gradient(135deg, ${c1}, ${c2})`,
            boxShadow: hovered
              ? `0 14px 36px -8px ${c1}, 0 0 0 1px rgba(255,255,255,0.15) inset`
              : `0 8px 26px -8px ${c1}aa, 0 0 0 1px rgba(255,255,255,0.1) inset`,
            transition: 'box-shadow 0.3s ease, transform 0.2s ease',
            transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <iconify-icon icon="lucide:swords" width="16" />
          Join Tournament
          <iconify-icon icon="lucide:arrow-right" width="14" style={{ transform: hovered ? 'translateX(4px)' : 'translateX(0)', transition: 'transform 0.3s ease' }} />
        </button>
      </div>
    </motion.article>
  );
}

/* ── Main Page ─────────────────────────────────────── */
const TournamentsPage = () => {
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_TOURNAMENTS;
    const tokens = q.split(/\s+/);
    return ALL_TOURNAMENTS.filter((t, idx) => {
      const bf = BLOOM_FILTERS[idx];
      if (!tokens.every((tok) => bf.mightContain(tok))) return false;
      const hay = `${t.name} ${t.game} ${t.category} ${t.difficulty} ${t.tagLabel}`.toLowerCase();
      return tokens.every((tok) => hay.includes(tok));
    });
  }, [query]);

  const liveCount = filtered.filter((t) => t.isLive).length;
  const totalPrize = filtered.reduce((s, t) => s + parseInt(t.prize.replace(/[^0-9]/g, ''), 10), 0);

  return (
    <div
      className="arena-shell"
      style={{
        '--arena-bloom-1': 'rgba(204,255,0,0.15)',
        '--arena-bloom-2': 'rgba(189,0,255,0.12)',
        '--arena-bloom-3': 'rgba(0,240,255,0.10)',
        '--arena-bloom-4': 'rgba(168,85,247,0.10)',
        '--arena-orb-1': 'rgba(204,255,0,0.22)',
        '--arena-orb-2': 'rgba(189,0,255,0.18)',
        '--arena-orb-3': 'rgba(0,240,255,0.14)',
        paddingBottom: 80,
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

      {/* ── Sticky top bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        background: 'rgba(6,6,8,0.85)',
      }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <Link to="/" className="arena-btn-ghost" style={{ textDecoration: 'none', padding: '8px 14px' }}>
            <iconify-icon icon="lucide:arrow-left" width="14" />
            Home
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: `linear-gradient(135deg, ${LIME}, #10b981)`,
              display: 'grid', placeItems: 'center',
              boxShadow: `0 4px 16px -4px ${LIME}`,
            }}>
              <iconify-icon icon="lucide:gamepad-2" width="18" style={{ color: '#000' }} />
            </div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.04em', color: '#fff' }}>
              Apex<span style={{ color: LIME }}>Nova</span>
            </div>
          </div>

          {/* Search */}
          <div style={{ flex: 1, minWidth: 200, position: 'relative', maxWidth: 380 }}>
            <iconify-icon icon="lucide:search" width="14"
              style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(235,235,235,0.4)', pointerEvents: 'none' }} />
            <input
              ref={searchRef}
              type="text"
              placeholder='Search games… (press "/" to focus)'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 999, padding: '10px 14px 10px 36px',
                color: '#fff', fontSize: 13, fontFamily: 'inherit',
                outline: 'none', transition: 'border-color 0.2s ease, background 0.2s ease',
              }}
              onFocus={(e) => { e.target.style.borderColor = `${LIME}55`; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
            />
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {liveCount > 0 && (
              <div className="arena-pill arena-pill-live">
                <span className="arena-dot" />
                {liveCount} LIVE
              </div>
            )}
            <div className="arena-pill">
              {filtered.length} / {ALL_TOURNAMENTS.length} GAMES
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero Banner ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '36px 24px 0', position: 'relative', zIndex: 2 }}>
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative',
            borderRadius: 28,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #0a0a0c 0%, #14141a 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: 'clamp(36px, 6vw, 64px) clamp(24px, 4vw, 56px)',
            marginBottom: 36,
            minHeight: 280,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}
        >
          {/* Layered backgrounds */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `
              radial-gradient(ellipse 60% 70% at 0% 0%, ${LIME}1c, transparent 60%),
              radial-gradient(ellipse 50% 60% at 100% 100%, ${PURPLE}18, transparent 65%),
              radial-gradient(ellipse 40% 50% at 100% 0%, ${CYAN}12, transparent 70%)
            `,
          }} />
          {/* Grid pattern */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            opacity: 0.4,
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent 80%)',
          }} />
          {/* Animated light streak */}
          <div aria-hidden style={{
            position: 'absolute', top: '20%', left: '-20%', width: '140%', height: 1,
            background: `linear-gradient(90deg, transparent, ${LIME}66, transparent)`,
            transform: 'rotate(-2deg)',
            animation: 'lightStreak 8s ease-in-out infinite',
            opacity: 0.5,
          }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 24, alignItems: 'center' }}>
            <div>
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '6px 14px', borderRadius: 999,
                  background: `linear-gradient(135deg, ${LIME}15, transparent)`,
                  border: `1px solid ${LIME}40`,
                  fontFamily: MONO, fontSize: 10, fontWeight: 800, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: LIME,
                  marginBottom: 18,
                }}
              >
                <iconify-icon icon="lucide:zap" width="12" />
                Season 03 · Live now
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{
                  margin: 0, fontWeight: 900,
                  fontSize: 'clamp(2.4rem, 5.5vw, 4.4rem)',
                  letterSpacing: '-0.06em', lineHeight: 0.95,
                  color: '#fff',
                }}
              >
                Pick your{' '}
                <span style={{
                  background: `linear-gradient(105deg, ${LIME} 0%, #fff 50%, ${PURPLE} 100%)`,
                  WebkitBackgroundClip: 'text', backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontStyle: 'italic',
                }}>battle</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                style={{ marginTop: 14, fontSize: 16, color: 'rgba(235,235,235,0.6)', lineHeight: 1.6, maxWidth: 540 }}
              >
                6 competitive games · real-time leaderboards · live prize pools. Drop in solo, squad up with friends, climb global ranks.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                style={{ display: 'flex', gap: 24, marginTop: 22, flexWrap: 'wrap' }}
              >
                {[
                  { label: 'Total prize pool', value: `$${totalPrize.toLocaleString()}`, color: LIME, icon: 'lucide:trophy' },
                  { label: 'Live tournaments', value: liveCount, color: PINK, icon: 'lucide:radio' },
                  { label: 'Active games', value: filtered.length, color: CYAN, icon: 'lucide:gamepad-2' },
                ].map((s) => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `${s.color}15`, border: `1px solid ${s.color}40`,
                      display: 'grid', placeItems: 'center',
                    }}>
                      <iconify-icon icon={s.icon} width="16" style={{ color: s.color }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.4)' }}>
                        {s.label}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.02em' }}>
                        {s.value}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Trophy/Controller icon block */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, rotate: -10 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 180, damping: 14 }}
              style={{
                width: 'clamp(120px, 20vw, 200px)',
                aspectRatio: '1',
                borderRadius: 28,
                background: `radial-gradient(circle at 30% 30%, ${LIME}28, transparent 70%), radial-gradient(circle at 70% 70%, ${PURPLE}22, transparent 70%), rgba(255,255,255,0.03)`,
                border: `1px solid ${LIME}30`,
                display: 'grid', placeItems: 'center',
                boxShadow: `0 20px 60px -10px ${LIME}30, inset 0 0 40px rgba(255,255,255,0.05)`,
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Animated rings */}
              <div aria-hidden style={{
                position: 'absolute', inset: 8, borderRadius: '50%',
                border: `1px dashed ${LIME}40`,
                animation: 'spin 20s linear infinite',
              }} />
              <div aria-hidden style={{
                position: 'absolute', inset: 22, borderRadius: '50%',
                border: `1px dashed ${PURPLE}40`,
                animation: 'spin 14s linear infinite reverse',
              }} />
              <iconify-icon
                icon="lucide:trophy"
                width="80"
                style={{
                  color: LIME,
                  filter: `drop-shadow(0 0 20px ${LIME}88) drop-shadow(0 0 40px ${LIME}44)`,
                  animation: 'floatBadge 3.5s ease-in-out infinite',
                }}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* ── Tournament Grid ── */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              textAlign: 'center', padding: '80px 24px',
              color: 'rgba(235,235,235,0.5)',
            }}
          >
            <iconify-icon icon="lucide:search-x" width="64" style={{ color: 'rgba(235,235,235,0.3)', marginBottom: 16 }} />
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#fff' }}>No games found</p>
            <p style={{ fontSize: 14 }}>Try a different search term.</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
              gap: 18,
            }}>
              {filtered.map((t, i) => (
                <TournamentCard key={t.id} t={t} index={i} large={i < 2} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes lightStreak {
          0%, 100% { transform: translateX(-30%) rotate(-2deg); opacity: 0; }
          50% { transform: translateX(30%) rotate(-2deg); opacity: 0.7; }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(2deg); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TournamentsPage;
