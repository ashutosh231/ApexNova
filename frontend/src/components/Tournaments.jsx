import React, { useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { gameMedia } from '../data/gameMedia.js';

const LIME = '#ccff00';

/** Fallback if map lookup fails (same host as other tournament art). */
const DEFAULT_TOURNAMENT_COVER =
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=70';

const tournaments = [
  {
    emoji: '🐍',
    name: 'Snake Championship',
    game: 'Snake',
    players: '2,048 / 4,096',
    prize: '$5,000',
    tagLabel: 'LIVE',
    isLive: true,
    gradStart: 'rgba(204,255,0,0.22)',
    gradEnd: 'rgba(204,255,0,0.02)',
    timeLeft: '2h 14m',
    layout: 'featured',
  },
  {
    emoji: '❌',
    name: 'Tic Tac Toe Masters',
    game: 'Tic Tac Toe',
    players: '512 / 512',
    prize: '$2,000',
    tagLabel: 'FINALS',
    isLive: false,
    gradStart: 'rgba(16,185,129,0.18)',
    gradEnd: 'rgba(16,185,129,0.02)',
    timeLeft: '48m',
    layout: 'stack',
  },
  {
    emoji: '⚡',
    name: 'Reaction Speed Cup',
    game: 'Reaction Test',
    players: '1,234 / 2,000',
    prize: '$3,500',
    tagLabel: 'REGISTERING',
    isLive: false,
    gradStart: 'rgba(16,185,129,0.12)',
    gradEnd: 'rgba(190,242,100,0.03)',
    timeLeft: 'Starts in 3h',
    layout: 'stack',
  },
  {
    emoji: '🧠',
    name: 'Memory Grand Prix',
    game: 'Memory Match',
    players: '800 / 1,024',
    prize: '$4,200',
    tagLabel: 'OPEN',
    isLive: false,
    gradStart: 'rgba(204,255,0,0.16)',
    gradEnd: 'rgba(204,255,0,0.02)',
    timeLeft: 'Starts in 1d',
    layout: 'banner',
    coverImage:
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1600&q=75',
  },
];

function fillPct(playersStr) {
  const [a, b] = playersStr.split('/');
  const cur = parseInt(a.replace(/,/g, ''), 10);
  const max = parseInt(b.trim().replace(/,/g, ''), 10);
  if (!max) return 0;
  return Math.min(100, Math.round((cur / max) * 100));
}

const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.1)',
};

