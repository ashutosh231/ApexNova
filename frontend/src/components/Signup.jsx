import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
/* ─────────────────────────────────────────────
   Tiny icon helpers
───────────────────────────────────────────── */
const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="M2 7l10 7 10-7" />
  </svg>
);
const IconOTP = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="5" y="2" width="14" height="20" rx="3" />
    <circle cx="12" cy="17" r="1.2" fill="currentColor" />
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
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
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M20 6L9 17l-5-5" />
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
const OrDivider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
    <span style={{ fontSize: 11, color: 'rgba(235,235,235,0.3)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em' }}>OR</span>
    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
  </div>
);

/* ─────────────────────────────────────────────
   Animated decorative particles (inside modal)
───────────────────────────────────────────── */
const ModalParticles = () => {
  const particles = [
    { top: '12%', left: '8%', size: 3, delay: '0s', dur: '6s', color: '#ccff00' },
    { top: '75%', left: '92%', size: 2, delay: '1s', dur: '8s', color: '#10b981' },
    { top: '55%', left: '5%', size: 2.5, delay: '2s', dur: '7s', color: '#ccff00' },
    { top: '20%', left: '90%', size: 3.5, delay: '0.5s', dur: '9s', color: '#10b981' },
    { top: '88%', left: '15%', size: 2, delay: '1.6s', dur: '7.5s', color: '#ccff00' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: '2rem', zIndex: 0 }}>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            opacity: 0.55,
            animation: `float ${p.dur} ease-in-out infinite`,
            animationDelay: p.delay,
            boxShadow: `0 0 8px ${p.color}88`,
          }}
        />
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   OTP Input – 6 individual boxes
───────────────────────────────────────────── */
const OTPInput = ({ value, onChange }) => {
  const inputs = useRef([]);
  const digits = (value + '      ').slice(0, 6).split('');

  const handleKey = (e, idx) => {
    const { key } = e;
    if (key === 'Backspace') {
      const next = [...digits];
      if (next[idx] && next[idx] !== ' ') {
        next[idx] = ' ';
      } else if (idx > 0) {
        next[idx - 1] = ' ';
        inputs.current[idx - 1]?.focus();
      }
      onChange(next.join('').trimEnd());
    } else if (/^[0-9]$/.test(key)) {
      const next = [...digits];
      next[idx] = key;
      onChange(next.join('').trimEnd());
      if (idx < 5) inputs.current[idx + 1]?.focus();
    } else if (key === 'ArrowLeft' && idx > 0) {
      inputs.current[idx - 1]?.focus();
    } else if (key === 'ArrowRight' && idx < 5) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(text);
    inputs.current[Math.min(text.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          id={`otp-digit-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d === ' ' ? '' : d}
          onChange={() => {}}
          onKeyDown={(e) => handleKey(e, i)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          style={{
            width: 48,
            height: 52,
            textAlign: 'center',
            fontSize: 20,
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: 0,
            background: d !== ' ' && d ? 'rgba(204,255,0,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${d !== ' ' && d ? 'rgba(204,255,0,0.5)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 12,
            color: '#ccff00',
            outline: 'none',
            caretColor: '#ccff00',
            transition: 'border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease',
            boxShadow: d !== ' ' && d ? '0 0 0 3px rgba(204,255,0,0.1)' : 'none',
            cursor: 'pointer',
          }}
          onFocusCapture={(e) => {
            e.target.style.borderColor = 'rgba(204,255,0,0.5)';
            e.target.style.boxShadow = '0 0 0 3px rgba(204,255,0,0.12)';
          }}
          onBlurCapture={(e) => {
            const d2 = e.target.value;
            e.target.style.borderColor = d2 ? 'rgba(204,255,0,0.5)' : 'rgba(255,255,255,0.12)';
            e.target.style.boxShadow = d2 ? '0 0 0 3px rgba(204,255,0,0.1)' : 'none';
          }}
        />
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   FormField wrapper
───────────────────────────────────────────── */
const FormField = ({ id, label, icon, children, hint, error }) => (
  <div style={{ display: 'grid', gap: 6 }}>
    <label
      htmlFor={id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'rgba(235,235,235,0.55)',
        fontFamily: "'JetBrains Mono', monospace",
        cursor: 'default',
      }}
    >
      <span style={{ color: error ? '#f87171' : 'rgba(204,255,0,0.7)' }}>{icon}</span>
      {label}
    </label>
    {children}
    {error && (
      <span style={{ fontSize: 12, color: '#f87171', fontFamily: "'Space Grotesk', sans-serif" }}>
        {error}
      </span>
    )}
    {!error && hint && (
      <span style={{ fontSize: 12, color: 'rgba(235,235,235,0.35)', fontFamily: "'Space Grotesk', sans-serif" }}>
        {hint}
      </span>
    )}
  </div>
);

/* ─────────────────────────────────────────────
   Password strength bar
───────────────────────────────────────────── */
const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#ccff00'];

function calcStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const PasswordStrength = ({ password }) => {
  const strength = calcStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: 2 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i <= strength ? strengthColor[strength] : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s ease',
              boxShadow: i <= strength ? `0 0 6px ${strengthColor[strength]}55` : 'none',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 11, color: strengthColor[strength], marginTop: 4, display: 'block', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
        {strengthLabel[strength]}
      </span>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Steps indicator
───────────────────────────────────────────── */
const STEPS = ['Account', 'Verify', 'Profile'];

const StepIndicator = ({ current }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28 }}>
    {STEPS.map((label, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <React.Fragment key={label}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: done ? '#ccff00' : active ? 'rgba(204,255,0,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${done ? '#ccff00' : active ? 'rgba(204,255,0,0.5)' : 'rgba(255,255,255,0.12)'}`,
                color: done ? '#000' : active ? '#ccff00' : 'rgba(235,235,235,0.35)',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.35s ease',
                boxShadow: active ? '0 0 16px rgba(204,255,0,0.25)' : done ? '0 0 12px rgba(204,255,0,0.3)' : 'none',
              }}
            >
              {done ? <IconCheck /> : i + 1}
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontFamily: "'JetBrains Mono', monospace",
              color: done ? '#ccff00' : active ? 'rgba(235,235,235,0.85)' : 'rgba(235,235,235,0.3)',
              transition: 'color 0.35s ease',
            }}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{
              width: 56,
              height: 1.5,
              marginBottom: 18,
              background: i < current
                ? 'linear-gradient(90deg, #ccff00, rgba(204,255,0,0.3))'
                : 'rgba(255,255,255,0.1)',
              transition: 'background 0.35s ease',
            }} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* ─────────────────────────────────────────────
   Main Signup Component
