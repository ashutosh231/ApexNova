import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { activatePass } from '../lib/subscription';

const LIME = '#ccff00';
const EMERALD = '#10b981';
const SANS = "'Space Grotesk', sans-serif";
const MONO = "'JetBrains Mono', monospace";

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const Backdrop = ({ onClick, children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'rgba(5, 5, 7, 0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}
    onClick={onClick}
  >
    {children}
  </motion.div>
);

const Toast = ({ show, type, message }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10000,
          padding: '14px 24px',
          borderRadius: 16,
          background: type === 'success' ? 'rgba(10,30,10,0.96)' : 'rgba(30,10,10,0.96)',
          border: `1px solid ${type === 'success' ? `${LIME}40` : 'rgba(248,113,113,0.4)'}`,
          color: type === 'success' ? LIME : '#f87171',
          fontFamily: SANS, fontWeight: 700, fontSize: 14,
          boxShadow: `0 8px 40px -8px ${type === 'success' ? `${LIME}44` : 'rgba(248,113,113,0.3)'}`,
          backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', gap: 10,
          whiteSpace: 'nowrap',
        }}
      >
        {type === 'success' ? '🏆' : '⚠️'} {message}
      </motion.div>
    )}
  </AnimatePresence>
);

export default function PremiumLockModal({ isOpen, onClose, gameName, onSuccess, accent = LIME }) {
  const { token, user } = useAuth();
  const [buying, setBuying] = useState(false);
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });

  const showToast = useCallback((type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 4000);
  }, []);

  const handleBuyPass = useCallback(async () => {
    if (!token) return;
    setBuying(true);

    const loaded = await loadRazorpay();
    if (!loaded) {
      showToast('error', 'Payment gateway failed to load. Please try again.');
      setBuying(false);
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: 9900, // ₹99 in paise
      currency: 'INR',
      name: 'ApexNova',
      description: 'Play Pass — Monthly Subscription',
      image: 'https://img.magnific.com/premium-vector/gamer-logo-design-gaming-logo_327429-18.jpg',
      prefill: {
        name:  user?.name  || '',
        email: user?.email || '',
      },
      theme: { color: LIME },
      modal: {
        ondismiss: () => setBuying(false),
      },
      handler: async (response) => {
        try {
          const result = await activatePass(token);
          if (result.success) {
            showToast('success', '🎉 Play Pass activated! Welcome to unlimited gaming.');
            if (onSuccess) onSuccess();
            setTimeout(() => {
              onClose();
            }, 1500);
          } else if (result.error === 'Play Pass is already active') {
            showToast('success', 'Your Play Pass is already active!');
            if (onSuccess) onSuccess();
            setTimeout(() => {
              onClose();
            }, 1500);
          } else {
            showToast('error', result.error || 'Activation failed. Contact support.');
          }
        } catch {
          showToast('error', 'Could not confirm activation. Please contact support.');
        } finally {
          setBuying(false);
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', () => {
      showToast('error', 'Payment failed. Please try again.');
      setBuying(false);
    });
    rzp.open();
    setBuying(false);
  }, [token, user, showToast, onSuccess, onClose]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <Backdrop onClick={onClose}>
            <motion.div
              initial={{ opacity: 0, scale: 0.90, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.90, y: 24 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 490,
                borderRadius: 28,
                background: 'rgba(8, 8, 11, 0.98)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: `0 0 0 1px rgba(255,255,255,0.03), 0 32px 80px -16px rgba(0,0,0,0.95), 0 0 60px -20px ${LIME}25`,
                overflow: 'hidden',
                padding: '36px 32px 28px',
                fontFamily: SANS,
                position: 'relative',
              }}
            >
              {/* Conic glowing border accent */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${LIME}, ${EMERALD}, ${LIME})`,
                backgroundSize: '200% 100%',
                animation: 'stripeAnim 3s linear infinite',
              }} />

              {/* Close button */}
              <button
                onClick={onClose}
                style={{
                  position: 'absolute', top: 20, right: 20,
                  width: 32, height: 32, borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(235,235,235,0.5)',
                  cursor: 'pointer', display: 'grid', placeItems: 'center',
                  fontSize: 14, transition: 'all 0.2s',
                  zIndex: 2,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(235,235,235,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                aria-label="Close"
              >✕</button>

              {/* Glowing Shield + Lock Icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{
                  width: 68, height: 68, borderRadius: 20,
                  background: `radial-gradient(circle at 30% 30%, ${LIME}22, transparent 75%)`,
                  border: `1.5px solid ${LIME}`,
                  display: 'grid', placeItems: 'center',
                  fontSize: 28, flexShrink: 0,
                  color: LIME,
                  boxShadow: `0 0 28px -4px ${LIME}44, inset 0 0 14px ${LIME}22`,
                  position: 'relative',
                }}>
                  <iconify-icon icon="lucide:shield-alert" width="30" style={{ filter: `drop-shadow(0 0 6px ${LIME})` }} />
                </div>
                <div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 999,
                    background: 'rgba(204,255,0,0.10)',
                    border: `1px solid ${LIME}35`,
                    color: LIME,
                    fontSize: 9, fontWeight: 800,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    fontFamily: MONO,
                    marginBottom: 6,
                  }}>
                    🛡️ PLAY PASS EXCLUSIVE
                  </div>
                  <div style={{ color: '#fff', fontWeight: 900, fontSize: 22, letterSpacing: '-0.04em', lineHeight: 1.15 }}>
                    Unlock <span style={{ color: LIME, textShadow: `0 0 20px ${LIME}44` }}>{gameName}</span>
                  </div>
                </div>
              </div>

              {/* Personalised Description Frosted Card */}
              <p style={{
                margin: '0 0 24px',
                color: 'rgba(235,235,235,0.78)',
                fontSize: 14, lineHeight: 1.65,
                padding: '16px 20px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 16,
              }}>
                Hey <b>{user?.name || 'Challenger'}</b>, <b>{gameName}</b> is currently locked under your Free Tier. Free players get 1 unlocked game daily. Upgrade to <b>Premium Play Pass</b> to instantly unlock all 6 games, live brackets, and cash tournaments.
              </p>

              {/* Premium Perks Grid */}
              <div style={{ marginBottom: 28 }}>
                <div style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.16em',
                  textTransform: 'uppercase', color: 'rgba(235,235,235,0.35)',
                  fontFamily: MONO,
                  marginBottom: 12,
                }}>
                  Premium Play Pass Perks
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { icon: '♾️', text: 'Unlimited play on all 6 games (No caps)' },
                    { icon: '🏆', text: 'Join live Tournaments with cash prize pools' },
                    { icon: '⚔️', text: 'Unlock Competitive Ranked matches' },
                    { icon: '🎖️', text: 'Get an exclusive profile badge' },
                  ].map((perk, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 12,
                        background: 'rgba(255, 255, 255, 0.015)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'all 0.22s ease-in-out',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(204, 255, 0, 0.03)';
                        e.currentTarget.style.borderColor = 'rgba(204, 255, 0, 0.20)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.015)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                      }}
                    >
                      <span style={{
                        width: 26, height: 26, borderRadius: 8,
                        background: `${LIME}12`, border: `1px solid ${LIME}30`,
                        display: 'grid', placeItems: 'center', fontSize: 13, flexShrink: 0,
                        color: LIME,
                      }}>
                        {perk.icon}
                      </span>
                      <span style={{ fontSize: 13.5, color: 'rgba(235,235,235,0.85)', fontWeight: 600 }}>{perk.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pulsing Neon Action Button */}
              <motion.button
                onClick={handleBuyPass}
                disabled={buying}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%', padding: '16px 20px',
                  borderRadius: 16, border: 'none',
                  background: `linear-gradient(135deg, ${LIME}, ${EMERALD})`,
                  color: '#000', fontWeight: 900,
                  fontSize: 15, letterSpacing: '0.02em',
                  cursor: buying ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: `0 8px 30px -8px ${LIME}66`,
                  fontFamily: SANS,
                }}
              >
                {buying ? (
                  <>
                    <span style={{
                      width: 16, height: 16, borderRadius: '50%',
                      border: '2.5px solid rgba(0,0,0,0.3)', borderTopColor: '#000',
                      animation: 'spin 0.7s linear infinite', display: 'inline-block',
                    }} />
                    Opening checkout…
                  </>
                ) : (
                  <>⚡ Unlock Play Pass — ₹99/month</>
                )}
              </motion.button>

              <p style={{
                marginTop: 14, textAlign: 'center',
                fontSize: 11, fontFamily: MONO,
                color: 'rgba(235,235,235,0.28)',
              }}>
                Secured by Razorpay · Cancel anytime
              </p>
            </motion.div>
          </Backdrop>
        )}
      </AnimatePresence>

      <Toast show={toast.show} type={toast.type} message={toast.message} />

      <style>{`
        @keyframes stripeAnim {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
