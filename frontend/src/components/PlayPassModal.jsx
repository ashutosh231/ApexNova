import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Icon map for each denial reason ─────────────────────── */
const REASON_META = {
  trial_used:       { icon: '🎮', badge: 'Trial Used',        badgeColor: '#f59e0b' },
  daily_cap_hit:    { icon: '⏱️', badge: 'Daily Limit',       badgeColor: '#f97316' },
  premium_required: { icon: '🏆', badge: 'Premium Required',  badgeColor: '#a78bfa' },
  locked_mode:      { icon: '🔒', badge: 'Mode Locked',       badgeColor: '#ec4899' },
  default:          { icon: '⚡', badge: 'Upgrade Required',  badgeColor: '#ccff00' },
};

const PERKS = [
  { icon: '♾️',  text: 'Unlimited plays every day — all 6 games' },
  { icon: '🏆',  text: 'Full tournament mode with real prize pools' },
  { icon: '⚔️',  text: 'Ranked & competitive modes' },
  { icon: '⚡',  text: 'Priority matchmaking' },
  { icon: '🎖️', text: 'Exclusive Play Pass badge on your profile' },
  { icon: '🚀',  text: 'Early access to new games & features' },
];

/* ── Backdrop ─────────────────────────────────────────────── */
const Backdrop = ({ onClick, children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClick}
    style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'rgba(6, 6, 8, 0.82)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}
  >
    {children}
  </motion.div>
);

const Confetti = ({ accent }) => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 28 }}>
    {Array.from({ length: 14 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
        animate={{
          opacity: [0, 1, 0],
          y: [-20, -120 - Math.random() * 80],
          x: [(Math.random() - 0.5) * 200],
          scale: [0, 1, 0.5],
          rotate: [0, 360],
        }}
        transition={{ duration: 1.6 + Math.random() * 0.8, delay: i * 0.06, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          bottom: '20%',
          left: `${20 + Math.random() * 60}%`,
          width: 8 + Math.random() * 8,
          height: 8 + Math.random() * 8,
          borderRadius: Math.random() > 0.5 ? '50%' : 3,
          background: [accent, '#ffffff', '#a78bfa', '#f59e0b', '#34d399'][i % 5],
        }}
      />
    ))}
  </div>
);

/**
 * PlayPassModal
 *
 * Props:
 *  - isOpen         boolean
 *  - onClose        () => void
 *  - reason         string  — denial reason from backend
 *  - message        string  — personalised message from backend
 *  - onActivate     async () => { success, message, perks, expires_at } | { error }
 *  - accent         string  — game accent color (passed from GameLobbyPage)
 */
