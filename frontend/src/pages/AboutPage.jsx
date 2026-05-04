import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/* ─── Constants ───────────────────────────────────────────── */
const LIME = '#ccff00';

const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(255,255,255,0.09)',
};

/* ─── Team members ────────────────────────────────────────── */
const TEAM = [
  {
    name: 'Ashutosh Kumar',
    role: 'Founder & CEO',
    bio: 'Visionary behind ApexNova. Building the future of competitive casual gaming, one tournament at a time.',
    emoji: '🚀',
    accent: 'rgba(204,255,0,0.18)',
    tag: 'Leadership',
  },
  {
    name: 'Priya Sharma',
    role: 'Head of Product',
    bio: 'Transforms player feedback into delightful features. Obsessed with zero-friction competition flows.',
    emoji: '🎯',
    accent: 'rgba(56,189,248,0.15)',
    tag: 'Product',
  },
  {
    name: 'Rohan Mehta',
    role: 'Lead Engineer',
    bio: 'Architect of our real-time score engine and Bloom Filter–accelerated search systems.',
    emoji: '⚙️',
    accent: 'rgba(139,92,246,0.15)',
    tag: 'Engineering',
  },
  {
    name: 'Anika Verma',
    role: 'Design Lead',
    bio: 'Crafts every pixel of the ApexNova experience — from micro-animations to the full design system.',
    emoji: '✨',
    accent: 'rgba(251,113,133,0.15)',
    tag: 'Design',
  },
  {
    name: 'Karan Singh',
    role: 'Community Manager',
    bio: 'Keeps our 50k+ player community thriving. Every tournament you love started with Karan.',
    emoji: '🎮',
    accent: 'rgba(16,185,129,0.15)',
    tag: 'Community',
  },
  {
    name: 'Sneha Patel',
    role: 'Data & Analytics',
    bio: 'Turns raw gameplay data into insights that make every tournament smarter and fairer.',
    emoji: '📊',
    accent: 'rgba(245,158,11,0.15)',
    tag: 'Analytics',
  },
];

/* ─── Platform stats ──────────────────────────────────────── */
const STATS = [
  { label: 'Active Players',   value: '50,000+', icon: '👥' },
  { label: 'Tournaments Run',  value: '2,400+',  icon: '🏆' },
  { label: 'Prize Paid Out',   value: '$180K+',  icon: '💰' },
  { label: 'Games Supported',  value: '10+',     icon: '🕹️' },
];

/* ─── Values ──────────────────────────────────────────────── */
const VALUES = [
  { icon: '⚖️', title: 'Fair Play',       desc: 'Anti-cheat systems and transparent scoring ensure every win is earned.' },
  { icon: '⚡', title: 'Speed First',     desc: 'Sub-100ms score updates. No refreshes. No waiting. Just competition.' },
  { icon: '🌍', title: 'Open to All',     desc: 'Casual games, serious prizes. Anyone can compete and win real rewards.' },
  { icon: '🔒', title: 'Secure & Safe',   desc: 'Encrypted accounts, verified payouts, and zero tolerance for exploitation.' },
];

/* ─── Team Card ───────────────────────────────────────────── */
function TeamCard({ member, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.07 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...glass,
        borderRadius: '1.75rem',
        padding: '28px 24px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        transition: 'border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease',
        borderColor: hovered ? 'rgba(204,255,0,0.3)' : 'rgba(255,255,255,0.09)',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hovered ? '0 20px 50px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.25)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent glow */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: member.accent,
        opacity: hovered ? 0.6 : 0.3,
        transition: 'opacity 0.3s ease',
        borderRadius: '1.75rem',
      }} />

      {/* Avatar */}
      <div style={{
        width: 60, height: 60, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, position: 'relative', zIndex: 1,
      }}>
        {member.emoji}
      </div>

      {/* Tag */}
      <span style={{
        position: 'relative', zIndex: 1,
        display: 'inline-block', width: 'fit-content',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: LIME, padding: '3px 9px', borderRadius: 999,
        background: 'rgba(204,255,0,0.1)', border: '1px solid rgba(204,255,0,0.25)',
      }}>
        {member.tag}
      </span>

      {/* Info */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700, fontSize: 17, color: '#ebebeb', marginBottom: 3,
        }}>
          {member.name}
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11, color: 'rgba(235,235,235,0.45)', letterSpacing: '0.06em',
        }}>
          {member.role}
        </div>
      </div>

      <p style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 13.5, lineHeight: 1.65,
        color: 'rgba(235,235,235,0.55)',
        margin: 0, position: 'relative', zIndex: 1,
      }}>
        {member.bio}
      </p>
    </motion.div>
  );
}

