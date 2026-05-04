import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ALL_TOURNAMENTS, buildFilters } from '../data/allTournaments.js';
import { getTournamentConfig, syncSessionFromTournament } from '../data/tournamentConfig.js';

/* ─── Constants ───────────────────────────────────────────── */
const LIME = '#ccff00';
const PAGE_SIZE = 8;

const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(255,255,255,0.1)',
};

const CATEGORIES = ['All', 'Arcade', 'Strategy', 'Reflex', 'Puzzle', 'Word'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const STATUSES = ['All', 'LIVE', 'FINALS', 'REGISTERING', 'OPEN'];

/* ─── Bloom filters (built once at module level) ─────────── */
const BLOOM_FILTERS = buildFilters(ALL_TOURNAMENTS);

/* ─── Helpers ────────────────────────────────────────────── */
function fillPct(str) {
  const [a, b] = str.split('/');
  const cur = parseInt(a.replace(/,/g, ''), 10);
  const max = parseInt(b.trim().replace(/,/g, ''), 10);
  if (!max) return 0;
  return Math.min(100, Math.round((cur / max) * 100));
}

function tagColor(tag) {
  if (tag === 'LIVE') return { bg: 'rgba(204,255,0,0.15)', border: 'rgba(204,255,0,0.45)', text: LIME };
  if (tag === 'FINALS') return { bg: 'rgba(251,113,133,0.15)', border: 'rgba(251,113,133,0.45)', text: '#fb7185' };
  if (tag === 'REGISTERING') return { bg: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.45)', text: '#38bdf8' };
  return { bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.18)', text: 'rgba(235,235,235,0.75)' };
}

/* ─── Tournament Card ────────────────────────────────────── */
function TCard({ t, index }) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const pct = fillPct(t.players);
  const tc = tagColor(t.tagLabel);

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? false : { opacity: 0, y: -14, scale: 0.97 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1], delay: index * 0.045 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...glass,
        borderRadius: '1.75rem',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
        borderColor: hovered ? 'rgba(204,255,0,0.35)' : 'rgba(255,255,255,0.1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 24px 56px rgba(0,0,0,0.55)' : '0 8px 32px rgba(0,0,0,0.35)',
      }}
    >
      {/* Cover image */}
      <div style={{ position: 'relative', height: 160, overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={t.coverImage}
          alt={t.name}
          loading="lazy"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
            filter: 'saturate(1.1) contrast(1.05)',
            transition: 'transform 0.4s ease',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
          }}
        />
        {/* gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, rgba(10,10,10,0.08) 0%, rgba(10,10,10,0.78) 100%),
                       radial-gradient(ellipse 80% 80% at 50% 0%, ${t.gradStart}, transparent 70%)`,
        }} />

        {/* Status pill */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 11px', borderRadius: 999,
          background: tc.bg, border: `1px solid ${tc.border}`,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, letterSpacing: '0.14em', fontWeight: 700,
          color: tc.text, textTransform: 'uppercase',
        }}>
          {t.isLive && (
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: LIME, animation: 'pulse-dot 2s infinite',
            }} />
          )}
          {t.tagLabel}
        </div>

        {/* Time pill */}
        <div style={{
          position: 'absolute', bottom: 10, right: 12,
          padding: '4px 10px', borderRadius: 999,
          background: 'rgba(0,0,0,0.55)',
          border: '1px solid rgba(255,255,255,0.1)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, letterSpacing: '0.08em',
          color: 'rgba(235,235,235,0.8)',
        }}>
          ⏱ {t.timeLeft}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {/* Game + difficulty badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'rgba(235,235,235,0.45)', padding: '3px 8px',
            borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)',
          }}>
            {t.game}
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: t.difficulty === 'Hard' ? '#fb7185' : t.difficulty === 'Easy' ? '#10b981' : '#f59e0b',
            padding: '3px 8px', borderRadius: 999,
            border: `1px solid ${t.difficulty === 'Hard' ? 'rgba(251,113,133,0.3)' : t.difficulty === 'Easy' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
          }}>
            {t.difficulty}
          </span>
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700, fontSize: 17, letterSpacing: '-0.05em',
          lineHeight: 1.2, color: '#ebebeb', margin: 0,
        }}>
          {t.emoji} {t.name}
        </h3>

        {/* Players + Prize */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 2 }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.35)', marginBottom: 4 }}>Players</div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#ebebeb' }}>{t.players}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.35)', marginBottom: 4 }}>Prize Pool</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: '-0.03em', color: LIME, textShadow: '0 0 20px rgba(204,255,0,0.4)' }}>{t.prize}</div>
          </div>
        </div>

        {/* Fill bar */}
        <div style={{ height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`, borderRadius: 999,
            background: `linear-gradient(90deg, ${LIME}, rgba(204,255,0,0.55))`,
            boxShadow: '0 0 10px rgba(204,255,0,0.3)',
            transition: 'width 0.8s ease',
          }} />
        </div>

        {/* CTA */}
        <button
          type="button"
          data-cursor="hover"
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', fontSize: 13, padding: '11px 0' }}
          onClick={(e) => {
            e.stopPropagation();
            syncSessionFromTournament(t.id);
            const cfg = getTournamentConfig(t.id);
            if (cfg.usesMemoryShell) {
              navigate(`/memory-match-room?tournament=${encodeURIComponent(t.id)}`);
              return;
            }
            navigate(`/match-room?tournament=${encodeURIComponent(t.id)}`);
          }}
        >
          Join tournament →
        </button>
      </div>
    </motion.article>
  );
}

/* ─── Filter Chip ─────────────────────────────────────────── */
function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '7px 16px', borderRadius: 999, fontSize: 12, fontWeight: 600,
        fontFamily: "'Space Grotesk', sans-serif",
        cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'all 0.2s ease',
        background: active ? LIME : 'rgba(255,255,255,0.05)',
        border: `1px solid ${active ? LIME : 'rgba(255,255,255,0.12)'}`,
        color: active ? '#000' : 'rgba(235,235,235,0.7)',
        boxShadow: active ? '0 0 16px rgba(204,255,0,0.3)' : 'none',
      }}
    >
      {label}
    </button>
  );
}

/* ─── Pagination ─────────────────────────────────────────── */
function Pagination({ page, total, onChange }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
          color: page === 1 ? 'rgba(255,255,255,0.25)' : '#ebebeb',
          cursor: page === 1 ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
      </button>

      {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          style={{
            width: 38, height: 38, borderRadius: '50%', fontSize: 13,
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.2s ease',
            background: p === page ? LIME : 'rgba(255,255,255,0.05)',
            border: `1px solid ${p === page ? LIME : 'rgba(255,255,255,0.12)'}`,
            color: p === page ? '#000' : 'rgba(235,235,235,0.7)',
            boxShadow: p === page ? '0 0 16px rgba(204,255,0,0.3)' : 'none',
          }}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === pages}
        style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
          color: page === pages ? 'rgba(255,255,255,0.25)' : '#ebebeb',
          cursor: page === pages ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
      </button>
    </div>
  );
}

/* ─── Main Page Component ────────────────────────────────── */
const TournamentsPage = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(1);
  const searchRef = useRef(null);
  const reduced = useReducedMotion();

  /* ── Custom cursor (same as homepage) ── */
  const cursorRef = useRef(null);
  const followerRef = useRef(null);
  const spotlightRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    const spotlight = spotlightRef.current;
    let fx = 0, fy = 0, cx = 0, cy = 0;

    const onMove = e => {
      cx = e.clientX; cy = e.clientY;
      if (cursor) { cursor.style.left = cx + 'px'; cursor.style.top = cy + 'px'; }
      if (spotlight) {
        spotlight.style.background =
          `radial-gradient(400px circle at ${cx}px ${cy}px, rgba(204,255,0,0.07), transparent 70%)`;
      }
    };
    const animate = () => {
      fx += (cx - fx) * 0.12;
      fy += (cy - fy) * 0.12;
      if (follower) { follower.style.left = fx + 'px'; follower.style.top = fy + 'px'; }
      requestAnimationFrame(animate);
    };
    window.addEventListener('mousemove', onMove);
    animate();

    const grow = () => { if (cursor) cursor.style.transform = 'translate(-50%,-50%) scale(2)'; };
    const shrink = () => { if (cursor) cursor.style.transform = 'translate(-50%,-50%) scale(1)'; };
    document.querySelectorAll('a, button, [data-cursor="hover"]').forEach(el => {
      el.addEventListener('mouseenter', grow);
      el.addEventListener('mouseleave', shrink);
    });

    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  /* Focus search on "/" key */
  useEffect(() => {
    const handler = e => {
      if (e.key === '/' && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* Bloom-filter-accelerated search + regular filters */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/) : [];

    return ALL_TOURNAMENTS.filter((t, idx) => {
      /* ── Bloom filter short-circuit ── */
      if (tokens.length > 0) {
        const bf = BLOOM_FILTERS[idx];
        // If ANY token is definitely not in the bloom filter, skip this tournament
        const bloomPass = tokens.every(tok => bf.mightContain(tok));
        if (!bloomPass) return false;

        // Bloom passed (probable match) — do the actual string check
        const haystack = `${t.name} ${t.game} ${t.category} ${t.difficulty} ${t.tagLabel}`.toLowerCase();
        if (!tokens.every(tok => haystack.includes(tok))) return false;
      }

      /* ── Hard filters ── */
      if (category !== 'All' && t.category !== category) return false;
      if (difficulty !== 'All' && t.difficulty !== difficulty) return false;
      if (status !== 'All' && t.tagLabel !== status) return false;

      return true;
    });
  }, [query, category, difficulty, status]);

  /* Reset to page 1 on any filter change */
  const resetPage = useCallback(() => setPage(1), []);
  useEffect(resetPage, [query, category, difficulty, status, resetPage]);

  /* Paginate */
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      background: '#060608',
      paddingBottom: 80,
    }}>

      {/* ── Cursor elements (identical to homepage) ── */}
      <div ref={cursorRef} className="cursor" />
      <div ref={followerRef} className="cursor-follower" />
      <div
        ref={spotlightRef}
        style={{
          position: 'fixed', inset: 0,
          pointerEvents: 'none', zIndex: 10,
          transition: 'background 0.1s ease',
        }}
      />

      {/* ── Rich background layers ── */}
      {/* Layer 1: primary lime bloom top-left */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background:
          'radial-gradient(ellipse 70% 55% at 15% 10%, rgba(204,255,0,0.13) 0%, transparent 60%)',
      }} />
      {/* Layer 2: emerald bloom bottom-right */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background:
          'radial-gradient(ellipse 60% 50% at 85% 90%, rgba(16,185,129,0.11) 0%, transparent 60%)',
      }} />
      {/* Layer 3: violet accent center */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background:
          'radial-gradient(ellipse 55% 40% at 50% 50%, rgba(139,92,246,0.07) 0%, transparent 65%)',
      }} />
      {/* Layer 4: blue sweep top-right */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background:
          'radial-gradient(ellipse 50% 40% at 88% 8%, rgba(56,189,248,0.09) 0%, transparent 55%)',
      }} />
      {/* Layer 5: subtle grid */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
        opacity: 0.18,
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black 0%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black 0%, transparent 75%)',
      }} />
      {/* Layer 6: noise texture */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
        opacity: 0.14,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\")",
        mixBlendMode: 'overlay',
      }} />
      {/* ── Top bar ───────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(6,6,8,0.82)',
      }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: 16,
          flexWrap: 'wrap',
        }}>
          {/* Back home */}
          <Link
            to="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              textDecoration: 'none',
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600,
              color: 'rgba(235,235,235,0.6)',
              padding: '7px 14px', borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              transition: 'all 0.2s ease',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Home
          </Link>

          {/* Logo */}
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18,
            letterSpacing: '-0.05em', color: '#ebebeb',
          }}>
            Apex<span style={{ color: LIME }}>Nova</span>
          </div>

          {/* Search */}
          <div style={{
            flex: 1, minWidth: 220, position: 'relative',
            maxWidth: 420,
          }}>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(235,235,235,0.35)', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder='Search tournaments… (press "/" to focus)'
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 999, padding: '9px 14px 9px 36px',
                color: '#ebebeb', fontSize: 13,
                fontFamily: "'Space Grotesk', sans-serif",
                outline: 'none', transition: 'border-color 0.2s ease',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(204,255,0,0.45)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{
                  position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(235,235,235,0.45)', padding: 2,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {/* Count badge */}
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            color: 'rgba(204,255,0,0.75)', marginLeft: 'auto',
            padding: '5px 12px', borderRadius: 999,
            border: '1px solid rgba(204,255,0,0.2)',
            background: 'rgba(204,255,0,0.07)',
            whiteSpace: 'nowrap',
          }}>
            {filtered.length} / {ALL_TOURNAMENTS.length} tournaments
          </div>
        </div>
      </div>

      {/* ── Page content ───────────────────────────── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 24px 0', position: 'relative', zIndex: 2 }}>

        {/* Header */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: 44 }}
        >
          <span className="tag tag-lime" style={{ marginBottom: 14, display: 'inline-flex' }}>
            🏆 all tournaments
          </span>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
            fontWeight: 700, letterSpacing: '-0.06em', lineHeight: 1.05,
            color: '#ebebeb', marginBottom: 14,
          }}>
            Browse{' '}
            <span style={{
              background: 'linear-gradient(105deg, #ccff00 0%, #fff 55%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Active Tournaments
            </span>
          </h1>
          <p style={{ color: 'rgba(235,235,235,0.5)', fontSize: 16, lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>
            Jump in, register, or spectate — real prizes, real competition, all in one place.
          </p>
        </motion.div>

        {/* ── Filter bar ─────────────────────────── */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          style={{
            ...glass, borderRadius: '1.5rem',
            padding: '18px 22px', marginBottom: 32,
            display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center',
          }}
        >
          {/* Category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.35)' }}>Category</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => (
                <Chip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
              ))}
            </div>
          </div>

          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch', margin: '0 4px' }} />

          {/* Difficulty */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.35)' }}>Difficulty</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DIFFICULTIES.map(d => (
                <Chip key={d} label={d} active={difficulty === d} onClick={() => setDifficulty(d)} />
              ))}
            </div>
          </div>

          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch', margin: '0 4px' }} />

          {/* Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.35)' }}>Status</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STATUSES.map(s => (
                <Chip key={s} label={s} active={status === s} onClick={() => setStatus(s)} />
              ))}
            </div>
          </div>

          {/* Clear all */}
          {(category !== 'All' || difficulty !== 'All' || status !== 'All' || query) && (
            <button
              type="button"
              onClick={() => { setCategory('All'); setDifficulty('All'); setStatus('All'); setQuery(''); }}
              style={{
                marginLeft: 'auto',
                padding: '7px 14px', borderRadius: 999, fontSize: 11,
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                cursor: 'pointer', border: '1px solid rgba(251,113,133,0.3)',
                background: 'rgba(251,113,133,0.08)', color: '#fb7185',
                transition: 'all 0.2s ease',
              }}
            >
              ✕ Clear filters
            </button>
          )}
        </motion.div>

        {/* ── Card Grid ─────────────────────────── */}
        {paginated.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}
            style={{ textAlign: 'center', padding: '80px 24px', color: 'rgba(235,235,235,0.4)' }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              No tournaments found
            </p>
            <p style={{ fontSize: 14 }}>Try adjusting your search or filters.</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 18,
                marginBottom: 40,
              }}
            >
              {paginated.map((t, i) => (
                <TCard key={t.id} t={t} index={i} />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* ── Pagination ─────────────────────────── */}
        {filtered.length > PAGE_SIZE && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, delay: 0.1 }}
          >
            <Pagination page={page} total={filtered.length} onChange={setPage} />
            <p style={{
              textAlign: 'center', marginTop: 14,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'rgba(235,235,235,0.3)',
            }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TournamentsPage;
