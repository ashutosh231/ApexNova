import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { buildFilters } from '../data/allTournaments.js';
import { getTournamentConfig, syncSessionFromTournament } from '../data/tournamentConfig.js';
import { useTournaments } from '../hooks/useTournaments.js';
import { useSubscription } from '../hooks/useSubscription.js';
import PremiumLockModal from '../components/PremiumLockModal.jsx';

const LIME = '#ccff00';
const PURPLE = '#bd00ff';
const CYAN = '#00f0ff';
const PINK = '#fb7185';
const MONO = "'JetBrains Mono', monospace";

const GAME_THEME = {
  'snake-championship': { c1: '#ccff00', c2: '#10b981' },
  'tictactoe-masters': { c1: '#f97316', c2: '#ef4444' },
  'memory-grand-prix': { c1: '#a78bfa', c2: '#7c3aed' },
  'number-guessing-open': { c1: '#facc15', c2: '#f59e0b' },
  'pixel-memory-ultra': { c1: '#00ffff', c2: '#ff00ff' },
  'chess-blitz-open': { c1: '#60a5fa', c2: '#6366f1' },
};

const CATEGORIES = ['All', 'Arcade', 'Strategy', 'Puzzle'];

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

function cardTheme(t) {
  if (t.accent && t.secondary) return { c1: t.accent, c2: t.secondary };
  return GAME_THEME[t.id] || { c1: LIME, c2: '#10b981' };
}

