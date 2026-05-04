import React, { useEffect, useMemo, useState } from 'react';
import { Reveal } from './Motion';

const DEFAULT_PARTNERS = [
  { id: '1', name: 'HyperForge', tag: 'HF' },
  { id: '2', name: 'SteelVector', tag: 'SV' },
  { id: '3', name: 'NeonGrid', tag: 'NG' },
  { id: '4', name: 'PulseNine', tag: 'P9' },
  { id: '5', name: 'CircuitBay', tag: 'CB' },
  { id: '6', name: 'VoidStack', tag: 'VS' },
  { id: '7', name: 'ArcRaid', tag: 'AR' },
  { id: '8', name: 'SignalDrop', tag: 'SD' },
];

const PartnerChip = ({ name, tag }) => (
  <div
    className="partner-chip"
    style={{
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 22px',
      borderRadius: '1.25rem',
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      filter: 'grayscale(1)',
      opacity: 0.55,
      transition: 'opacity 0.3s cubic-bezier(0.4,0,0.2,1), border-color 0.3s cubic-bezier(0.4,0,0.2,1), filter 0.35s ease',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.opacity = '1';
      e.currentTarget.style.filter = 'grayscale(0)';
      e.currentTarget.style.borderColor = 'rgba(204,255,0,0.35)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.opacity = '0.55';
      e.currentTarget.style.filter = 'grayscale(1)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
    }}
  >
    <span
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        background: 'rgba(204,255,0,0.12)',
        border: '1px solid rgba(204,255,0,0.22)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.08em',
        color: '#ccff00',
      }}
    >
      {tag}
    </span>
    <span
      style={{
        fontFamily: "'Space Grotesk',sans-serif",
        fontWeight: 700,
        fontSize: 15,
        letterSpacing: '-0.04em',
        color: '#ebebeb',
        whiteSpace: 'nowrap',
      }}
    >
      {name}
    </span>
  </div>
);

const CompanyCarousel = () => {
  const [partners, setPartners] = useState(DEFAULT_PARTNERS);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/data/partners.json', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          setPartners(
            data.map((p, i) => ({
              id: String(p.id ?? i),
              name: p.name,
              tag: p.tag ?? p.name?.slice(0, 2)?.toUpperCase() ?? '??',
            }))
          );
        }
      } catch {
        /* keep defaults — optional static bundle */
      }
    };
    load();
  }, []);

  const loop = useMemo(() => [...partners, ...partners], [partners]);

  return (
    <section
      aria-label="Partner studios"
      className="company-carousel-section"
      style={{
        paddingTop: 8,
        paddingBottom: 28,
        paddingLeft: 0,
        paddingRight: 0,
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <div className="container" style={{ marginBottom: 18, paddingLeft: 'clamp(14px,2.2vw,28px)', paddingRight: 'clamp(14px,2.2vw,28px)' }}>
        <Reveal as="div" style={{ textAlign: 'center' }}>
          <p className="font-mono-tech" style={{ color: 'rgba(235,235,235,0.4)', marginBottom: 8 }}>
            Trusted by squads at
          </p>
        </Reveal>
      </div>

      <div
        className="partner-marquee-mask"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        }}
      >
        <div className="partner-marquee-track">
          {loop.map((p, i) => (
            <PartnerChip key={`${p.id}-${i}`} name={p.name} tag={p.tag} />
          ))}
        </div>
      </div>

      <style>{`
        .partner-marquee-mask {
          width: 100%;
          overflow: hidden;
        }
        .partner-marquee-track {
          display: flex;
          width: max-content;
          gap: 16px;
          padding: 4px 0 8px;
          animation: partner-marquee 48s linear infinite;
        }
        .partner-marquee-mask:hover .partner-marquee-track {
          animation-play-state: paused;
        }
        @keyframes partner-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .partner-marquee-track { animation: none !important; flex-wrap: wrap; justify-content: center; width: 100% !important; max-width: 900px; margin: 0 auto; }
        }
      `}</style>
    </section>
  );
};

export default CompanyCarousel;