/* ─── Value Card ──────────────────────────────────────────── */
function ValueCard({ v, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
      style={{
        ...glass,
        borderRadius: '1.5rem',
        padding: '22px 20px',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: 'rgba(204,255,0,0.1)',
        border: '1px solid rgba(204,255,0,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>
        {v.icon}
      </div>
      <div>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700, fontSize: 15, color: '#ebebeb', marginBottom: 5,
        }}>
          {v.title}
        </div>
        <p style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13, lineHeight: 1.6, color: 'rgba(235,235,235,0.5)', margin: 0,
        }}>
          {v.desc}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Main About Page ─────────────────────────────────────── */
const AboutPage = () => {
  /* Custom cursor */
  const cursorRef    = useRef(null);
  const followerRef  = useRef(null);
  const spotlightRef = useRef(null);

  useEffect(() => {
    const cursor   = cursorRef.current;
    const follower = followerRef.current;
    const spot     = spotlightRef.current;
    let fx = 0, fy = 0, cx = 0, cy = 0;

    const onMove = e => {
      cx = e.clientX; cy = e.clientY;
      if (cursor) { cursor.style.left = cx + 'px'; cursor.style.top = cy + 'px'; }
      if (spot) spot.style.background =
        `radial-gradient(400px circle at ${cx}px ${cy}px, rgba(204,255,0,0.07), transparent 70%)`;
    };
    const loop = () => {
      fx += (cx - fx) * 0.12; fy += (cy - fy) * 0.12;
      if (follower) { follower.style.left = fx + 'px'; follower.style.top = fy + 'px'; }
      requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', onMove);
    loop();

    const grow   = () => { if (cursor) cursor.style.transform = 'translate(-50%,-50%) scale(2)'; };
    const shrink = () => { if (cursor) cursor.style.transform = 'translate(-50%,-50%) scale(1)'; };
    document.querySelectorAll('a, button, [data-cursor="hover"]').forEach(el => {
      el.addEventListener('mouseenter', grow);
      el.addEventListener('mouseleave', shrink);
    });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#060608', position: 'relative', paddingBottom: 100 }}>

      {/* ── Cursor ── */}
      <div ref={cursorRef} className="cursor" />
      <div ref={followerRef} className="cursor-follower" />
      <div ref={spotlightRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10, transition: 'background 0.1s ease' }} />

      {/* ── Background glows ── */}
      {[
        'radial-gradient(ellipse 65% 50% at 10% 15%, rgba(204,255,0,0.12) 0%, transparent 60%)',
        'radial-gradient(ellipse 55% 45% at 90% 85%, rgba(16,185,129,0.09) 0%, transparent 60%)',
        'radial-gradient(ellipse 50% 40% at 85% 10%, rgba(56,189,248,0.08) 0%, transparent 55%)',
      ].map((bg, i) => (
        <div key={i} aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, background: bg }} />
      ))}
      {/* Grid */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, opacity: 0.15,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* ── Sticky top bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(6,6,8,0.85)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          padding: '14px 28px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <Link to="/" data-cursor="hover" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            textDecoration: 'none',
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600,
            color: 'rgba(235,235,235,0.6)',
            padding: '7px 14px', borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
            transition: 'all 0.2s ease',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Home
          </Link>

          <div style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
            fontSize: 18, letterSpacing: '-0.05em', color: '#ebebeb',
          }}>
            Apex<span style={{ color: LIME }}>Nova</span>
          </div>

          <div style={{ marginLeft: 'auto' }}>
            <span className="tag tag-lime">About Us</span>
          </div>
        </div>
      </div>

      {/* ── Page content ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', position: 'relative', zIndex: 2 }}>

        {/* ═══ Hero section ═══════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', padding: '72px 0 60px' }}
        >
          <span className="tag tag-lime" style={{ marginBottom: 20, display: 'inline-flex' }}>
            🏢 Our Story
          </span>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(2.4rem, 5.5vw, 3.8rem)',
            fontWeight: 800, letterSpacing: '-0.06em', lineHeight: 1.0,
            color: '#ebebeb', marginBottom: 22,
          }}>
            Built for{' '}
            <span style={{
              background: 'linear-gradient(105deg, #ccff00 0%, #fff 60%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              every player
            </span>
            ,<br />loved by champions.
          </h1>
          <p style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 17, lineHeight: 1.75,
            color: 'rgba(235,235,235,0.52)',
            maxWidth: 560, margin: '0 auto',
          }}>
            ApexNova started with a simple belief — casual games deserve serious competition.
            We built a platform where Snake, Tic Tac Toe, and Memory Match become arenas
            for real skill, real prizes, and real glory.
          </p>
        </motion.div>

        {/* ═══ Stats row ══════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 14,
            marginBottom: 80,
          }}
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              style={{
                ...glass,
                borderRadius: '1.5rem',
                padding: '26px 22px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800, fontSize: 26,
                letterSpacing: '-0.04em', color: LIME,
                textShadow: '0 0 20px rgba(204,255,0,0.35)',
                marginBottom: 4,
              }}>
                {s.value}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgba(235,235,235,0.4)',
              }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ═══ Mission statement ══════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{
            ...glass,
            borderRadius: '2rem',
            padding: '48px 44px',
            marginBottom: 80,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div aria-hidden style={{
            position: 'absolute', top: -60, right: -60,
            width: 260, height: 260, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(204,255,0,0.1), transparent 70%)',
            pointerEvents: 'none',
          }} />
          <span className="tag tag-lime" style={{ marginBottom: 18, display: 'inline-flex' }}>
            🎯 Mission
          </span>
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)',
            letterSpacing: '-0.04em', lineHeight: 1.2,
            color: '#ebebeb', marginBottom: 16, maxWidth: 640,
          }}>
            "Democratise competitive gaming — so anyone, anywhere can prove they're the best."
          </h2>
          <p style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 15, lineHeight: 1.75,
            color: 'rgba(235,235,235,0.5)',
            maxWidth: 600, margin: 0,
          }}>
            We're not building a platform for hardcore esports pros. We're building it for the student
            who's unbeatable at Snake, the office champion at Tic Tac Toe, and the memory wizard
            who can clear any board in seconds. ApexNova is their arena.
          </p>
        </motion.div>

        {/* ═══ Values ═════════════════════════════════════════ */}
        <div style={{ marginBottom: 80 }}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            style={{ textAlign: 'center', marginBottom: 40 }}
          >
            <span className="tag tag-lime" style={{ marginBottom: 14, display: 'inline-flex' }}>
              💡 What We Stand For
            </span>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
              letterSpacing: '-0.05em', color: '#ebebeb',
            }}>
              Our Core Values
            </h2>
          </motion.div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 14,
          }}>
            {VALUES.map((v, i) => <ValueCard key={v.title} v={v} index={i} />)}
          </div>
        </div>

        {/* ═══ Team ═══════════════════════════════════════════ */}
        <div style={{ marginBottom: 80 }}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <span className="tag tag-lime" style={{ marginBottom: 14, display: 'inline-flex' }}>
              👥 The People
            </span>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700, fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
              letterSpacing: '-0.05em', color: '#ebebeb', marginBottom: 12,
            }}>
              Meet the Team
            </h2>
            <p style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 15, color: 'rgba(235,235,235,0.45)',
              maxWidth: 460, margin: '0 auto', lineHeight: 1.7,
            }}>
              Small team. Big vision. We obsess over every millisecond of your game experience.
            </p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {TEAM.map((member, i) => (
              <TeamCard key={member.name} member={member} index={i} />
            ))}
          </div>
        </div>

        {/* ═══ CTA ════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{
            ...glass,
            borderRadius: '2rem',
            padding: '52px 40px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Lime glow blob */}
          <div aria-hidden style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 400, height: 200,
            background: 'radial-gradient(ellipse, rgba(204,255,0,0.12), transparent 70%)',
            pointerEvents: 'none',
          }} />

          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 800, fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
            letterSpacing: '-0.05em', color: '#ebebeb',
            marginBottom: 14, position: 'relative', zIndex: 1,
          }}>
            Ready to compete?
          </h2>
          <p style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 15, color: 'rgba(235,235,235,0.5)',
            marginBottom: 28, position: 'relative', zIndex: 1,
          }}>
            Join 50,000+ players already earning real prizes on ApexNova.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            <Link
              to="/tournaments"
              data-cursor="hover"
              className="btn-primary"
              style={{ textDecoration: 'none', padding: '12px 28px', fontSize: 14, display: 'inline-block' }}
            >
              Browse Tournaments →
            </Link>
            <Link
              to="/"
              data-cursor="hover"
              className="btn-secondary"
              style={{ textDecoration: 'none', padding: '12px 28px', fontSize: 14, display: 'inline-block' }}
            >
              Back to Home
            </Link>
          </div>
        </motion.div>

      </div>{/* /content */}
    </div>
  );
};

export default AboutPage;
