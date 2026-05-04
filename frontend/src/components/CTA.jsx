import React from 'react';
import { Reveal } from './Motion';

const CTA = () => (
  <section
    className="section"
    style={{
      background: 'transparent',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        background: 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(204,255,0,0.08) 0%, transparent 65%)',
        pointerEvents: 'none',
      }}
    />

    <div className="container" style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ marginBottom: 56 }}>
        <div className="divider" />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 60,
          alignItems: 'center',
        }}
        className="cta-grid"
      >
        <div>
          <p className="font-mono-tech" style={{ color: 'rgba(204,255,0,0.75)', marginBottom: 16 }}>
            Get started today
          </p>
          <Reveal
            as="h2"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(34px, 4.5vw, 58px)',
              fontWeight: 700,
              letterSpacing: '-0.06em',
              lineHeight: 0.95,
              color: '#ebebeb',
              marginBottom: 20,
            }}
          >
            Ready to claim
            <br />
            <span className="gradient-text" style={{ fontStyle: 'italic' }}>
              your crown?
            </span>
          </Reveal>
          <Reveal
            as="p"
            delay={0.08}
            style={{
              color: 'rgba(235,235,235,0.55)',
              fontSize: 16,
              lineHeight: 1.75,
              maxWidth: 460,
            }}
          >
            Join 200,000+ players already competing on ApexNova.
            Free to start. No credit card required.
          </Reveal>
        </div>

        <Reveal as="div" delay={0.12} style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 220 }}>
          <button type="button" data-cursor="hover" className="btn-primary" style={{
            padding: '16px 36px',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          >
            Start Playing Free
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <button type="button" data-cursor="hover" className="btn-secondary" style={{
            padding: '15px 36px',
            fontSize: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          >
            Watch Demo
          </button>
        </Reveal>
      </div>
    </div>

    <style>{`
      @media (max-width: 860px) {
        .cta-grid {
          grid-template-columns: 1fr !important;
        }
      }
    `}</style>
  </section>
);

export default CTA;