───────────────────────────────────────────── */
const Signup = ({ isOpen, onClose, onSwitchToSignin }) => {
  const reduced = useReducedMotion();
  const MotionDiv = useMemo(() => motion.div, []);
  const { login } = useAuth();

  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({ email: '', otp: '', name: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});

  // Timer for OTP resend
  useEffect(() => {
    if (otpTimer <= 0) return;
    const t = setTimeout(() => setOtpTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [otpTimer]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(0);
        setForm({ email: '', otp: '', name: '', password: '', confirm: '' });
        setErrors({});
        setOtpSent(false);
        setOtpTimer(0);
        setShowPassword(false);
        setShowConfirm(false);
        setDone(false);
      }, 400);
    }
  }, [isOpen]);

  // Trap focus  
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

  /* ── Validation per step ── */
  const validate = () => {
    const errs = {};
    if (step === 0) {
      if (!form.email) errs.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    }
    if (step === 1) {
      if (form.otp.replace(/\s/g, '').length < 6) errs.otp = 'Enter all 6 digits';
    }
    if (step === 2) {
      if (!form.name.trim()) errs.name = 'Name is required';
      else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
      if (!form.password) errs.password = 'Password is required';
      else if (form.password.length < 8) errs.password = 'Minimum 8 characters';
      if (!form.confirm) errs.confirm = 'Please confirm your password';
      else if (form.confirm !== form.password) errs.confirm = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      
      setOtpSent(true);
      setOtpTimer(60);
      setStep(1);
    } catch (err) {
      setErrors({ email: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: form.email, otp: form.otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      
      setStep(2);
    } catch (err) {
      setErrors({ otp: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ 
          email: form.email, 
          name: form.name, 
          password: form.password, 
          otp: form.otp 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register');
      
      // Use auth context to login
      login(data.access_token, data.user);

      setDone(true);
    } catch (err) {
      setErrors({ confirm: err.message }); // surface error below password fields
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
      setErrors({ email: err.message || 'Google sign in failed' });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Input style helper ── */
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
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(204,255,0,0.55)',
    pointerEvents: 'none',
    display: 'flex',
  };

  /* ─── Backdrop + Modal ─── */
  return (
    <AnimatePresence>
      {isOpen && (
        <MotionDiv
          key="backdrop"
          initial={reduced ? false : { opacity: 0 }}
          animate={reduced ? undefined : { opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 500,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <MotionDiv
            key="modal"
            initial={reduced ? false : { opacity: 0, scale: 0.95, y: 20 }}
            animate={reduced ? undefined : { opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 480,
              background: 'linear-gradient(145deg, #0f0f0f 0%, #0c0c0c 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '2rem',
              padding: '36px 32px',
              boxShadow: '0 40px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}
          >
            {/* Decorative glow */}
            <div style={{
              position: 'absolute',
              top: '-60%',
              left: '30%',
              width: 320,
              height: 320,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(204,255,0,0.07) 0%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 0,
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-40%',
              right: '-10%',
              width: 250,
              height: 250,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 0,
            }} />

            <ModalParticles />

            {/* Grid texture */}
            <div style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.15,
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              pointerEvents: 'none',
              zIndex: 0,
              borderRadius: '2rem',
            }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Close */}
              <button
                type="button"
                id="signup-close-btn"
                data-cursor="hover"
                aria-label="Close signup"
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(235,235,235,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, color 0.2s, background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(204,255,0,0.4)'; e.currentTarget.style.color = '#ccff00'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(235,235,235,0.6)'; }}
              >
                <IconClose />
              </button>

              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    background: '#ccff00',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#000',
                    fontFamily: "'Space Grotesk', sans-serif",
                    boxShadow: '0 0 32px rgba(204,255,0,0.35)',
                  }}>
                    A
                  </div>
                </div>
                <h1 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: 26,
                  letterSpacing: '-0.05em',
                  color: '#ebebeb',
                  margin: 0,
                  lineHeight: 1.1,
                }}>
                  {done ? 'Welcome Aboard!' : 'Create Your Account'}
                </h1>
                {!done && (
                  <p style={{
                    marginTop: 8,
                    fontSize: 14,
                    color: 'rgba(235,235,235,0.45)',
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>
                    Join <span style={{ background: 'linear-gradient(135deg,#ccff00,#e5e5e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ApexNova</span> and dominate the arena
                  </p>
                )}
              </div>

              {/* ── Success State ── */}
              {done ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                  style={{ textAlign: 'center', padding: '20px 0 8px' }}
                >
                  <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'rgba(204,255,0,0.12)',
                    border: '2px solid rgba(204,255,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 0 48px rgba(204,255,0,0.2)',
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccff00" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: '-0.04em', color: '#ebebeb', marginBottom: 8 }}>
                    Account Created!
                  </h2>
                  <p style={{ fontSize: 14, color: 'rgba(235,235,235,0.5)', fontFamily: "'Space Grotesk', sans-serif", marginBottom: 28 }}>
                    Welcome, <strong style={{ color: '#ccff00', fontWeight: 600 }}>{form.name}</strong>. Your journey begins now.
                  </p>
                  <button
                    id="signup-enter-arena-btn"
                    type="button"
                    className="btn-primary"
                    onClick={onClose}
                    style={{ width: '100%', padding: '14px', fontSize: 15 }}
                  >
                    Enter the Arena →
                  </button>
                </motion.div>
              ) : (
                <>
                  <StepIndicator current={step} />

                  {/* ── Step 0: Email ── */}
                  <AnimatePresence mode="wait">
                    {step === 0 && (
                      <motion.div
                        key="step-email"
                        initial={reduced ? false : { opacity: 0, x: 24 }}
                        animate={reduced ? undefined : { opacity: 1, x: 0 }}
                        exit={reduced ? undefined : { opacity: 0, x: -24 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        style={{ display: 'grid', gap: 20 }}
                      >
                        <motion.button
                          id="signup-google-btn"
                          type="button"
                          data-cursor="hover"
                          onClick={handleGoogleSignIn}
                          disabled={submitting}
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

                        <OrDivider />

                        <FormField id="signup-email" label="Email Address" icon={<IconMail />} error={errors.email}>
                          <div style={{ position: 'relative' }}>
                            <span style={iconWrap}><IconMail /></span>
                            <input
                              id="signup-email"
                              type="email"
                              autoComplete="email"
                              placeholder="you@example.com"
                              value={form.email}
                              onChange={(e) => set('email', e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSendOTP(); }}
                              style={inputStyle('email')}
                              onFocus={(e) => { e.target.style.borderColor = 'rgba(204,255,0,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(204,255,0,0.12)'; e.target.style.background = 'rgba(204,255,0,0.04)'; }}
                              onBlur={(e) => { e.target.style.borderColor = errors.email ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; e.target.style.background = errors.email ? 'rgba(248,113,113,0.05)' : 'rgba(255,255,255,0.03)'; }}
                            />
                          </div>
                        </FormField>

                        <button
                          id="signup-send-otp-btn"
                          type="button"
                          className="btn-primary"
                          onClick={handleSendOTP}
                          style={{ width: '100%', padding: '14px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        >
                          Send OTP <IconArrow />
                        </button>

                        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(235,235,235,0.4)', fontFamily: "'Space Grotesk', sans-serif" }}>
                          Already have an account?{' '}
                          <button
                            id="signup-switch-to-signin-btn"
                            type="button"
                            onClick={() => { onClose(); setTimeout(onSwitchToSignin, 200); }}
                            style={{ background: 'none', border: 'none', color: '#ccff00', fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontSize: 13 }}
                          >
                            Sign in
                          </button>
                        </p>
                      </motion.div>
                    )}

                    {/* ── Step 1: OTP ── */}
                    {step === 1 && (
                      <motion.div
                        key="step-otp"
                        initial={reduced ? false : { opacity: 0, x: 24 }}
                        animate={reduced ? undefined : { opacity: 1, x: 0 }}
                        exit={reduced ? undefined : { opacity: 0, x: -24 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        style={{ display: 'grid', gap: 20 }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: 14, color: 'rgba(235,235,235,0.55)', fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.55 }}>
                            We sent a 6-digit code to{' '}
                            <span style={{ color: '#ccff00', fontWeight: 600 }}>{form.email}</span>
                          </p>
                        </div>

                        <FormField id="otp-digit-0" label="One-Time Password" icon={<IconOTP />} error={errors.otp}>
                          <OTPInput value={form.otp} onChange={(v) => set('otp', v)} />
                        </FormField>

                        <div style={{ textAlign: 'center' }}>
                          {otpTimer > 0 ? (
                            <span style={{ fontSize: 13, color: 'rgba(235,235,235,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>
                              Resend in <span style={{ color: '#ccff00' }}>{otpTimer}s</span>
                            </span>
                          ) : (
                            <button
                              id="signup-resend-otp-btn"
                              type="button"
                              onClick={() => { setOtpTimer(60); set('otp', ''); }}
                              style={{ background: 'none', border: 'none', color: '#ccff00', fontSize: 13, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, textDecoration: 'underline' }}
                            >
                              Resend OTP
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <button
                            id="signup-back-to-email-btn"
                            type="button"
                            className="btn-secondary"
                            onClick={() => setStep(0)}
                            style={{ width: '100%', padding: '14px' }}
                          >
                            ← Back
                          </button>
                          <button
                            id="signup-verify-otp-btn"
                            type="button"
                            className="btn-primary"
                            onClick={handleVerifyOTP}
                            style={{ width: '100%', padding: '14px', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                          >
                            Verify <IconArrow />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* ── Step 2: Profile ── */}
                    {step === 2 && (
                      <motion.div
                        key="step-profile"
                        initial={reduced ? false : { opacity: 0, x: 24 }}
                        animate={reduced ? undefined : { opacity: 1, x: 0 }}
                        exit={reduced ? undefined : { opacity: 0, x: -24 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        style={{ display: 'grid', gap: 18 }}
                      >
                        {/* Name */}
                        <FormField id="signup-name" label="Display Name" icon={<IconUser />} error={errors.name}>
                          <div style={{ position: 'relative' }}>
                            <span style={iconWrap}><IconUser /></span>
                            <input
                              id="signup-name"
                              type="text"
                              autoComplete="name"
                              placeholder="Your gamer tag"
                              value={form.name}
                              onChange={(e) => set('name', e.target.value)}
                              style={inputStyle('name')}
                              onFocus={(e) => { e.target.style.borderColor = 'rgba(204,255,0,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(204,255,0,0.12)'; e.target.style.background = 'rgba(204,255,0,0.04)'; }}
                              onBlur={(e) => { e.target.style.borderColor = errors.name ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; e.target.style.background = errors.name ? 'rgba(248,113,113,0.05)' : 'rgba(255,255,255,0.03)'; }}
                            />
                          </div>
                        </FormField>

                        {/* Password */}
                        <FormField id="signup-password" label="Password" icon={<IconLock />} error={errors.password}>
                          <div style={{ position: 'relative' }}>
                            <span style={iconWrap}><IconLock /></span>
                            <input
                              id="signup-password"
                              type={showPassword ? 'text' : 'password'}
                              autoComplete="new-password"
                              placeholder="Min 8 characters"
                              value={form.password}
                              onChange={(e) => set('password', e.target.value)}
                              style={{ ...inputStyle('password'), paddingRight: 44 }}
                              onFocus={(e) => { e.target.style.borderColor = 'rgba(204,255,0,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(204,255,0,0.12)'; e.target.style.background = 'rgba(204,255,0,0.04)'; }}
                              onBlur={(e) => { e.target.style.borderColor = errors.password ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; e.target.style.background = errors.password ? 'rgba(248,113,113,0.05)' : 'rgba(255,255,255,0.03)'; }}
                            />
                            <button
                              type="button"
                              id="signup-toggle-password-btn"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              onClick={() => setShowPassword((p) => !p)}
                              style={{
                                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'rgba(235,235,235,0.4)', display: 'flex', alignItems: 'center',
                                transition: 'color 0.2s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#ccff00'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(235,235,235,0.4)'; }}
                            >
                              <IconEye show={showPassword} />
                            </button>
                          </div>
                          <PasswordStrength password={form.password} />
                        </FormField>

                        {/* Confirm Password */}
                        <FormField id="signup-confirm" label="Confirm Password" icon={<IconLock />} error={errors.confirm}>
                          <div style={{ position: 'relative' }}>
                            <span style={iconWrap}><IconLock /></span>
                            <input
                              id="signup-confirm"
                              type={showConfirm ? 'text' : 'password'}
                              autoComplete="new-password"
                              placeholder="Repeat your password"
                              value={form.confirm}
                              onChange={(e) => set('confirm', e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                              style={{
                                ...inputStyle('confirm'),
                                paddingRight: 44,
                                borderColor: !errors.confirm && form.confirm && form.confirm === form.password
                                  ? 'rgba(16,185,129,0.5)' : undefined,
                                boxShadow: !errors.confirm && form.confirm && form.confirm === form.password
                                  ? '0 0 0 3px rgba(16,185,129,0.12)' : undefined,
                              }}
                              onFocus={(e) => { e.target.style.borderColor = 'rgba(204,255,0,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(204,255,0,0.12)'; e.target.style.background = 'rgba(204,255,0,0.04)'; }}
                              onBlur={(e) => {
                                const match = form.confirm === form.password && form.confirm;
                                e.target.style.borderColor = errors.confirm ? 'rgba(248,113,113,0.5)' : match ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)';
                                e.target.style.boxShadow = match && !errors.confirm ? '0 0 0 3px rgba(16,185,129,0.12)' : 'none';
                                e.target.style.background = errors.confirm ? 'rgba(248,113,113,0.05)' : 'rgba(255,255,255,0.03)';
                              }}
                            />
                            <button
                              type="button"
                              id="signup-toggle-confirm-btn"
                              aria-label={showConfirm ? 'Hide password' : 'Show password'}
                              onClick={() => setShowConfirm((p) => !p)}
                              style={{
                                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'rgba(235,235,235,0.4)', display: 'flex', alignItems: 'center',
                                transition: 'color 0.2s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#ccff00'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(235,235,235,0.4)'; }}
                            >
                              <IconEye show={showConfirm} />
                            </button>
                            {!errors.confirm && form.confirm && form.confirm === form.password && (
                              <span style={{ position: 'absolute', right: 44, top: '50%', transform: 'translateY(-50%)', color: '#10b981', display: 'flex' }}>
                                <IconCheck />
                              </span>
                            )}
                          </div>
                        </FormField>

                        {/* Terms */}
                        <p style={{ fontSize: 12, color: 'rgba(235,235,235,0.35)', fontFamily: "'Space Grotesk', sans-serif", textAlign: 'center', lineHeight: 1.6 }}>
                          By creating an account you agree to our{' '}
                          <a href="#" style={{ color: '#ccff00', textDecoration: 'none' }}>Terms of Service</a>{' '}
                          and{' '}
                          <a href="#" style={{ color: '#ccff00', textDecoration: 'none' }}>Privacy Policy</a>
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 10 }}>
                          <button
                            id="signup-back-to-otp-btn"
                            type="button"
                            className="btn-secondary"
                            onClick={() => setStep(1)}
                            style={{ width: '100%', padding: '14px' }}
                          >
                            ← Back
                          </button>
                          <button
                            id="signup-submit-btn"
                            type="button"
                            className="btn-primary"
                            onClick={handleSubmit}
                            disabled={submitting}
                            style={{
                              width: '100%',
                              padding: '14px',
                              fontSize: 15,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 8,
                              opacity: submitting ? 0.8 : 1,
                            }}
                          >
                            {submitting ? (
                              <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
                                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                </svg>
                                Creating…
                              </>
                            ) : (
                              <>Create Account <IconArrow /></>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};

export default Signup;
