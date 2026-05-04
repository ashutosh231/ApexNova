import React, { useEffect, useRef, useState } from 'react';
import { Reveal } from './Motion';

const stats = [
  { value: 200000, display: '200K+', label: 'Active Players', icon: '👾', color: '#ccff00' },
  { value: 1400, display: '1,400+', label: 'Tournaments Hosted', icon: '🏆', color: '#10b981' },
  { value: 8000000, display: '8M+', label: 'Matches Played', icon: '🎮', color: '#bef264' },
  { value: 500000, display: '$500K+', label: 'Prize Money Awarded', icon: '💰', color: '#ccff00' },
];

const useCounter = (target, duration = 2000, started = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, target, duration]);
  return count;
};

const StatCard = ({ stat, started }) => {
  const count = useCounter(stat.value, 2200, started);

  const formatCount = (n, display) => {
    if (display.startsWith('$')) {
      if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M+`;
      if (n >= 1000) return `$${(n / 1000).toFixed(0)}K+`;
      return `$${n}`;
    }
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M+`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K+`;
    return `${n.toLocaleString()}+`;
  };

  return (
    <div className="glass card-hover" style={{
      borderRadius: '2rem',
      padding: '32px 28px',
      border: '1px solid rgba(255,255,255,0.1)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 50% 100%, ${stat.color}10, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        fontSize: 32, marginBottom: 16,
        filter: `drop-shadow(0 0 12px ${stat.color}80)`,
      }}>
        {stat.icon}
      </div>

      <div className="stat-number" style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 42, fontWeight: 800,
        color: stat.color,
        textShadow: `0 0 30px ${stat.color}60`,
        marginBottom: 8,
        letterSpacing: '-0.02em',
      }}>
        {started ? formatCount(count, stat.display) : '0'}
      </div>

      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: 500 }}>
        {stat.label}
      </div>

      {/* Bottom border glow */}
      <div style={{
        position: 'absolute', bottom: 0, left: '20%', right: '20%',
        height: 2,
        background: `linear-gradient(90deg, transparent, ${stat.color}80, transparent)`,
        boxShadow: `0 0 10px ${stat.color}`,
      }} />
    </div>
  );
};

const Stats = () => {
  const sectionRef = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting && !started) {
            setStarted(true);
            e.target.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
          }
        });
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [started]);

  return (
    <section
      ref={sectionRef}
      id="leaderboard"
      className="section"
      style={{
        background: 'radial-gradient(ellipse 100% 60% at 50% 50%, rgba(204,255,0,0.06), transparent 70%), transparent',
      }}
    >
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span className="tag tag-lime" style={{ marginBottom: 16, display: 'inline-flex' }}>📊 platform stats</span>
          <Reveal as="h2" style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(32px, 4vw, 48px)',
            fontWeight: 700, letterSpacing: '-0.06em', marginBottom: 16,
          }}>
            Numbers That <span className="gradient-text">Speak</span>
          </Reveal>
          <Reveal as="p" delay={0.08} style={{
            color: 'rgba(255,255,255,0.55)', fontSize: 17,
          }}>
            Trusted by hundreds of thousands of competitive gamers worldwide.
          </Reveal>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
        }}>
          {stats.map((s, i) => (
            <Reveal key={s.label} as="div" delay={i * 0.05}>
              <StatCard stat={s} started={started} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
