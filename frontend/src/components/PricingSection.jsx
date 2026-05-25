import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { activatePass } from '../lib/subscription';

const LIME = '#ccff00';
const PURPLE = '#a78bfa';
const MONO = "'JetBrains Mono', monospace";
const SANS = "'Space Grotesk', sans-serif";

const FREE_PERKS = [
  { icon: '🎮', text: '1 free trial play on any game', included: true },
  { icon: '⏱️', text: '3 plays per day (after trial)',  included: true },
  { icon: '🏆', text: 'Tournament mode',                included: false },
  { icon: '⚔️', text: 'Ranked & competitive modes',     included: false },
  { icon: '⚡', text: 'Priority matchmaking',            included: false },
  { icon: '🎖️', text: 'Play Pass profile badge',        included: false },
];

const PASS_PERKS = [
  { icon: '♾️',  text: 'Unlimited plays — all 6 games',    included: true },
  { icon: '🏆', text: 'Full tournament mode + real prizes', included: true },
  { icon: '⚔️', text: 'Ranked & competitive modes',         included: true },
  { icon: '⚡', text: 'Priority matchmaking',                included: true },
  { icon: '🎖️', text: 'Exclusive Play Pass badge',          included: true },
  { icon: '🚀', text: 'Early access to new games',          included: true },
];

/* ── Load Razorpay script once ────────────────────────── */
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

/* ── Shimmer badge ────────────────────────────────────── */
const ShimmerBadge = ({ children, color = LIME }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 14px', borderRadius: 999,
    background: `${color}18`, border: `1px solid ${color}45`,
    color, fontSize: 10, fontWeight: 800,
    letterSpacing: '0.16em', textTransform: 'uppercase',
    fontFamily: MONO, position: 'relative', overflow: 'hidden',
  }}>
    <span style={{
      position: 'absolute', inset: 0,
      background: `linear-gradient(90deg, transparent, ${color}22, transparent)`,
      animation: 'shimmerSlide 2.2s ease-in-out infinite',
    }} />
    {children}
  </span>
);

/* ── Perk row ─────────────────────────────────────────── */
const PerkRow = ({ perk, accent }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '9px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  }}>
    <span style={{
      width: 30, height: 30, borderRadius: 9, flexShrink: 0,
      display: 'grid', placeItems: 'center', fontSize: 15,
      background: perk.included ? `${accent}15` : 'rgba(255,255,255,0.04)',
      border: `1px solid ${perk.included ? `${accent}30` : 'rgba(255,255,255,0.06)'}`,
    }}>
      {perk.included ? perk.icon : '—'}
    </span>
    <span style={{
      fontSize: 13.5, fontFamily: SANS,
      color: perk.included ? 'rgba(235,235,235,0.85)' : 'rgba(235,235,235,0.28)',
      textDecoration: perk.included ? 'none' : 'line-through',
    }}>
      {perk.text}
    </span>
    {perk.included && (
      <span style={{ marginLeft: 'auto', color: accent, fontSize: 14, flexShrink: 0 }}>✓</span>
    )}
  </div>
);

