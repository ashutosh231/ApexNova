import React, { useMemo } from 'react';

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ParticleField = () => {
  const particles = useMemo(() => {
    const rand = mulberry32(0xA11CE5)
    const colors = ['#ccff00', '#10b981', '#bef264']
    return Array.from({ length: 20 }, (_, i) => {
      const left = rand() * 100
      const size = rand() * 4 + 2
      const duration = rand() * 15 + 10
      const delay = rand() * 10
      const opacity = rand() * 0.4 + 0.1
      const color = colors[Math.floor(rand() * colors.length)]
      return {
        id: i,
        left: `${left}%`,
        size: `${size}px`,
        duration: `${duration}s`,
        delay: `${delay}s`,
        opacity,
        color,
      }
    })
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            bottom: '-20px',
            width: p.size,
            height: p.size,
            background: p.color,
            opacity: p.opacity,
            animationDuration: p.duration,
            animationDelay: p.delay,
            boxShadow: `0 0 ${parseInt(p.size) * 3}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
};

export default ParticleField;
