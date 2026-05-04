import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

/* ─────────────────────────────────────────────
   Icons
───────────────────────────────────────────── */
const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="M2 7l10 7 10-7" />
  </svg>
);
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="5" y="11" width="14" height="10" rx="3" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
const IconEye = ({ show }) =>
  show ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const IconGoogle = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335" />
  </svg>
);

/* ─────────────────────────────────────────────
   Decorative floating particles
───────────────────────────────────────────── */
const ModalParticles = () => {
  const particles = [
    { top: '10%', left: '7%',  size: 2.5, delay: '0s',   dur: '7s',  color: '#ccff00' },
    { top: '78%', left: '91%', size: 2,   delay: '1.2s', dur: '9s',  color: '#10b981' },
    { top: '50%', left: '4%',  size: 3,   delay: '2.5s', dur: '6s',  color: '#ccff00' },
    { top: '18%', left: '88%', size: 2,   delay: '0.7s', dur: '8s',  color: '#10b981' },
    { top: '88%', left: '18%', size: 2,   delay: '1.8s', dur: '7.5s',color: '#ccff00' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: '2rem', zIndex: 0 }}>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', top: p.top, left: p.left,
          width: p.size, height: p.size, borderRadius: '50%',
          background: p.color, opacity: 0.5,
          animation: `float ${p.dur} ease-in-out infinite`,
          animationDelay: p.delay,
          boxShadow: `0 0 8px ${p.color}88`,
        }} />
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Divider
───────────────────────────────────────────── */
const OrDivider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
    <span style={{ fontSize: 11, color: 'rgba(235,235,235,0.3)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em' }}>OR</span>
    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
  </div>
);