/* ── Toast notification ───────────────────────────────── */
const Toast = ({ show, type, message }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999,
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

/* ══════════════════════════════════════════════════════ */
/* PricingSection                                         */
/* ══════════════════════════════════════════════════════ */
export default function PricingSection({ onSignInRequired }) {
  const { token, user } = useAuth();

  const [buying, setBuying]       = useState(false);
  const [toast, setToast]         = useState({ show: false, type: 'success', message: '' });
  const [hoverFree, setHoverFree] = useState(false);
  const [hoverPass, setHoverPass] = useState(false);

  const showToast = useCallback((type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 4000);
  }, []);

  const handleBuyPass = useCallback(async () => {
    if (!token) {
      if (onSignInRequired) onSignInRequired();
      return;
    }
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
        // Payment succeeded on Razorpay's end → activate on backend
        try {
          const result = await activatePass(token);
          if (result.success) {
            showToast('success', '🎉 Play Pass activated! Welcome to unlimited gaming.');
          } else if (result.error === 'Play Pass is already active') {
            showToast('success', 'Your Play Pass is already active!');
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
    setBuying(false); // Reset buying state immediately after opening (modal manages itself)
  }, [token, user, onSignInRequired, showToast]);

  return (
    <section
      id="pricing"
      style={{ padding: '96px 0', position: 'relative', overflow: 'hidden' }}
    >
      {/* Background blobs */}
      <div aria-hidden style={{
        position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400,
        background: `radial-gradient(ellipse, ${LIME}0a 0%, transparent 65%)`,
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div aria-hidden style={{
        position: 'absolute', bottom: 0, right: '5%',
        width: 340, height: 340,
        background: `radial-gradient(ellipse, ${PURPLE}12 0%, transparent 65%)`,
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Section header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <ShimmerBadge>⚡ Subscription Plans</ShimmerBadge>

          <h2 style={{
            fontFamily: SANS, fontWeight: 800,
            fontSize: 'clamp(2rem, 4.5vw, 3rem)',
            letterSpacing: '-0.05em', lineHeight: 1.05,
            color: '#ebebeb', marginTop: 18, marginBottom: 14,
          }}>
            Choose your{' '}
            <span style={{
              background: `linear-gradient(105deg, ${LIME}, #fff)`,
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontStyle: 'italic',
            }}>
              level
            </span>
          </h2>

          <p style={{
            fontFamily: SANS, fontSize: 16, lineHeight: 1.7,
            color: 'rgba(235,235,235,0.5)',
            maxWidth: 480, margin: '0 auto',
          }}>
            Start free — play once on any game. Upgrade to Play Pass for unlimited
            competition, real tournament prizes, and every game mode unlocked.
          </p>
        </motion.div>

        {/* ── Tier cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 22, maxWidth: 840, margin: '0 auto',
          alignItems: 'stretch',
        }}>

          {/* ── FREE tier ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={() => setHoverFree(true)}
            onMouseLeave={() => setHoverFree(false)}
            style={{
              borderRadius: 28,
              background: 'rgba(255,255,255,0.025)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${hoverFree ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)'}`,
              padding: '36px 32px',
              display: 'flex', flexDirection: 'column', gap: 0,
              transition: 'border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
              transform: hoverFree ? 'translateY(-4px)' : 'translateY(0)',
              boxShadow: hoverFree ? '0 24px 60px rgba(0,0,0,0.5)' : '0 8px 30px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ marginBottom: 28 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '5px 14px', borderRadius: 999,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(235,235,235,0.55)',
                fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
                fontFamily: MONO, marginBottom: 20,
              }}>
                🎮 Free Tier
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 8 }}>
                <span style={{
                  fontFamily: SANS, fontWeight: 900,
                  fontSize: 44, letterSpacing: '-0.05em', color: '#ebebeb', lineHeight: 1,
                }}>₹0</span>
                <span style={{
                  fontFamily: MONO, fontSize: 11, color: 'rgba(235,235,235,0.35)',
                  paddingBottom: 8,
                }}>/ forever</span>
              </div>

              <p style={{
                fontFamily: SANS, fontSize: 13.5, lineHeight: 1.65,
                color: 'rgba(235,235,235,0.45)', margin: 0,
              }}>
                Try any game once. Then play up to 3 times per day, with core modes available.
              </p>
            </div>

            <div style={{ flex: 1, marginBottom: 28 }}>
              {FREE_PERKS.map((perk) => (
                <PerkRow key={perk.text} perk={perk} accent="rgba(235,235,235,0.5)" />
              ))}
            </div>

            <div style={{
              padding: '14px 20px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              textAlign: 'center',
              fontFamily: SANS, fontSize: 13, fontWeight: 600,
              color: 'rgba(235,235,235,0.40)',
            }}>
              Current plan — always free
            </div>
          </motion.div>

          {/* ── PLAY PASS tier ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            onMouseEnter={() => setHoverPass(true)}
            onMouseLeave={() => setHoverPass(false)}
            style={{
              borderRadius: 28,
              background: `linear-gradient(160deg, rgba(204,255,0,0.07) 0%, rgba(167,139,250,0.06) 100%)`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${hoverPass ? `${LIME}55` : `${LIME}28`}`,
              padding: '36px 32px',
              display: 'flex', flexDirection: 'column', gap: 0,
              position: 'relative', overflow: 'hidden',
              transition: 'border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
              transform: hoverPass ? 'translateY(-6px)' : 'translateY(0)',
              boxShadow: hoverPass
                ? `0 28px 70px rgba(0,0,0,0.55), 0 0 60px -20px ${LIME}33`
                : `0 8px 30px rgba(0,0,0,0.35), 0 0 40px -24px ${LIME}22`,
            }}
          >
            {/* Top gradient stripe */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, ${LIME}, ${PURPLE}, ${LIME})`,
              backgroundSize: '200% 100%',
              animation: 'shimmerStripe 3s ease infinite',
            }} />

            {/* Most Popular badge */}
            <div style={{
              position: 'absolute', top: 20, right: 24,
              padding: '5px 12px', borderRadius: 999,
              background: `${LIME}18`, border: `1px solid ${LIME}45`,
              color: LIME, fontSize: 9, fontWeight: 800,
              letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: MONO,
            }}>
              ⭐ Most Popular
            </div>

            <div style={{ marginBottom: 28, paddingTop: 4 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '5px 14px', borderRadius: 999,
                background: `${LIME}14`, border: `1px solid ${LIME}40`,
                color: LIME,
                fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
                fontFamily: MONO, marginBottom: 20,
              }}>
                ⚡ Play Pass
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 8 }}>
                <span style={{
                  fontFamily: SANS, fontWeight: 900,
                  fontSize: 44, letterSpacing: '-0.05em', color: LIME, lineHeight: 1,
                  textShadow: `0 0 30px ${LIME}55`,
                }}>₹99</span>
                <span style={{
                  fontFamily: MONO, fontSize: 11, color: 'rgba(235,235,235,0.45)',
                  paddingBottom: 8,
                }}>/ month</span>
              </div>

              <p style={{
                fontFamily: SANS, fontSize: 13.5, lineHeight: 1.65,
                color: 'rgba(235,235,235,0.55)', margin: 0,
              }}>
                No caps. No locked modes. Pure unlimited competition across all 6 games.
              </p>
            </div>

            <div style={{ flex: 1, marginBottom: 28 }}>
              {PASS_PERKS.map((perk) => (
                <PerkRow key={perk.text} perk={perk} accent={LIME} />
              ))}
            </div>

            <motion.button
              onClick={handleBuyPass}
              disabled={buying}
              whileHover={{ scale: buying ? 1 : 1.02 }}
              whileTap={{ scale: buying ? 1 : 0.97 }}
              style={{
                width: '100%', padding: '16px 20px',
                borderRadius: 16, border: 'none',
                background: `linear-gradient(135deg, ${LIME}, ${PURPLE})`,
                color: '#000', fontWeight: 900,
                fontSize: 15, letterSpacing: '-0.01em',
                cursor: buying ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: `0 8px 32px -8px ${LIME}55`,
                opacity: buying ? 0.75 : 1,
                transition: 'opacity 0.2s',
                fontFamily: SANS,
              }}
            >
              {buying ? (
                <>
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2.5px solid rgba(0,0,0,0.3)', borderTopColor: '#000',
                    animation: 'pricingSpin 0.7s linear infinite', display: 'inline-block',
                  }} />
                  Opening payment…
                </>
              ) : (
                <> ⚡ Get Play Pass — ₹99/month</>
              )}
            </motion.button>

            <p style={{
              marginTop: 12, textAlign: 'center',
              fontSize: 11, fontFamily: MONO,
              color: 'rgba(235,235,235,0.28)',
            }}>
              Secured by Razorpay · Cancel anytime
            </p>
          </motion.div>
        </div>

        {/* ── Bottom reassurance strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.2 }}
          style={{
            display: 'flex', justifyContent: 'center',
            gap: 32, flexWrap: 'wrap',
            marginTop: 44,
          }}
        >
          {[
            { icon: '🔒', text: '256-bit encrypted payments' },
            { icon: '↩️', text: 'Cancel anytime' },
            { icon: '⚡', text: 'Instant activation' },
            { icon: '🇮🇳', text: 'UPI · Cards · NetBanking accepted' },
          ].map((item) => (
            <div key={item.text} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em',
              color: 'rgba(235,235,235,0.35)',
            }}>
              <span>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Toast */}
      <Toast show={toast.show} type={toast.type} message={toast.message} />

      <style>{`
        @keyframes shimmerSlide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shimmerStripe {
          0%   { background-position: 0% 0%; }
          50%  { background-position: 100% 0%; }
          100% { background-position: 0% 0%; }
        }
        @keyframes pricingSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
