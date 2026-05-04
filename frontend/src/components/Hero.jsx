import React, { useEffect, useRef } from 'react';
import ParticleField from './ParticleField';
import { Reveal } from './Motion';

const leaderboardData = [
  { rank: 1, name: 'NeonBlade', score: '98,240', game: 'Snake', initials: 'NB', bg: '#14532d', change: '+2', pos: true },
  { rank: 2, name: 'PixelKing', score: '94,120', game: 'Memory Match', initials: 'PK', bg: '#0f172a', change: '+1', pos: true },
  { rank: 3, name: 'SwiftAce', score: '91,780', game: 'Reaction Test', initials: 'SA', bg: '#134e4a', change: '-1', pos: false },
  { rank: 4, name: 'GridMaster', score: '88,430', game: 'Tic Tac Toe', initials: 'GM', bg: '#422006', change: '+3', pos: true },
];

const rankMedal = rank => {
  if (rank === 1) return { bg: '#ccff00', color: '#000' };
  if (rank === 2) return { bg: 'rgba(255,255,255,0.12)', color: '#ebebeb' };
  if (rank === 3) return { bg: 'rgba(204,255,0,0.2)', color: '#ccff00' };
  return { bg: 'rgba(255,255,255,0.08)', color: 'rgba(235,235,235,0.5)' };
};