/* ─────────────────────────────────────────────
   Animation variants
───────────────────────────────────────────── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
  exit:   { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.2,  ease: [0.4, 0, 0.2, 1] } },
};

const headerVariants = {
  hidden:  { opacity: 0, y: -16, scale: 0.97 },
  visible: { opacity: 1, y: 0,   scale: 1,    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0,                       transition: { duration: 0.2 } },
};



/* ─────────────────────────────────────────────
   Main Signin Component
───────────────────────────────────────────── */
const Signin = ({ isOpen, onClose, onSwitchToSignup }) => {
  const reduced = useReducedMotion();
  const MotionDiv = useMemo(() => motion.div, []);
  const { login } = useAuth();

  const [form, setForm]                 = useState({ email: '', password: '' });
  const [errors, setErrors]             = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember]         = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [done, setDone]                 = useState(false);
  const [forgotSent, setForgotSent]     = useState(false);
  const [view, setView]                 = useState('signin'); // 'signin' | 'forgot'

  /* Reset on close */
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setForm({ email: '', password: '' });
        setErrors({});
        setShowPassword(false);
        setRemember(false);
        setSubmitting(false);
        setDone(false);
        setForgotSent(false);
        setView('signin');
      }, 400);
    }
  }, [isOpen]);

  /* ESC key */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const set = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((e) => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (view === 'signin') {
      if (!form.email) errs.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
      if (!form.password) errs.password = 'Password is required';
    } else {
      if (!form.email) errs.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to login');
      
      // Pass token and user object directly to the Auth provider
      login(data.access_token, data.user);

      setDone(true);
    } catch (err) {
      setErrors({ password: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      const res = await fetch('http://127.0.0.1:8000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to login with Google');
      
      login(data.access_token, data.user);
      setDone(true);
    } catch (err) {
      setErrors({ password: err.message || 'Google sign in failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async () => {
    if (!validate()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitting(false);
    setForgotSent(true);
  };

  /* ── Style helpers ── */
  const inputStyle = (field) => ({
    width: '100%',
    padding: '13px 16px 13px 44px',
    background: errors[field] ? 'rgba(248,113,113,0.05)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${errors[field] ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: '0.875rem',
    color: 'var(--c-fg)',
    fontSize: 14,
    fontFamily: "'Space Grotesk', sans-serif",
    outline: 'none',
    transition: 'border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease',
  });

  const iconWrap = {
    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
    color: 'rgba(204,255,0,0.55)', pointerEvents: 'none', display: 'flex',
  };

  const focusIn  = (e) => {
    e.target.style.borderColor = 'rgba(204,255,0,0.45)';
    e.target.style.boxShadow   = '0 0 0 3px rgba(204,255,0,0.12)';
    e.target.style.background  = 'rgba(204,255,0,0.04)';
  };
  const focusOut = (field) => (e) => {
    e.target.style.borderColor = errors[field] ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)';
    e.target.style.boxShadow   = 'none';
    e.target.style.background  = errors[field] ? 'rgba(248,113,113,0.05)' : 'rgba(255,255,255,0.03)';
  };

  /* ─────────────────────────────────────── */
  return (
    <AnimatePresence>
      {isOpen && (
        /* ── Backdrop — scrollable so modal never clips ── */
        <MotionDiv
          key="signin-backdrop"
          initial={reduced ? false : { opacity: 0 }}
          animate={reduced ? undefined : { opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            /* KEY FIX: scroll instead of clip */
            overflowY: 'auto',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '40px 20px 40px',
          }}
        >
          {/* ── Modal card ── */}
          <MotionDiv
            key="signin-modal"
            initial={reduced ? false : { opacity: 0, scale: 0.94, y: 28 }}
            animate={reduced ? undefined : { opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, scale: 0.94, y: 28 }}
            transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 440,
              /* no fixed height — grows with content, never clips */
              background: 'linear-gradient(145deg, #0f0f0f 0%, #0c0c0c 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '2rem',
              padding: '36px 32px',
              boxShadow: '0 40px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}
          >
            {/* Ambient glows */}
            <div style={{ position: 'absolute', top: '-55%', left: '25%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(204,255,0,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'absolute', bottom: '-35%', right: '-5%',  width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
            {/* Grid */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0, borderRadius: '2rem' }} />

            <ModalParticles />

            {/* ── Content ── */}
            <div style={{ position: 'relative', zIndex: 1 }}>

              {/* Close */}
              <motion.button
                id="signin-close-btn"
                type="button"
                data-cursor="hover"
                aria-label="Close signin"
                onClick={onClose}
                initial={reduced ? false : { opacity: 0, scale: 0.7 }}
                animate={reduced ? undefined : { opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.28 }}
                style={{ position: 'absolute', top: -8, right: -8, width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'rgba(235,235,235,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(204,255,0,0.4)'; e.currentTarget.style.color = '#ccff00'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(235,235,235,0.6)'; }}
              >
                <IconClose />
              </motion.button>

              {/* ── Header (always animated) ── */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={done ? 'hdr-done' : view}
                  variants={reduced ? {} : headerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ textAlign: 'center', marginBottom: 28 }}
                >
                  <motion.div
                    initial={reduced ? false : { scale: 0.7, opacity: 0 }}
                    animate={reduced ? undefined : { scale: 1, opacity: 1 }}
                    transition={{ delay: 0.05, duration: 0.4, type: 'spring', stiffness: 220, damping: 18 }}
                    style={{ display: 'inline-flex', marginBottom: 16 }}
                  >
                    <div style={{ width: 48, height: 48, background: '#ccff00', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#000', fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 0 32px rgba(204,255,0,0.35)' }}>
                      A
                    </div>
                  </motion.div>
                  <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: '-0.05em', color: '#ebebeb', margin: 0, lineHeight: 1.1 }}>
                    {done ? 'Welcome Back!' : view === 'forgot' ? 'Reset Password' : 'Sign In'}
                  </h1>
                  {!done && (
                    <p style={{ marginTop: 8, fontSize: 14, color: 'rgba(235,235,235,0.45)', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {view === 'forgot'
                        ? "We'll send a reset link to your email"
                        : <>Your arena awaits, <span style={{ background: 'linear-gradient(135deg,#ccff00,#e5e5e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>commander</span></>}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* ── Success state ── */}
              <AnimatePresence mode="wait">
                {done && (
                  <motion.div
                    key="success"
                    initial={reduced ? false : { opacity: 0, scale: 0.88 }}
                    animate={reduced ? undefined : { opacity: 1, scale: 1 }}
                    exit={reduced ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                    style={{ textAlign: 'center', padding: '8px 0' }}
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 18 }}
                      style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(204,255,0,0.12)', border: '2px solid rgba(204,255,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 48px rgba(204,255,0,0.2)' }}
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccff00" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.35 }}
                      style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: '-0.04em', color: '#ebebeb', marginBottom: 8 }}
                    >
                      Signed In!
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.35 }}
                      style={{ fontSize: 14, color: 'rgba(235,235,235,0.5)', fontFamily: "'Space Grotesk', sans-serif", marginBottom: 28 }}
                    >
                      Ready to dominate the arena.
                    </motion.p>
                    <motion.button
                      id="signin-enter-btn"
                      type="button"
                      className="btn-primary"
                      onClick={onClose}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.35 }}
                      style={{ width: '100%', padding: 14, fontSize: 15 }}
                    >
                      Enter Arena →
                    </motion.button>
                  </motion.div>
                )}

                {/* ── Forgot Password ── */}
                {!done && view === 'forgot' && (
                  <motion.div
                    key="forgot"
                    variants={reduced ? {} : containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{ display: 'grid', gap: 18 }}
                  >
                    {forgotSent ? (
                      <motion.div
                        variants={reduced ? {} : itemVariants}
                        style={{ textAlign: 'center', padding: '12px 0 8px' }}
                      >
                        <motion.div
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 18 }}
                          style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1.5px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 32px rgba(16,185,129,0.15)' }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2"><path d="M20 6L9 17l-5-5" /></svg>
                        </motion.div>
                        <p style={{ fontSize: 14, color: 'rgba(235,235,235,0.6)', fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.6, marginBottom: 20 }}>
                          Reset link sent to <strong style={{ color: '#ccff00' }}>{form.email}</strong>.<br />Check your inbox.
                        </p>
                        <button id="signin-back-from-sent-btn" type="button" className="btn-secondary" onClick={() => { setView('signin'); setForgotSent(false); }} style={{ width: '100%', padding: 13 }}>
                          ← Back to Sign In
                        </button>
                      </motion.div>
                    ) : (
                      <>
                        <motion.div variants={reduced ? {} : itemVariants} style={{ display: 'grid', gap: 6 }}>
                          <label htmlFor="forgot-email" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.55)', fontFamily: "'JetBrains Mono', monospace" }}>
                            <span style={{ color: errors.email ? '#f87171' : 'rgba(204,255,0,0.7)' }}><IconMail /></span>
                            Email Address
                          </label>
                          <div style={{ position: 'relative' }}>
                            <span style={iconWrap}><IconMail /></span>
                            <input id="forgot-email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleForgot(); }} style={inputStyle('email')} onFocus={focusIn} onBlur={focusOut('email')} />
                          </div>
                          {errors.email && <span style={{ fontSize: 12, color: '#f87171', fontFamily: "'Space Grotesk', sans-serif" }}>{errors.email}</span>}
                        </motion.div>

                        <motion.button
                          id="signin-send-reset-btn"
                          type="button"
                          className="btn-primary"
                          onClick={handleForgot}
                          disabled={submitting}
                          variants={reduced ? {} : itemVariants}
                          whileHover={reduced ? {} : { scale: 1.02 }}
                          whileTap={reduced ? {} : { scale: 0.98 }}
                          style={{ width: '100%', padding: 14, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        >
                          {submitting ? (
                            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>Sending…</>
                          ) : (
                            <>Send Reset Link <IconArrow /></>
                          )}
                        </motion.button>

                        <motion.button
                          id="signin-back-to-signin-btn"
                          type="button"
                          onClick={() => setView('signin')}
                          variants={reduced ? {} : itemVariants}
                          style={{ background: 'none', border: 'none', color: 'rgba(235,235,235,0.45)', fontSize: 13, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", textAlign: 'center', transition: 'color 0.2s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(235,235,235,0.45)'; }}
                        >
                          ← Back to Sign In
                        </motion.button>
                      </>
                    )}
                  </motion.div>
                )}

                {/* ── Sign In Form ── */}
                {!done && view === 'signin' && (
                  <motion.div
                    key="signin-form"
                    variants={reduced ? {} : containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{ display: 'grid', gap: 18 }}
                  >
                    {/* Google */}
                    <motion.button
                      id="signin-google-btn"
                      type="button"
                      data-cursor="hover"
                      onClick={handleGoogleSignIn}
                      disabled={submitting}
                      variants={reduced ? {} : itemVariants}
                      whileHover={reduced ? {} : { scale: 1.02, borderColor: 'rgba(255,255,255,0.25)' }}
                      whileTap={reduced ? {} : { scale: 0.98 }}
                      style={{
                        width: '100%', padding: '12px 16px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '0.875rem',
                        color: 'rgba(235,235,235,0.85)',
                        fontSize: 14, fontWeight: 600,
                        fontFamily: "'Space Grotesk', sans-serif",
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        transition: 'border-color 0.25s ease, background 0.25s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    >
                      <IconGoogle />
                      Continue with Google
                    </motion.button>

                    <motion.div variants={reduced ? {} : itemVariants}>
                      <OrDivider />
                    </motion.div>

                    {/* Email */}
                    <motion.div variants={reduced ? {} : itemVariants} style={{ display: 'grid', gap: 6 }}>
                      <label htmlFor="signin-email" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.55)', fontFamily: "'JetBrains Mono', monospace" }}>
                        <span style={{ color: errors.email ? '#f87171' : 'rgba(204,255,0,0.7)' }}><IconMail /></span>
                        Email Address
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={iconWrap}><IconMail /></span>
                        <input id="signin-email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} style={inputStyle('email')} onFocus={focusIn} onBlur={focusOut('email')} />
                      </div>
                      {errors.email && <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: 12, color: '#f87171', fontFamily: "'Space Grotesk', sans-serif" }}>{errors.email}</motion.span>}
                    </motion.div>

                    {/* Password */}
                    <motion.div variants={reduced ? {} : itemVariants} style={{ display: 'grid', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label htmlFor="signin-password" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.55)', fontFamily: "'JetBrains Mono', monospace" }}>
                          <span style={{ color: errors.password ? '#f87171' : 'rgba(204,255,0,0.7)' }}><IconLock /></span>
                          Password
                        </label>
                        <button id="signin-forgot-link-btn" type="button" onClick={() => setView('forgot')} style={{ background: 'none', border: 'none', color: 'rgba(204,255,0,0.75)', fontSize: 12, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500, transition: 'color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ccff00'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(204,255,0,0.75)'; }}>
                          Forgot password?
                        </button>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <span style={iconWrap}><IconLock /></span>
                        <input id="signin-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Your password" value={form.password} onChange={(e) => set('password', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }} style={{ ...inputStyle('password'), paddingRight: 44 }} onFocus={focusIn} onBlur={focusOut('password')} />
                        <button id="signin-toggle-password-btn" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((p) => !p)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(235,235,235,0.4)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ccff00'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(235,235,235,0.4)'; }}>
                          <IconEye show={showPassword} />
                        </button>
                      </div>
                      {errors.password && <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: 12, color: '#f87171', fontFamily: "'Space Grotesk', sans-serif" }}>{errors.password}</motion.span>}
                    </motion.div>

                    {/* Remember me */}
                    <motion.label
                      htmlFor="signin-remember"
                      variants={reduced ? {} : itemVariants}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div
                        id="signin-remember"
                        role="checkbox"
                        aria-checked={remember}
                        tabIndex={0}
                        onClick={() => setRemember((r) => !r)}
                        onKeyDown={(e) => { if (e.key === ' ') setRemember((r) => !r); }}
                        style={{
                          width: 18, height: 18, borderRadius: 5,
                          border: `1.5px solid ${remember ? 'rgba(204,255,0,0.6)' : 'rgba(255,255,255,0.15)'}`,
                          background: remember ? 'rgba(204,255,0,0.15)' : 'rgba(255,255,255,0.03)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s ease', flexShrink: 0,
                          boxShadow: remember ? '0 0 8px rgba(204,255,0,0.2)' : 'none',
                        }}
                      >
                        <AnimatePresence>
                          {remember && (
                            <motion.svg
                              width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ccff00" strokeWidth="3"
                              initial={{ opacity: 0, scale: 0.4 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.4 }}
                              transition={{ duration: 0.18 }}
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </motion.svg>
                          )}
                        </AnimatePresence>
                      </div>
                      <span style={{ fontSize: 13, color: 'rgba(235,235,235,0.55)', fontFamily: "'Space Grotesk', sans-serif" }}>
                        Remember me for 30 days
                      </span>
                    </motion.label>

                    {/* Submit */}
                    <motion.button
                      id="signin-submit-btn"
                      type="button"
                      className="btn-primary"
                      onClick={handleSubmit}
                      disabled={submitting}
                      variants={reduced ? {} : itemVariants}
                      whileHover={reduced ? {} : { scale: 1.02 }}
                      whileTap={reduced ? {} : { scale: 0.97 }}
                      style={{ width: '100%', padding: 14, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: submitting ? 0.8 : 1 }}
                    >
                      {submitting ? (
                        <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>Signing In…</>
                      ) : (
                        <>Sign In <IconArrow /></>
                      )}
                    </motion.button>

                    {/* Switch to signup */}
                    <motion.p
                      variants={reduced ? {} : itemVariants}
                      style={{ textAlign: 'center', fontSize: 13, color: 'rgba(235,235,235,0.4)', fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}
                    >
                      Don't have an account?{' '}
                      <button
                        id="signin-switch-to-signup-btn"
                        type="button"
                        onClick={() => { onClose(); setTimeout(onSwitchToSignup, 200); }}
                        style={{ background: 'none', border: 'none', color: '#ccff00', fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontSize: 13 }}
                      >
                        Create account
                      </button>
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to   { transform: rotate(360deg); }
              }
            `}</style>
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};

export default Signin;