function TournamentCard({ t, index, isLocked, isLimitHit, onLockClick }) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const pct = t.fill_percent ?? 0;
  const tag = t.tagLabel ?? t.tag_label ?? 'OPEN';
  const tc = tagColor(tag);
  const { c1, c2 } = cardTheme(t);
  const isLive = t.isLive ?? t.is_live;
  const cfg = getTournamentConfig(t.id);
  const gameIcon = cfg.icon || 'tabler:device-gamepad-2';

  const [timeLeftToMidnight, setTimeLeftToMidnight] = useState('');

  useEffect(() => {
    if (!isLimitHit) return;

    const calcTime = () => {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const diffMs = midnight - now;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeftToMidnight(`${hours}h ${minutes}m`);
    };

    calcTime();
    const interval = setInterval(calcTime, 30000); // update every 30s
    return () => clearInterval(interval);
  }, [isLimitHit]);

  const handleJoin = (e) => {
    e?.stopPropagation();
    if (isLocked || isLimitHit) {
      onLockClick();
      return;
    }
    syncSessionFromTournament(t.id);
    navigate(`/lobby/${cfg.slug}`);
  };

  return (
    <motion.article
      className="tournament-card"
      style={{
        '--tc-accent': isLimitHit ? '#f97316' : (isLocked ? LIME : c1),
        '--tc-secondary': isLimitHit ? '#ef4444' : (isLocked ? '#10b981' : c2),
        cursor: 'pointer',
        borderColor: isLimitHit ? 'rgba(249, 115, 22, 0.25)' : (isLocked ? 'rgba(204, 255, 0, 0.15)' : 'rgba(255, 255, 255, 0.06)'),
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
      onClick={handleJoin}
      layout
    >
      <motion.div className="tournament-card-media" layout="position" style={{ overflow: 'hidden' }}>
        <img
          src={t.coverImage ?? t.cover_image}
          alt={t.name}
          loading="lazy"
          style={{
            filter: isLimitHit ? 'blur(4px) grayscale(0.7) brightness(0.28)' : (isLocked ? 'blur(5px) grayscale(0.9) brightness(0.25)' : 'none'),
            transform: (isLocked || isLimitHit) ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.45s ease',
          }}
        />
        <motion.div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              linear-gradient(180deg, transparent 0%, rgba(6,6,8,0.5) 55%, rgba(6,6,8,0.98) 100%),
              radial-gradient(ellipse 70% 50% at 0% 0%, ${c1}28, transparent 65%)
            `,
          }}
        />
        {isLocked && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'grid', placeItems: 'center',
            zIndex: 10,
            background: 'rgba(6, 6, 8, 0.55)',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(10,10,14,0.92)',
              border: `1.5px solid ${LIME}`,
              display: 'grid', placeItems: 'center',
              color: LIME,
              boxShadow: `0 0 24px ${LIME}55, inset 0 0 10px ${LIME}33`,
              position: 'relative',
            }}>
              <iconify-icon icon="lucide:lock" width="20" style={{ filter: `drop-shadow(0 0 4px ${LIME})` }} />
              <div style={{
                position: 'absolute', inset: -6, borderRadius: '50%',
                border: `1px solid ${LIME}44`,
                animation: 'lockRingPulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite',
              }} />
            </div>
          </div>
        )}
        {isLimitHit && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'grid', placeItems: 'center',
            zIndex: 10,
            background: 'rgba(6, 6, 8, 0.55)',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(10,10,14,0.92)',
              border: '1px solid #f97316',
              display: 'grid', placeItems: 'center',
              color: '#f97316',
              boxShadow: `0 0 24px rgba(249, 115, 22, 0.55), inset 0 0 10px rgba(249, 115, 22, 0.33)`,
              position: 'relative',
            }}>
              <iconify-icon icon="lucide:clock" width="20" style={{ filter: `drop-shadow(0 0 4px #f97316)` }} />
              <div style={{
                position: 'absolute', inset: -6, borderRadius: '50%',
                border: '1px solid rgba(249, 115, 22, 0.44)',
                animation: 'lockRingPulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite',
              }} />
            </div>
          </div>
        )}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 999,
          background: isLimitHit ? 'rgba(249, 115, 22, 0.15)' : (isLocked ? 'rgba(204, 255, 0, 0.15)' : tc.bg),
          border: `1px solid ${isLimitHit ? 'rgba(249, 115, 22, 0.4)' : (isLocked ? 'rgba(204, 255, 0, 0.38)' : tc.border)}`,
          backdropFilter: 'blur(12px)',
          fontFamily: MONO, fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
          color: isLimitHit ? '#f97316' : (isLocked ? LIME : tc.text), textTransform: 'uppercase',
          zIndex: 11,
        }}>
          {isLive && !isLocked && !isLimitHit && <span className="arena-dot" style={{ width: 5, height: 5 }} />}
          {isLimitHit ? (
            <>
              <iconify-icon icon="lucide:clock" width="10" />
              DAILY LIMIT HIT
            </>
          ) : (isLocked ? (
            <>
              <iconify-icon icon="lucide:lock" width="10" />
              PLAY PASS ONLY
            </>
          ) : tag)}
        </div>
        <motion.div style={{
          position: 'absolute', top: 12, right: 12,
          padding: '5px 10px', borderRadius: 999,
          background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.1)',
          fontFamily: MONO, fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
          color: 'rgba(235,235,235,0.85)',
          display: 'inline-flex', alignItems: 'center', gap: 4,
          zIndex: 11,
          opacity: (isLocked || isLimitHit) ? 0.6 : 1,
        }}>
          <iconify-icon icon="lucide:clock" width="10" />
          {t.timeLeft ?? t.time_left}
        </motion.div>
        <motion.span style={{
          position: 'absolute', right: 14, bottom: 10,
          opacity: 0.22, lineHeight: 1,
          color: c1,
          filter: `drop-shadow(0 0 24px ${c1})`,
          display: 'inline-flex',
        }}>
          <iconify-icon icon={gameIcon} width="78" />
        </motion.span>
      </motion.div>

      <div className="tournament-card-body" style={{ opacity: (isLocked || isLimitHit) ? 0.7 : 1, transition: 'opacity 0.3s ease' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'rgba(235,235,235,0.55)', padding: '3px 8px', borderRadius: 6,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          }}>{t.game}</span>
          <span style={{
            fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: diffColor(t.difficulty), padding: '3px 8px', borderRadius: 6,
            background: `${diffColor(t.difficulty)}12`, border: `1px solid ${diffColor(t.difficulty)}35`,
          }}>{t.difficulty}</span>
        </div>

        <h3 style={{
          margin: 0, fontWeight: 800, fontSize: 17, letterSpacing: '-0.04em',
          color: '#fff', lineHeight: 1.2,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8,
            background: `${c1}18`, border: `1px solid ${c1}40`,
            display: 'grid', placeItems: 'center',
            color: c1, flexShrink: 0,
          }}>
            <iconify-icon icon={gameIcon} width="16" />
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
        </h3>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          padding: '10px 12px', borderRadius: 12,
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <motion.div>
            <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.38)', marginBottom: 2 }}>Players</div>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#fff', display: 'flex', alignItems: 'center', gap: 5 }}>
              <iconify-icon icon="lucide:users" width="12" style={{ opacity: 0.5 }} />
              {t.players}
            </div>
          </motion.div>
          <motion.div style={{ textAlign: 'right' }}>
            <motion.div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.38)', marginBottom: 2 }}>Prize</motion.div>
            <div style={{ fontWeight: 900, fontSize: 15, color: c1, letterSpacing: '-0.02em', textShadow: `0 0 14px ${c1}44` }}>{t.prize}</div>
          </motion.div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.38)' }}>Filled</span>
            <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 800, color: c1 }}>{pct}%</span>
          </div>
          <div style={{ height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`, borderRadius: 999,
              background: `linear-gradient(90deg, ${c1}, ${c2})`,
              boxShadow: `0 0 8px ${c1}55`,
            }} />
          </div>
        </div>

        {isLimitHit ? (
          <motion.button
            type="button"
            onClick={handleJoin}
            whileHover={{ scale: 1.02, background: '#f97316', color: '#000', boxShadow: `0 8px 24px rgba(249, 115, 22, 0.66)` }}
            whileTap={{ scale: 0.98 }}
            style={{
              marginTop: 'auto', width: '100%', padding: '12px 0',
              fontSize: 12,
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 900,
              cursor: 'pointer',
              background: 'rgba(249, 115, 22, 0.05)',
              border: `1.5px solid #f97316`,
              borderRadius: 14,
              color: '#f97316',
              boxShadow: `0 0 16px rgba(249, 115, 22, 0.22)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'color 0.25s, background 0.25s, box-shadow 0.25s',
            }}
          >
            <iconify-icon icon="lucide:clock" width="14" />
            Limit Hit (Resets: {timeLeftToMidnight})
          </motion.button>
        ) : isLocked ? (
          <motion.button
            type="button"
            onClick={handleJoin}
            whileHover={{ scale: 1.02, background: LIME, color: '#000', boxShadow: `0 8px 24px ${LIME}66` }}
            whileTap={{ scale: 0.98 }}
            style={{
              marginTop: 'auto', width: '100%', padding: '12px 0',
              fontSize: 12,
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 900,
              cursor: 'pointer',
              background: 'rgba(204, 255, 0, 0.05)',
              border: `1.5px solid ${LIME}`,
              borderRadius: 14,
              color: LIME,
              boxShadow: `0 0 16px ${LIME}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'color 0.25s, background 0.25s, box-shadow 0.25s',
            }}
          >
            <iconify-icon icon="lucide:lock" width="14" />
            Unlock with Play Pass
          </motion.button>
        ) : (
          <button
            type="button"
            onClick={handleJoin}
            className="arena-btn"
            style={{
              marginTop: 'auto', width: '100%', padding: '12px 0',
              '--btn-color': c1, '--btn-color-2': c2,
              fontSize: 12,
            }}
          >
            <iconify-icon icon="lucide:swords" width="15" />
            Join Tournament
          </button>
        )}
      </div>
    </motion.article>
  );
}