const Hero = () => {
  const gridRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = e => {
      if (!gridRef.current) return;
      const xPct = (e.clientX / window.innerWidth - 0.5) * 15;
      const yPct = (e.clientY / window.innerHeight - 0.5) * 15;
      gridRef.current.style.transform = `translate(${xPct * 0.35}px, ${yPct * 0.35}px)`;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        paddingTop: 120,
        paddingBottom: 48,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background:
            'radial-gradient(ellipse 70% 55% at 50% -5%, rgba(204,255,0,0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      <div
        ref={gridRef}
        className="hero-grid"
        style={{
          position: 'absolute',
          inset: '-12%',
          zIndex: 0,
          transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      <ParticleField />

      <div className="container" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <div className="hero-grid-layout">
          <div style={{ gridColumn: 'span 12 / span 12' }} className="hero-left-col">
            <Reveal
              as="div"
              className="font-mono-tech"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 14px',
                marginBottom: 28,
                borderRadius: 9999,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
                color: 'rgba(235,235,235,0.55)',
              }}
            >
              <span style={{ color: '#ccff00' }}>AI</span>
              · live matchmaking v2.4
            </Reveal>

            <Reveal
              as="h1"
              delay={0.05}
              className="heading-xl"
              style={{
                fontWeight: 700,
                color: '#ebebeb',
                marginBottom: 28,
              }}
            >
              Compete.
              <br />
              <span
                style={{
                  fontStyle: 'italic',
                  background: 'linear-gradient(105deg, #ccff00 0%, #ffffff 55%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Dominate.
              </span>
              <br />
              Rise to Legend.
            </Reveal>

            <Reveal
              as="p"
              delay={0.1}
              style={{
                fontSize: 17,
                color: 'rgba(235,235,235,0.6)',
                lineHeight: 1.75,
                marginBottom: 36,
                maxWidth: 520,
                fontWeight: 400,
              }}
            >
              The ultimate competitive gaming platform. Snake, Tic Tac Toe, Reaction Test, Memory Match
              and Number Guessing — with real prizes and real rankings.
            </Reveal>

            <Reveal as="div" delay={0.14} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 52 }}>
              <button type="button" data-cursor="hover" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                Start Playing
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button type="button" data-cursor="hover" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                View Leaderboard
              </button>
            </Reveal>

            <Reveal as="div" delay={0.18} style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex' }}>
                {['#14532d', '#0f172a', '#134e4a', '#422006'].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: c,
                      border: '2px solid #0c0c0c',
                      marginLeft: i ? -8 : 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#ebebeb',
                    }}
                  >
                    {['M', 'A', 'D', 'L'][i]}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>200,000+ players</div>
                <div style={{ fontSize: 12, color: 'rgba(235,235,235,0.35)', marginTop: 1 }}>already competing</div>
              </div>
              <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#ccff00">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
                <span style={{ fontSize: 13, color: 'rgba(235,235,235,0.45)', marginLeft: 6 }}>4.9/5.0</span>
              </div>
            </Reveal>
          </div>

          <Reveal as="div" delay={0.12} style={{ gridColumn: 'span 12 / span 12', position: 'relative' }} className="hero-right-col">
            <div
              style={{
                position: 'absolute',
                top: '45%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 380,
                height: 380,
                background: 'radial-gradient(circle, rgba(204,255,0,0.14), transparent 68%)',
                filter: 'blur(120px)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            <div
              style={{
                position: 'relative',
                zIndex: 1,
                borderRadius: '2.5rem',
                padding: 28,
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 18,
                  right: 22,
                  padding: '6px 12px',
                  borderRadius: 10,
                  background: '#ccff00',
                  color: '#000',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  boxShadow: '0 8px 30px rgba(204,255,0,0.25)',
                }}
              >
                AI Cursor
              </div>

              <div
                className="glass-card float-anim"
                style={{
                  position: 'absolute',
                  top: -18,
                  left: 24,
                  width: 160,
                  padding: 14,
                  zIndex: 2,
                }}
              >
                <div className="font-mono-tech" style={{ color: 'rgba(235,235,235,0.45)', marginBottom: 8 }}>
                  latency
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: '#ccff00' }}>
                  12ms
                </div>
              </div>

              <div
                className="glass-card float-anim-delay"
                style={{
                  position: 'absolute',
                  bottom: 32,
                  right: 12,
                  width: 148,
                  padding: 14,
                  zIndex: 2,
                }}
              >
                <div className="font-mono-tech" style={{ color: 'rgba(235,235,235,0.45)', marginBottom: 8 }}>
                  queue
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: '#ebebeb' }}>
                  instant
                </div>
              </div>

              <div style={{ marginTop: 36 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <div
                      className="font-mono-tech"
                      style={{ color: 'rgba(235,235,235,0.35)', marginBottom: 6 }}
                    >
                      Global Rankings
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 17, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.04em' }}>
                      Live Leaderboard
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 12px',
                      background: 'rgba(204,255,0,0.08)',
                      border: '1px solid rgba(204,255,0,0.25)',
                      borderRadius: 9999,
                      fontSize: 11,
                      color: '#ccff00',
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#ccff00',
                        animation: 'pulse-dot 2s infinite',
                      }}
                    />
                    Live
                  </div>
                </div>

                {leaderboardData.map((player, idx) => {
                  const medal = rankMedal(player.rank);
                  return (
                    <div
                      key={player.rank}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '11px 14px',
                        borderRadius: '1.25rem',
                        marginBottom: 8,
                        background: idx === 0 ? 'rgba(204,255,0,0.06)' : 'transparent',
                        border: '1px solid',
                        borderColor: idx === 0 ? 'rgba(204,255,0,0.22)' : 'rgba(255,255,255,0.06)',
                        transition: 'background 0.2s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = idx === 0 ? 'rgba(204,255,0,0.06)' : 'transparent';
                      }}
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          background: medal.bg,
                          color: medal.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {player.rank}
                      </div>

                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: player.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#ebebeb',
                          flexShrink: 0,
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        {player.initials}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {player.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(235,235,235,0.35)', marginTop: 1, fontFamily: "'JetBrains Mono', monospace" }}>
                          {player.game}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>
                          {player.score}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            marginTop: 1,
                            color: player.pos ? '#10b981' : '#f87171',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {player.change}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  data-cursor="hover"
                  style={{
                    width: '100%',
                    marginTop: 12,
                    padding: '12px',
                    borderRadius: '1rem',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(235,235,235,0.45)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(204,255,0,0.35)';
                    e.currentTarget.style.color = '#ebebeb';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = 'rgba(235,235,235,0.45)';
                  }}
                >
                  View full leaderboard →
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <style>{`
        @media (min-width: 1025px) {
          .hero-left-col { grid-column: span 7 / span 7 !important; }
          .hero-right-col { grid-column: span 5 / span 5 !important; }
        }
      `}</style>
    </section>
  );
};

export default Hero;