const TournamentCard = ({ t, index, coverUrl, reduced }) => {
  const cardRef = useRef(null);
  const pct = fillPct(t.players);
  const src = coverUrl || DEFAULT_TOURNAMENT_COVER;

  const tilt = e => {
    const card = cardRef.current;
    if (!card || reduced) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rx = ((y - cy) / cy) * 5;
    const ry = ((x - cx) / cx) * -5;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
  };

  const tiltEnd = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateY(0)';
  };

  const statusPill = (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 999,
        background: 'rgba(0,0,0,0.55)',
        border: `1px solid ${t.isLive ? 'rgba(204,255,0,0.45)' : 'rgba(255,255,255,0.14)'}`,
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 10,
        letterSpacing: '0.16em',
        fontWeight: 700,
        color: '#ebebeb',
        textTransform: 'uppercase',
      }}
    >
      {t.isLive && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: LIME,
            animation: 'pulse-dot 2s infinite',
          }}
        />
      )}
      {t.tagLabel}
    </div>
  );

  const timePill = (
    <div
      style={{
        position: 'absolute',
        bottom: 14,
        left: 14,
        padding: '6px 11px',
        borderRadius: 999,
        background: 'rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)',
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 10,
        letterSpacing: '0.1em',
        color: 'rgba(235,235,235,0.85)',
      }}
    >
      ⏱ {t.timeLeft}
    </div>
  );

  const MediaPanel = ({ tall, radialAt = '50% 0%', extraClass = '' }) => (
    <div
      className={`tournament-media ${extraClass}`.trim()}
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: tall ? 220 : 160,
        flex: tall ? '1 1 42%' : undefined,
        backgroundColor: '#0a0a0a',
      }}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'saturate(1.08) contrast(1.06)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0.82) 100%), radial-gradient(ellipse 95% 90% at ${radialAt}, ${t.gradStart}, transparent 74%)`,
          pointerEvents: 'none',
        }}
      />
      {statusPill}
      {timePill}
    </div>
  );

  const metaBlock = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
      <div>
        <div className="font-mono-tech" style={{ color: 'rgba(235,235,235,0.45)', marginBottom: 8 }}>
          {t.game}
        </div>
        <h3
          style={{
            fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: 700,
            fontSize: t.layout === 'featured' ? 'clamp(1.35rem, 2.2vw, 1.85rem)' : '1.1rem',
            letterSpacing: '-0.06em',
            lineHeight: 1.1,
            color: '#ebebeb',
          }}
        >
          {t.emoji} {t.name}
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div className="font-mono-tech" style={{ color: 'rgba(235,235,235,0.35)', marginBottom: 6 }}>
            Players
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#ebebeb' }}>{t.players}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="font-mono-tech" style={{ color: 'rgba(235,235,235,0.35)', marginBottom: 6 }}>
            Prize
          </div>
          <div
            style={{
              fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: '-0.03em',
              color: LIME,
              textShadow: '0 0 28px rgba(204,255,0,0.35)',
            }}
          >
            {t.prize}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 14 }}>
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: 999,
              background: `linear-gradient(90deg, ${LIME}, rgba(204,255,0,0.55))`,
              boxShadow: '0 0 16px rgba(204,255,0,0.35)',
            }}
          />
        </div>
        <button type="button" data-cursor="hover" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          Join tournament
        </button>
      </div>
    </div>
  );

  const innerFeatured = (
    <div
      className="tournament-card-inner tournament-card-inner--featured"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 0,
        minHeight: 280,
        height: '100%',
      }}
    >
      <MediaPanel tall radialAt="32% 18%" extraClass="tournament-media--featured" />
      <div style={{ padding: 'clamp(20px, 3vw, 32px)', display: 'flex', flexDirection: 'column' }}>{metaBlock}</div>
    </div>
  );

  const innerStack = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <MediaPanel tall={false} radialAt="50% 8%" extraClass="tournament-media--stack" />
      <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>{metaBlock}</div>
    </div>
  );

  const innerBanner = (
    <div
      className="tournament-card-inner tournament-card-inner--banner"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        minHeight: 240,
        height: '100%',
      }}
    >
      <MediaPanel tall radialAt="22% 48%" extraClass="tournament-media--banner" />
      <div style={{ padding: 'clamp(20px, 3vw, 28px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {metaBlock}
      </div>
    </div>
  );

  let inner = innerStack;
  if (t.layout === 'featured') inner = innerFeatured;
  if (t.layout === 'banner') inner = innerBanner;

  return (
    <motion.article
      ref={cardRef}
      onMouseMove={tilt}
      onMouseLeave={tiltEnd}
      initial={reduced ? false : { opacity: 0, y: 20 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1], delay: index * 0.06 }}
      className={`tournament-card-shell tournament-card-shell--${t.layout}`}
      style={{
        ...glass,
        borderRadius: '2.5rem',
        overflow: 'hidden',
        height: '100%',
        minHeight: t.layout === 'featured' ? 320 : t.layout === 'banner' ? 260 : 420,
        boxShadow: t.isLive ? '0 0 0 1px rgba(204,255,0,0.25), 0 32px 80px rgba(0,0,0,0.55)' : '0 32px 80px rgba(0,0,0,0.45)',
        transition: 'border-color 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(204,255,0,0.4)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
      }}
    >
      {inner}
    </motion.article>
  );
};

