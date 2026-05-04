import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Reveal } from './Motion';

/* ─── Feature data ──────────────────────────────────────── */
const features = [
  {
    id: 'leaderboards',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="18" y="3" width="4" height="18" rx="1" />
        <rect x="10" y="8" width="4" height="13" rx="1" />
        <rect x="2" y="13" width="4" height="8" rx="1" />
      </svg>
    ),
    tag: 'Live Rankings',
    title: 'Real-time Leaderboards',
    desc: 'Watch rankings shift live as scores come in — no refresh needed, every position update is instant.',
    accent: '#ccff00',
    glow: 'rgba(204,255,0,0.18)',
    featured: true,
  },
  {
    id: 'games',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="3" />
        <path d="M6 12h4M8 10v4" />
        <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" />
        <circle cx="18" cy="13" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
    tag: 'Game Library',
    title: 'Multiple Casual Games',
    desc: 'Snake, Tic Tac Toe, Reaction Test, Memory Match, Number Guessing — a growing arcade at your fingertips.',
    accent: '#10b981',
    glow: 'rgba(16,185,129,0.18)',
    featured: false,
  },
  {
    id: 'scores',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    tag: 'Zero Latency',
    title: 'Instant Score Updates',
    desc: 'Scores propagate the moment they land — no manual refresh, no delay, just live truth.',
    accent: '#a78bfa',
    glow: 'rgba(167,139,250,0.18)',
    featured: false,
  },
  {
    id: 'filters',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
    ),
    tag: 'Discovery',
    title: 'Smart Game Filters',
    desc: 'Sort and explore by popularity, difficulty, or game type to find exactly the match you\'re in the mood for.',
    accent: '#f59e0b',
    glow: 'rgba(245,158,11,0.18)',
    featured: false,
  },
  {
    id: 'tracking',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h20" />
        <path d="M4 20V10l4-4 4 6 4-8 4 6v10" />
      </svg>
    ),
    tag: 'Analytics',
    title: 'Performance Tracking',
    desc: 'Personal stats dashboards show score history and progress curves so you can see exactly how you\'re improving.',
    accent: '#38bdf8',
    glow: 'rgba(56,189,248,0.18)',
    featured: false,
  },
  {
    id: 'global',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
      </svg>
    ),
    tag: 'Worldwide',
    title: 'Global Competition',
    desc: 'Enter ranked arenas against players from every corner of the world and climb the planetary leaderboard.',
    accent: '#fb7185',
    glow: 'rgba(251,113,133,0.18)',
    featured: false,
  },
  {
    id: 'fairplay',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    tag: 'Integrity',
    title: 'Fair Play System',
    desc: 'Server-side validation and anti-cheat telemetry keep every match secure, honest, and worth winning.',
    accent: '#ccff00',
    glow: 'rgba(204,255,0,0.18)',
    featured: false,
  },
  {
    id: 'performance',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    tag: 'Speed',
    title: 'Fast & Responsive',
    desc: 'Optimised rendering and lightweight payloads deliver a silky-smooth, lag-free experience on any device.',
    accent: '#10b981',
    glow: 'rgba(16,185,129,0.18)',
    featured: false,
  },
];

/* ─── Individual feature card ───────────────────────────── */
function FeatureCard({ feature, index }) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      key={feature.id}
      className="feat-card"
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: '1.75rem',
        border: `1px solid ${hovered ? feature.accent + '55' : 'rgba(255,255,255,0.08)'}`,
        background: hovered
          ? `radial-gradient(ellipse 80% 60% at 50% 0%, ${feature.glow}, transparent 70%), rgba(255,255,255,0.04)`
          : 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '28px 26px 26px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        cursor: 'default',
        transition: 'border-color 0.3s ease, background 0.3s ease, transform 0.28s ease, box-shadow 0.28s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? `0 20px 48px ${feature.glow}` : 'none',
        overflow: 'hidden',
      }}
    >
      {/* Subtle corner shimmer */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${feature.accent}44, transparent)`,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Icon bubble */}
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: '1rem',
          background: `rgba(${hexToRgb(feature.accent)}, 0.1)`,
          border: `1px solid rgba(${hexToRgb(feature.accent)}, 0.2)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: feature.accent,
          flexShrink: 0,
          transition: 'background 0.3s ease, box-shadow 0.3s ease',
          boxShadow: hovered ? `0 0 18px rgba(${hexToRgb(feature.accent)}, 0.25)` : 'none',
        }}
      >
        {feature.icon}
      </div>

      {/* Tag */}
      <span
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: feature.accent,
          opacity: 0.85,
        }}
      >
        {feature.tag}
      </span>

      {/* Title */}
      <h3
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: 18,
          letterSpacing: '-0.04em',
          lineHeight: 1.25,
          color: '#ebebeb',
          margin: 0,
        }}
      >
        {feature.title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: 13.5,
          lineHeight: 1.7,
          color: 'rgba(235,235,235,0.52)',
          margin: 0,
          flexGrow: 1,
        }}
      >
        {feature.desc}
      </p>

      {/* Bottom accent line */}
      <div
        style={{
          height: 2,
          borderRadius: 999,
          background: `linear-gradient(90deg, ${feature.accent}, transparent)`,
          opacity: hovered ? 0.7 : 0.2,
          transition: 'opacity 0.3s ease',
          marginTop: 4,
        }}
      />
    </motion.div>
  );
}

/* ─── hex → "r,g,b" helper ─────────────────────────────── */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

/* ─── Main section ──────────────────────────────────────── */
const Features = () => {
  return (
    <section id="features" className="section" style={{ background: 'transparent', position: 'relative' }}>
      {/* Background glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 55% 45% at 50% 55%, rgba(204,255,0,0.045) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Section header ─────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <Reveal as="p" className="font-mono-tech" style={{ color: 'rgba(204,255,0,0.85)', marginBottom: 14, display: 'inline-block' }}>
            Platform Features
          </Reveal>

          <Reveal
            as="h2"
            delay={0.04}
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(32px, 4vw, 52px)',
              fontWeight: 700,
              letterSpacing: '-0.06em',
              lineHeight: 1.05,
              color: '#ebebeb',
              marginBottom: 18,
            }}
          >
            Everything you need to{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #ccff00 0%, #10b981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontStyle: 'italic',
              }}
            >
              compete &amp; win.
            </span>
          </Reveal>

          <Reveal
            as="p"
            delay={0.08}
            style={{
              color: 'rgba(235,235,235,0.52)',
              fontSize: 16,
              lineHeight: 1.8,
              maxWidth: 520,
              margin: '0 auto',
            }}
          >
            Built for serious competitors — every feature keeps matches fair, fast, and worth playing.
          </Reveal>
        </div>

        {/* ── 8-card grid ────────────────────────── */}
        <div className="features-grid">
          {features.map((feature, i) => (
            <FeatureCard key={feature.id} feature={feature} index={i} />
          ))}
        </div>

        {/* ── Bottom badge strip ─────────────────── */}
        <Reveal
          as="div"
          delay={0.1}
          style={{
            marginTop: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 32,
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: '200K+ Players', icon: '👥' },
            { label: '5 Game Modes', icon: '🎮' },
            { label: '99.9% Uptime', icon: '⚡' },
            { label: 'Anti-Cheat Active', icon: '🛡️' },
          ].map(b => (
            <div
              key={b.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(12px)',
                fontSize: 13,
                color: 'rgba(235,235,235,0.7)',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              <span>{b.icon}</span>
              {b.label}
            </div>
          ))}
        </Reveal>
      </div>

      <style>{`
        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
        }
        @media (max-width: 1100px) {
          .features-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 600px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
};

export default Features;
