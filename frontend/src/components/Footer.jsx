import React from 'react';

const policyLinks = ['Privacy Policy', 'Terms of Service', 'Cookie Policy'];

const Footer = () => (
  <footer
    style={{
      background: '#000000',
      position: 'relative',
      overflow: 'hidden',
      paddingTop: 72,
      paddingBottom: 40,
    }}
  >
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: '50%',
        top: 8,
        transform: 'translateX(-50%)',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: 'clamp(4rem, 14vw, 10rem)',
        letterSpacing: '-0.06em',
        color: 'rgba(255,255,255,0.05)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      SUPER
    </div>

    <div className="container" style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <p className="font-mono-tech" style={{ color: 'rgba(235,235,235,0.4)', marginBottom: 16 }}>
          Ready when you are
        </p>
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(28px, 4vw, 44px)',
            letterSpacing: '-0.06em',
            color: '#ebebeb',
            marginBottom: 28,
          }}
        >
          Claim the next bracket.
        </h2>
        <button type="button" data-cursor="hover" className="btn-cta-mega">
          <span>Start competing →</span>
        </button>
      </div>

      <div className="divider" style={{ margin: '48px 0 32px' }} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 32,
          alignItems: 'start',
        }}
        className="footer-columns"
      >
        <div>
          <div className="font-mono-tech" style={{ color: 'rgba(235,235,235,0.35)', marginBottom: 14 }}>
            Policies
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
            {policyLinks.map(link => (
              <li key={link}>
                <a href="#" className="footer-link">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div className="font-mono-tech" style={{ color: 'rgba(235,235,235,0.35)', marginBottom: 14 }}>
            Social
          </div>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['x', 'in', 'yt'].map(id => (
              <a
                key={id}
                href="#"
                data-cursor="hover"
                aria-label={id}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(235,235,235,0.55)',
                  textDecoration: 'none',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  transition: 'border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1), color 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(204,255,0,0.45)';
                  e.currentTarget.style.color = '#ccff00';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.color = 'rgba(235,235,235,0.55)';
                }}
              >
                {id}
              </a>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'right' }} className="footer-copy-col">
          <div className="font-mono-tech" style={{ color: 'rgba(235,235,235,0.35)', marginBottom: 14 }}>
            System
          </div>
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(235,235,235,0.35)',
              lineHeight: 1.8,
            }}
          >
            © {new Date().getFullYear()} apexnova
            <br />
            build 2046.04 · sf / remote
          </p>
        </div>
      </div>
    </div>

    <style>{`
      @media (max-width: 720px) {
        .footer-columns {
          grid-template-columns: 1fr !important;
          text-align: left !important;
        }
        .footer-columns > div:nth-child(2) {
          text-align: left !important;
        }
        .footer-columns > div:nth-child(2) > div:last-child {
          justify-content: flex-start !important;
        }
        .footer-copy-col { text-align: left !important; }
      }
    `}</style>
  </footer>
);

export default Footer;