const Tournaments = () => {
  const reduced = useReducedMotion();
  const byGame = useMemo(() => new Map(gameMedia.map(m => [m.title.toLowerCase(), m.image])), []);

  return (
    <section
      id="tournaments"
      className="tournaments-bento-section"
      style={{
        paddingTop: 100,
        paddingBottom: 100,
        paddingLeft: 0,
        paddingRight: 0,
        background: 'radial-gradient(ellipse 90% 55% at 50% 0%, rgba(204,255,0,0.07), transparent 55%), transparent',
        width: '100%',
      }}
    >
      <div
        className="tournaments-bento-wrap"
        style={{
          width: '100%',
          maxWidth: '100%',
          margin: 0,
          paddingLeft: 'clamp(14px, 2.2vw, 28px)',
          paddingRight: 'clamp(14px, 2.2vw, 28px)',
          boxSizing: 'border-box',
        }}
      >
        <header style={{ textAlign: 'center', marginBottom: 'clamp(36px, 5vw, 56px)', padding: '0 clamp(8px, 2vw, 16px)' }}>
          <span className="tag tag-lime" style={{ marginBottom: 16, display: 'inline-flex' }}>
            🏆 tournaments
          </span>
          <h2
            style={{
              fontFamily: "'Space Grotesk',sans-serif",
              fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
              fontWeight: 700,
              letterSpacing: '-0.06em',
              lineHeight: 1.05,
              color: '#ebebeb',
            }}
          >
            Active{' '}
            <span
              style={{
                background: 'linear-gradient(105deg, #ccff00 0%, #ffffff 55%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              tournaments
            </span>
          </h2>
          <p
            style={{
              marginTop: 16,
              color: 'rgba(235,235,235,0.55)',
              fontSize: 'clamp(15px, 1.6vw, 17px)',
              maxWidth: 560,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.65,
            }}
          >
            Jump into live competitions or register for upcoming events. Real prizes. Real glory.
          </p>
        </header>

        <div className="tournament-bento-grid">
          {tournaments.map((t, i) => (
            <TournamentCard
              key={t.name}
              t={t}
              index={i}
              coverUrl={t.coverImage ?? byGame.get(t.game.toLowerCase())}
              reduced={reduced}
            />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
          <button type="button" data-cursor="hover" className="btn-secondary" style={{ padding: '14px 28px' }}>
            Browse all tournaments →
          </button>
        </div>
      </div>

      <style>{`
        .tournament-media--stack {
          border-radius: 2rem 2rem 0 0;
        }
        .tournament-card-inner--banner {
          align-items: stretch;
        }
        @media (max-width: 1023px) {
          .tournament-card-inner--featured .tournament-media--featured {
            border-radius: 2.5rem 2.5rem 0 0;
            min-height: 260px;
          }
          .tournament-card-inner--banner .tournament-media--banner {
            border-radius: 2.5rem 2.5rem 0 0;
            min-height: 220px;
          }
        }
        .tournament-bento-grid {
          display: grid;
          width: 100%;
          gap: clamp(14px, 2vw, 20px);
          grid-template-columns: 1fr;
        }
        @media (min-width: 1024px) {
          .tournament-bento-grid {
            grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr);
            grid-template-rows: auto auto;
            align-items: stretch;
          }
          .tournament-card-shell--featured {
            grid-column: 1;
            grid-row: 1;
            min-height: 360px;
          }
          .tournament-card-shell--stack:nth-of-type(2) {
            grid-column: 2;
            grid-row: 1;
          }
          .tournament-card-shell--stack:nth-of-type(3) {
            grid-column: 3;
            grid-row: 1;
          }
          .tournament-card-shell--banner {
            grid-column: 1 / -1;
            grid-row: 2;
            min-height: 280px;
          }
          .tournament-card-inner--featured {
            grid-template-columns: minmax(260px, 1.05fr) minmax(0, 1fr) !important;
            min-height: 360px !important;
          }
          .tournament-card-inner--featured > div:first-child {
            min-height: 100% !important;
            height: 100%;
            align-self: stretch;
            border-radius: 2.5rem 0 0 2.5rem !important;
          }
          .tournament-card-inner--featured > div:last-child {
            border-radius: 0 2.5rem 2.5rem 0;
          }
          .tournament-card-inner--banner {
            grid-template-columns: minmax(280px, 0.95fr) minmax(0, 1.4fr) !important;
            min-height: 280px !important;
            height: 100%;
          }
          .tournament-card-inner--banner > div:first-child {
            min-height: 100% !important;
            height: 100%;
            align-self: stretch;
            min-width: 280px;
            border-radius: 2.5rem 0 0 2.5rem !important;
          }
          .tournament-card-inner--banner > div:last-child {
            border-radius: 0 2.5rem 2.5rem 0;
          }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .tournament-bento-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .tournament-card-shell--featured {
            grid-column: 1 / -1;
          }
          .tournament-card-shell--banner {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </section>
  );
};

export default Tournaments;