export default function PlayPassModal({ isOpen, onClose, reason, message, onActivate, accent = '#ccff00' }) {
  const [phase, setPhase] = useState('deny'); // 'deny' | 'activating' | 'success'
  const [successData, setSuccessData] = useState(null);
  const [activateErr, setActivateErr] = useState('');

  const meta = REASON_META[reason] || REASON_META.default;

  const handleActivate = useCallback(async () => {
    setPhase('activating');
    setActivateErr('');
    const result = await onActivate();
    if (result?.success) {
      setSuccessData(result);
      setPhase('success');
    } else {
      setActivateErr(result?.error || 'Something went wrong. Please try again.');
      setPhase('deny');
    }
  }, [onActivate]);

  const handleClose = useCallback(() => {
    // Reset for next open
    setTimeout(() => { setPhase('deny'); setSuccessData(null); setActivateErr(''); }, 400);
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Backdrop onClick={handleClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.90, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.90, y: 24 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480,
              borderRadius: 28,
              background: 'rgba(10,10,14,0.97)',
              border: `1px solid ${accent}33`,
              boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 32px 80px -16px rgba(0,0,0,0.95), 0 0 60px -20px ${accent}33`,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Top accent stripe */}
            <div style={{
              height: 3,
              background: `linear-gradient(90deg, ${accent}, #a78bfa, ${accent})`,
              backgroundSize: '200% 100%',
              animation: 'playPassStripe 2.5s ease infinite',
            }} />

            <AnimatePresence mode="wait">

              {/* ── DENY / UPGRADE state ─────────────────────────── */}
              {(phase === 'deny' || phase === 'activating') && (
                <motion.div
                  key="deny"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ padding: '32px 32px 28px' }}
                >
                  {/* Close button */}
                  <button
                    onClick={handleClose}
                    style={{
                      position: 'absolute', top: 16, right: 16,
                      width: 32, height: 32, borderRadius: 10,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'rgba(235,235,235,0.5)',
                      cursor: 'pointer', display: 'grid', placeItems: 'center',
                      fontSize: 16, transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(235,235,235,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    aria-label="Close"
                  >✕</button>

                  {/* Icon + badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                    <div style={{
                      width: 60, height: 60, borderRadius: 18,
                      background: `${meta.badgeColor}15`,
                      border: `1px solid ${meta.badgeColor}40`,
                      display: 'grid', placeItems: 'center',
                      fontSize: 28, flexShrink: 0,
                    }}>
                      {meta.icon}
                    </div>
                    <div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 10px', borderRadius: 999,
                        background: `${meta.badgeColor}18`,
                        border: `1px solid ${meta.badgeColor}45`,
                        color: meta.badgeColor,
                        fontSize: 10, fontWeight: 800,
                        letterSpacing: '0.14em', textTransform: 'uppercase',
                        fontFamily: "'JetBrains Mono', monospace",
                        marginBottom: 6,
                      }}>
                        {meta.badge}
                      </div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                        Unlock <span style={{ color: accent }}>Play Pass</span>
                      </div>
                    </div>
                  </div>

                  {/* Personalised message from backend */}
                  {message && (
                    <p style={{
                      margin: '0 0 22px',
                      color: 'rgba(235,235,235,0.75)',
                      fontSize: 14, lineHeight: 1.65,
                      padding: '14px 16px',
                      background: 'rgba(255,255,255,0.035)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 14,
                    }}>
                      {message}
                    </p>
                  )}

                  {/* Perks list */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
                      textTransform: 'uppercase', color: 'rgba(235,235,235,0.35)',
                      fontFamily: "'JetBrains Mono', monospace",
                      marginBottom: 10,
                    }}>
                      What you'll unlock
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {PERKS.map((perk, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 + i * 0.06 }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            fontSize: 13, color: 'rgba(235,235,235,0.80)',
                          }}
                        >
                          <span style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: `${accent}12`, border: `1px solid ${accent}30`,
                            display: 'grid', placeItems: 'center', fontSize: 14, flexShrink: 0,
                          }}>
                            {perk.icon}
                          </span>
                          {perk.text}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {activateErr && (
                    <div style={{
                      marginBottom: 14, padding: '10px 14px', borderRadius: 12,
                      background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.30)',
                      color: '#f87171', fontSize: 13,
                    }}>
                      {activateErr}
                    </div>
                  )}

                  {/* CTA */}
                  <motion.button
                    onClick={handleActivate}
                    disabled={phase === 'activating'}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%', padding: '15px 20px',
                      borderRadius: 16, border: 'none',
                      background: `linear-gradient(135deg, ${accent}, #a78bfa)`,
                      color: '#000', fontWeight: 900,
                      fontSize: 15, letterSpacing: '-0.01em',
                      cursor: phase === 'activating' ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      boxShadow: `0 8px 30px -8px ${accent}66`,
                      transition: 'opacity 0.2s',
                      opacity: phase === 'activating' ? 0.7 : 1,
                    }}
                  >
                    {phase === 'activating' ? (
                      <>
                        <span style={{
                          width: 16, height: 16, borderRadius: '50%',
                          border: '2.5px solid rgba(0,0,0,0.3)',
                          borderTopColor: '#000',
                          animation: 'playPassSpin 0.7s linear infinite',
                          display: 'inline-block',
                        }} />
                        Activating…
                      </>
                    ) : (
                      <>⚡ Activate Play Pass — Free Trial</>
                    )}
                  </motion.button>

                  <p style={{
                    margin: '12px 0 0', textAlign: 'center',
                    fontSize: 11, color: 'rgba(235,235,235,0.30)',
                  }}>
                    Demo mode · No payment required
                  </p>
                </motion.div>
              )}

              {/* ── SUCCESS state ────────────────────────────────── */}
              {phase === 'success' && successData && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ padding: '40px 32px 32px', textAlign: 'center', position: 'relative' }}
                >
                  <Confetti accent={accent} />

                  <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1 }}>🏆</div>

                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 14px', borderRadius: 999,
                    background: `${accent}18`, border: `1px solid ${accent}45`,
                    color: accent,
                    fontSize: 10, fontWeight: 800,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    fontFamily: "'JetBrains Mono', monospace",
                    marginBottom: 14,
                  }}>
                    Play Pass Active
                  </div>

                  <h2 style={{
                    margin: '0 0 14px',
                    color: '#fff', fontWeight: 900, fontSize: 22, letterSpacing: '-0.03em',
                  }}>
                    You're in, <span style={{ color: accent }}>Legend!</span>
                  </h2>

                  <p style={{
                    margin: '0 0 24px',
                    color: 'rgba(235,235,235,0.70)',
                    fontSize: 14, lineHeight: 1.65,
                  }}>
                    {successData.message}
                  </p>

                  {/* Unlocked perks */}
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16, padding: '16px 18px',
                    textAlign: 'left', marginBottom: 24,
                  }}>
                    {(successData.perks || PERKS.map(p => p.text)).map((perk, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.07 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          fontSize: 13, color: 'rgba(235,235,235,0.80)',
                          marginBottom: i < (successData.perks?.length || PERKS.length) - 1 ? 10 : 0,
                        }}
                      >
                        <span style={{ color: accent, fontSize: 16, flexShrink: 0 }}>✓</span>
                        {perk}
                      </motion.div>
                    ))}
                  </div>

                  {successData.expires_at && (
                    <p style={{ margin: '0 0 20px', fontSize: 11, color: 'rgba(235,235,235,0.35)' }}>
                      Expires {new Date(successData.expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}

                  <motion.button
                    onClick={handleClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%', padding: '14px 20px',
                      borderRadius: 16, border: 'none',
                      background: `linear-gradient(135deg, ${accent}, #a78bfa)`,
                      color: '#000', fontWeight: 900,
                      fontSize: 15, cursor: 'pointer',
                      boxShadow: `0 8px 30px -8px ${accent}66`,
                    }}
                  >
                    🎮 Start Playing
                  </motion.button>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Keyframes injected once */}
            <style>{`
              @keyframes playPassStripe {
                0%   { background-position: 0% 0%; }
                50%  { background-position: 100% 0%; }
                100% { background-position: 0% 0%; }
              }
              @keyframes playPassSpin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </motion.div>
        </Backdrop>
      )}
    </AnimatePresence>
  );
}