const TournamentsPage = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const searchRef = useRef(null);
  const reduced = useReducedMotion();
  const { tournaments, meta, loading } = useTournaments();

  const { entitlements, refreshEntitlements } = useSubscription();
  const isPremium = entitlements?.tier === 'premium';

  const [lockModal, setLockModal] = useState({ open: false, gameName: '', accent: LIME });

  const unlockedGameId = useMemo(() => {
    if (!tournaments || tournaments.length === 0) return null;
    const day = new Date().getDate();
    const index = day % tournaments.length;
    return tournaments[index]?.id || tournaments[0]?.id;
  }, [tournaments]);

  const unlockedGameName = useMemo(() => {
    const active = tournaments.find(t => t.id === unlockedGameId);
    return active ? active.name : '';
  }, [tournaments, unlockedGameId]);

  const bloomFilters = useMemo(() => buildFilters(
    tournaments.map((t) => ({
      ...t,
      tagLabel: t.tagLabel ?? t.tag_label,
      isLive: t.isLive ?? t.is_live,
      coverImage: t.coverImage ?? t.cover_image,
    }))
  ), [tournaments]);

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
    const tokens = q ? q.split(/\s+/) : [];

    return tournaments.filter((t, idx) => {
      if (category !== 'All' && t.category !== category) return false;
      if (!tokens.length) return true;
      const bf = bloomFilters[idx];
      if (bf && !tokens.every((tok) => bf.mightContain(tok))) return false;
      const hay = `${t.name} ${t.game} ${t.category} ${t.difficulty} ${t.tagLabel ?? t.tag_label}`.toLowerCase();
      return tokens.every((tok) => hay.includes(tok));
    });
  }, [query, category, tournaments, bloomFilters]);

  const liveCount = meta.live_count ?? filtered.filter((t) => t.isLive ?? t.is_live).length;
  const totalPrize = meta.total_prize ?? filtered.reduce((s, t) => s + parseInt((t.prize || '').replace(/[^0-9]/g, ''), 10), 0);

  return (
    <motion.div
      className="arena-shell tournaments-page"
      style={{
        '--arena-bloom-1': 'rgba(204,255,0,0.15)',
        '--arena-bloom-2': 'rgba(189,0,255,0.12)',
        '--arena-bloom-3': 'rgba(0,240,255,0.10)',
        '--arena-orb-1': 'rgba(204,255,0,0.22)',
        '--arena-orb-2': 'rgba(189,0,255,0.18)',
        '--arena-orb-3': 'rgba(0,240,255,0.14)',
        paddingBottom: 80,
      }}
    >
      <div className="arena-bg-layer">
        <motion.div className="arena-mesh" />
        <motion.div className="arena-grid" />
        <motion.div className="arena-orb arena-orb-1" />
        <motion.div className="arena-orb arena-orb-2" />
        <motion.div className="arena-orb arena-orb-3" />
        <motion.div className="arena-noise" />
      </div>

      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        background: 'rgba(6,6,8,0.88)',
      }}>
        <div style={{
          maxWidth: 1320, margin: '0 auto', padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <Link to="/" className="arena-btn-ghost" style={{ textDecoration: 'none', padding: '8px 14px' }}>
            <iconify-icon icon="lucide:arrow-left" width="14" />
            Home
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, overflow: 'hidden',
              display: 'grid', placeItems: 'center',
              background: '#0a0a0c',
            }}>
              <img
                src="https://img.magnific.com/premium-vector/gamer-logo-design-gaming-logo_327429-18.jpg"
                alt="ApexNova"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.04em', color: '#fff' }}>
              Tournaments
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200, maxWidth: 360, position: 'relative' }}>
            <iconify-icon icon="lucide:search" width="14" style={{
              position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
              color: 'rgba(235,235,235,0.4)', pointerEvents: 'none',
            }} />
            <input
              ref={searchRef}
              type="text"
              placeholder='Search games… ("/")'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 999, padding: '10px 14px 10px 36px',
                color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {liveCount > 0 && (
              <div className="arena-pill arena-pill-live">
                <span className="arena-dot" />
                {liveCount} LIVE
              </div>
            )}
            <div className="arena-pill">{filtered.length} GAMES</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '32px 24px 0', position: 'relative', zIndex: 2 }}>
        <motion.div
          className="arena-card-glow"
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{
            '--glow-color': LIME,
            '--glow-color-2': PURPLE,
            borderRadius: 24, overflow: 'hidden', marginBottom: 32,
            background: 'linear-gradient(145deg, rgba(10,10,12,0.95) 0%, rgba(18,18,24,0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: 'clamp(32px, 5vw, 52px) clamp(24px, 4vw, 48px)',
            position: 'relative',
          }}
        >
          <div aria-hidden style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `
              radial-gradient(ellipse 55% 60% at 0% 0%, ${LIME}18, transparent 55%),
              radial-gradient(ellipse 45% 50% at 100% 100%, ${PURPLE}14, transparent 60%)
            `,
          }} />
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 24, alignItems: 'center' }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14,
                padding: '5px 12px', borderRadius: 999,
                background: `${LIME}12`, border: `1px solid ${LIME}35`,
                fontFamily: MONO, fontSize: 9, fontWeight: 800, letterSpacing: '0.16em',
                textTransform: 'uppercase', color: LIME,
              }}>
                <iconify-icon icon="lucide:zap" width="11" />
                {meta.season ?? 'Season 03'} · Live now
              </div>
              <h1 style={{
                margin: 0, fontWeight: 900,
                fontSize: 'clamp(2rem, 4.5vw, 3.6rem)',
                letterSpacing: '-0.05em', lineHeight: 0.98, color: '#fff',
              }}>
                Choose your{' '}
                <span style={{
                  background: `linear-gradient(105deg, ${LIME}, #fff 45%, ${CYAN})`,
                  WebkitBackgroundClip: 'text', backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent', fontStyle: 'italic',
                }}>arena</span>
              </h1>
              <p style={{ marginTop: 12, fontSize: 15, color: 'rgba(235,235,235,0.58)', maxWidth: 480, lineHeight: 1.65 }}>
                Six competitive games in a clean grid — join live brackets or register for upcoming events.
              </p>
              <motion.div style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
                {[
                  { label: 'Prize pool', value: `$${Number(totalPrize).toLocaleString()}`, color: LIME },
                  { label: 'Live now', value: liveCount, color: PINK },
                  { label: 'Games', value: filtered.length, color: CYAN },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.38)' }}>{s.label}</div>
                    <motion.div style={{ fontWeight: 800, fontSize: 17, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</motion.div>
                  </div>
                ))}
              </motion.div>
            </div>
            <div style={{
              width: 100, height: 100, borderRadius: 22, display: 'grid', placeItems: 'center',
              background: `radial-gradient(circle at 30% 30%, ${LIME}25, transparent 70%)`,
              border: `1px solid ${LIME}30`,
              boxShadow: `0 16px 48px -12px ${LIME}35`,
            }}>
              <iconify-icon icon="lucide:gamepad-2" width="48" style={{ color: LIME, filter: `drop-shadow(0 0 16px ${LIME}88)` }} />
            </div>
          </div>
        </motion.div>

        {/* Subscription Tier Notice Banner */}
        {!loading && (
          isPremium ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(204,255,0,0.08), rgba(189,0,255,0.06))',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${LIME}33`,
              borderRadius: 20,
              padding: '20px 24px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              boxShadow: `0 8px 32px 0 ${LIME}11`,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${LIME}18`, border: `1px solid ${LIME}45`,
                display: 'grid', placeItems: 'center', fontSize: 24,
                color: LIME, filter: `drop-shadow(0 0 10px ${LIME}55)`,
              }}>
                🏆
              </div>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', color: LIME, textTransform: 'uppercase', marginBottom: 2 }}>
                  Play Pass Active
                </div>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                  Welcome back! You have <span style={{ color: LIME, fontWeight: 800 }}>unlimited plays</span> across all 6 games and full access to all tournaments.
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 20,
              padding: '20px 24px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'rgba(204,255,0,0.1)', border: '1px solid rgba(204,255,0,0.3)',
                  display: 'grid', placeItems: 'center', fontSize: 24,
                }}>
                  ⚡
                </div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', color: LIME, textTransform: 'uppercase', marginBottom: 2 }}>
                    Free Tier Active
                  </div>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                    Only <span style={{ color: LIME, fontWeight: 800 }}>{unlockedGameName}</span> is unlocked today! Daily plays remaining: <span style={{ color: LIME, fontWeight: 800 }}>{Math.max(0, 3 - (entitlements?.daily_play_count || 0))}/3</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setLockModal({ open: true, gameName: 'All Games', accent: LIME })}
                className="arena-btn"
                style={{
                  padding: '10px 20px', fontSize: 12,
                  '--btn-color': LIME, '--btn-color-2': PURPLE,
                }}
              >
                🏆 Get Play Pass
              </button>
            </div>
          )
        )}

        <div className="tournaments-filters">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`tournaments-filter-chip${category === cat ? ' is-active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="tournaments-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="tournament-skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '72px 24px', color: 'rgba(235,235,235,0.5)' }}>
            <iconify-icon icon="lucide:search-x" width="56" style={{ opacity: 0.35, marginBottom: 12 }} />
            <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 4 }}>No games found</p>
            <p style={{ fontSize: 14 }}>Try another search or category.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div className="tournaments-grid" layout>
              {filtered.map((t, i) => (
                <TournamentCard
                  key={t.id}
                  t={t}
                  index={i}
                  isLocked={!isPremium && t.id !== unlockedGameId}
                  isLimitHit={!isPremium && t.id === unlockedGameId && (entitlements?.daily_play_count >= 3)}
                  onLockClick={() => setLockModal({ open: true, gameName: t.name, accent: cardTheme(t).c1 })}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <PremiumLockModal
        isOpen={lockModal.open}
        onClose={() => setLockModal(prev => ({ ...prev, open: false }))}
        gameName={lockModal.gameName}
        onSuccess={refreshEntitlements}
        accent={lockModal.accent}
      />
      <style>{`
        @keyframes lockRingPulse {
          0% { transform: scale(0.92); opacity: 0.95; }
          50% { transform: scale(1.26); opacity: 0.05; }
          100% { transform: scale(0.92); opacity: 0.95; }
        }
      `}</style>
    </motion.div>
  );
};

export default TournamentsPage;
