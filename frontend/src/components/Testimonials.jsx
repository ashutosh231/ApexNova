import React from 'react';
import { Reveal } from './Motion';

const steps = [
  {
    n: '01',
    title: 'Signal-first onboarding',
    body: 'Players enter through latency-checked queues so every first match is representative of live conditions.',
  },
  {
    n: '02',
    title: 'Bracket integrity',
    body: 'Seeding, rematches, and audit trails are generated as structured events — readable by humans and machines.',
  },
  {
    n: '03',
    title: 'Payout rails',
    body: 'Wins propagate through verified wallets with instant confirmations and dispute windows built in.',
  },
];

const Testimonials = () => (
  <section
    className="section methodology-section"
    style={{
      background: '#e5e5e5',
      color: '#000000',
      borderTopLeftRadius: '4rem',
      borderTopRightRadius: '4rem',
      marginTop: 8,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div className="container">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
          alignItems: 'start',
        }}
        className="methodology-grid"
      >
        <div>
          <p
            className="font-mono-tech"
            style={{
              color: 'rgba(0,0,0,0.45)',
              marginBottom: 16,
            }}
          >
            Methodology
          </p>
          <Reveal
            as="h2"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(30px, 3.5vw, 44px)',
              fontWeight: 700,
              letterSpacing: '-0.06em',
              lineHeight: 1.05,
              marginBottom: 40,
              color: '#000',
            }}
          >
            Precision pipelines,
            <br />
            not promises.
          </Reveal>

          <ol style={{ listStyle: 'none', display: 'grid', gap: 28, padding: 0, margin: 0 }}>
            {steps.map((s, i) => (
              <Reveal as="li" key={s.n} delay={0.06 + i * 0.05} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    border: '1px solid rgba(0,0,0,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    letterSpacing: '0.12em',
                    fontWeight: 700,
                    color: '#000',
                    background: '#fff',
                  }}
                >
                  {s.n}
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 18,
                      letterSpacing: '-0.04em',
                      marginBottom: 8,
                    }}
                  >
                    {s.title}
                  </h3>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(0,0,0,0.62)', maxWidth: 420 }}>
                    {s.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>

        <Reveal as="div" delay={0.1} style={{ position: 'relative', minHeight: 420 }}>
          <div
            style={{
              width: 'min(100%, 380px)',
              aspectRatio: '1',
              borderRadius: '50%',
              marginLeft: 'auto',
              marginRight: 'auto',
              background: 'linear-gradient(145deg, #cfcfcf, #9a9a9a)',
              border: '1px solid rgba(0,0,0,0.08)',
              filter: 'grayscale(1)',
              position: 'relative',
              top: 12,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 0,
              transform: 'translateX(-50%)',
              width: 'min(100%, 340px)',
              padding: 24,
              borderRadius: '2rem',
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.12)',
            }}
          >
            <div className="font-mono-tech" style={{ color: 'rgba(0,0,0,0.45)', marginBottom: 10 }}>
              Field note
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(0,0,0,0.78)', marginBottom: 18 }}>
              “We ship obsidian-grade reliability with lime-bright feedback loops. If it doesn’t feel industrial, it doesn’t ship.”
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#000',
                  color: '#ccff00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 13,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                AN
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>ApexNova Labs</div>
                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', fontFamily: "'JetBrains Mono', monospace" }}>
                  product · competitive
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>

    <style>{`
      @media (max-width: 900px) {
        .methodology-grid { grid-template-columns: 1fr !important; }
      }
    `}</style>
  </section>
);

export default Testimonials;
