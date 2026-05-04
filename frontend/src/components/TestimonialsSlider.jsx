import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Reveal } from './Motion';

const DEFAULT_SLIDES = [
  {
    id: '1',
    quote: 'Real-time leaderboard updates feel illegal — I climbed three ranks in one session without refreshing once.',
    name: 'Marcus Chen',
    handle: '@neonblade_gg',
    meta: 'Snake · #1 ranked',
    rating: 5,
  },
  {
    id: '2',
    quote: 'Prize rails hit instantly. Brackets are clean, anti-cheat is visible, and the obsidian UI actually matches the hype.',
    name: 'Aria Sullivan',
    handle: '@pixelqueen',
    meta: 'Memory Match · 3× winner',
    rating: 5,
  },
  {
    id: '3',
    quote: 'Reaction Test here is unfairly addictive. Latency readouts and queue tags make it feel like a pro client, not a browser toy.',
    name: 'Dev Patel',
    handle: '@swiftace_g',
    meta: 'Reaction Test · finalist',
    rating: 5,
  },
  {
    id: '4',
    quote: 'Private rooms, instant invites, zero drama. This is how casual esports should have worked ten years ago.',
    name: 'Luna Park',
    handle: '@gridmaster',
    meta: 'Tic Tac Toe · elite',
    rating: 5,
  },
];

const TestimonialsSlider = () => {
  const reduced = useReducedMotion();
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/data/testimonials.json', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          setSlides(
            data.map((t, i) => ({
              id: String(t.id ?? i),
              quote: t.quote,
              name: t.name,
              handle: t.handle,
              meta: t.meta ?? t.game ?? '',
              rating: typeof t.rating === 'number' ? t.rating : 5,
            }))
          );
          setIndex(0);
        }
      } catch {
        /* defaults */
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const len = slides.length;
  const go = useCallback(
    dir => {
      setIndex(i => {
        const n = i + dir;
        if (n < 0) return len - 1;
        if (n >= len) return 0;
        return n;
      });
    },
    [len]
  );

  useEffect(() => {
    if (reduced || len < 2) return;
    const id = setInterval(() => setIndex(i => (i + 1) % len), 6200);
    return () => clearInterval(id);
  }, [len, reduced]);

  const active = useMemo(() => slides[index] ?? slides[0] ?? null, [slides, index]);
  if (!active) return null;

  return (
    <section
      aria-label="Player testimonials"
      className="testimonials-slider-section"
      style={{
        paddingTop: 72,
        paddingBottom: 88,
        paddingLeft: 0,
        paddingRight: 0,
        width: '100%',
        position: 'relative',
      }}
    >
      <div className="container" style={{ maxWidth: 920, margin: '0 auto', padding: '0 clamp(14px,2.2vw,28px)' }}>
        <Reveal as="div" style={{ textAlign: 'center', marginBottom: 36 }}>
          <p className="font-mono-tech" style={{ color: 'rgba(204,255,0,0.75)', marginBottom: 12 }}>
            Player signal
          </p>
          <h2
            style={{
              fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              letterSpacing: '-0.06em',
              color: '#ebebeb',
            }}
          >
            What competitors{' '}
            <span
              style={{
                background: 'linear-gradient(105deg, #ccff00, #ffffff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              broadcast
            </span>
          </h2>
        </Reveal>

        <div style={{ position: 'relative' }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active.id}
              initial={reduced ? false : { opacity: 0, x: 28 }}
              animate={reduced ? undefined : { opacity: 1, x: 0 }}
              exit={reduced ? undefined : { opacity: 0, x: -22 }}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
              className="glass"
              style={{
                borderRadius: '2.5rem',
                padding: 'clamp(28px, 4vw, 40px)',
                border: '1px solid rgba(255,255,255,0.1)',
                minHeight: 220,
              }}
            >
              <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
                {Array.from({ length: active.rating }).map((_, i) => (
                  <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill="#ccff00" aria-hidden>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <blockquote
                style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontSize: 'clamp(1.05rem, 2vw, 1.2rem)',
                  lineHeight: 1.65,
                  color: 'rgba(235,235,235,0.88)',
                  fontWeight: 400,
                  margin: '0 0 28px',
                  letterSpacing: '-0.02em',
                }}
              >
                “{active.quote}”
              </blockquote>
              <footer style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#ebebeb' }}>{active.name}</div>
                  <div className="font-mono-tech" style={{ color: 'rgba(235,235,235,0.4)', marginTop: 4 }}>
                    {active.handle}
                  </div>
                  <div className="font-mono-tech" style={{ color: 'rgba(204,255,0,0.65)', marginTop: 6 }}>
                    {active.meta}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 48,
                    lineHeight: 1,
                    color: 'rgba(204,255,0,0.12)',
                    fontWeight: 800,
                    userSelect: 'none',
                  }}
                  aria-hidden
                >
                  0{index + 1}
                </div>
              </footer>
            </motion.div>
          </AnimatePresence>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              marginTop: 28,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              data-cursor="hover"
              aria-label="Previous testimonial"
              onClick={() => go(-1)}
              className="glass"
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#ebebeb',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  data-cursor="hover"
                  aria-label={`Go to testimonial ${i + 1}`}
                  aria-current={i === index ? 'true' : undefined}
                  onClick={() => setIndex(i)}
                  style={{
                    width: i === index ? 28 : 9,
                    height: 9,
                    borderRadius: 999,
                    border: 'none',
                    cursor: 'pointer',
                    background: i === index ? '#ccff00' : 'rgba(255,255,255,0.18)',
                    boxShadow: i === index ? '0 0 18px rgba(204,255,0,0.35)' : 'none',
                    transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), background 0.25s ease',
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              data-cursor="hover"
              aria-label="Next testimonial"
              onClick={() => go(1)}
              className="glass"
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#ebebeb',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSlider;
