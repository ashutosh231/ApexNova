/**
 * Navbar — ApexNova × PillNav fusion
 *
 * Hash-link fix: Leaderboard & Contact use programmatic scrollIntoView()
 * called from onClick — the URL hash is NEVER changed, which prevents the
 * browser's native scroll-anchoring from locking the page position.
 */

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { gsap } from 'gsap';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ─── Nav items ─────────────────────────────────────────────── */
// scrollTarget: DOM id to scroll to (scroll-only, no URL hash)
// isRoute:     use React Router Link to go to href
const navLinks = [
  { label: 'Tournaments', href: '/tournaments', isRoute: true },
  { label: 'About Us',    href: '/about',       isRoute: true },
  { label: 'Leaderboard', href: '/leaderboard', isRoute: true },
  { label: 'Contact',     scrollTarget: 'contact' },
];

/* ─── Constants ─────────────────────────────────────────────── */
const LIME      = '#ccff00';
const PILL_BG   = 'rgba(255,255,255,0.07)';
const GSAP_EASE = 'power3.out';
const EASE_CSS  = 'cubic-bezier(0.4,0,0.2,1)';
const TR        = `0.35s ${EASE_CSS}`;

/* ─── Scroll helper ──────────────────────────────────────────── */
// Scrolls to a section by id without ever touching the URL.
// If we're not on the home page, navigate there first then scroll.
function scrollToSection(id, navigate, pathname) {
  const doScroll = () => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (pathname === '/') {
    doScroll();
  } else {
    navigate('/');
    // Wait for the home page to mount before scrolling
    setTimeout(doScroll, 120);
  }
}

/* ─── NavPill — one pill item with rising-circle GSAP hover ──── */
function NavPill({ link, index, pillH, onScrollClick }) {
  const pillRef   = useRef(null);
  const circleRef = useRef(null);
  const tlRef     = useRef(null);
  const tweenRef  = useRef(null);

  useEffect(() => {
    const pill   = pillRef.current;
    const circle = circleRef.current;
    if (!pill || !circle) return;

    const setup = () => {
      const { width: w, height: h } = pill.getBoundingClientRect();
      if (!w) return;

      const R       = ((w * w) / 4 + h * h) / (2 * h);
      const D       = Math.ceil(2 * R) + 2;
      const delta   = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
      const originY = D - delta;

      circle.style.width  = `${D}px`;
      circle.style.height = `${D}px`;
      circle.style.bottom = `-${delta}px`;

      gsap.set(circle, { xPercent: -50, scale: 0, transformOrigin: `50% ${originY}px` });

      const label = pill.querySelector('.pill-lbl');
      const hover = pill.querySelector('.pill-lbl-hover');

      if (label) gsap.set(label, { y: 0, opacity: 1 });
      if (hover) gsap.set(hover, { y: h + 12, opacity: 0 });

      tlRef.current?.kill();
      const tl = gsap.timeline({ paused: true });
      tl.to(circle, { scale: 1.25, xPercent: -50, duration: 0.7, ease: GSAP_EASE }, 0);
      if (label) tl.to(label, { y: -(h + 8), opacity: 0, duration: 0.5, ease: GSAP_EASE }, 0);
      if (hover) tl.to(hover, { y: 0, opacity: 1,       duration: 0.5, ease: GSAP_EASE }, 0);
      tlRef.current = tl;
    };

    setup();
    window.addEventListener('resize', setup, { passive: true });
    if (document.fonts) document.fonts.ready.then(setup).catch(() => {});
    return () => window.removeEventListener('resize', setup);
  }, []);

  const enter = () => {
    const tl = tlRef.current;
    if (!tl) return;
    tweenRef.current?.kill();
    tweenRef.current = tl.tweenTo(tl.duration(), { duration: 0.35, ease: GSAP_EASE, overwrite: 'auto' });
  };

  const leave = () => {
    const tl = tlRef.current;
    if (!tl) return;
    tweenRef.current?.kill();
    tweenRef.current = tl.tweenTo(0, { duration: 0.28, ease: GSAP_EASE, overwrite: 'auto' });
  };

  const inner = (
    <>
      <span ref={circleRef} aria-hidden="true" style={{
        position: 'absolute', left: '50%', bottom: 0,
        borderRadius: '50%', background: LIME, pointerEvents: 'none',
        zIndex: 1, willChange: 'transform',
      }} />
      <span style={{
        position: 'relative', display: 'inline-block',
        zIndex: 2, overflow: 'hidden', lineHeight: 1, padding: '2px 0',
      }}>
        <span className="pill-lbl" style={{
          display: 'block', willChange: 'transform, opacity',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13, fontWeight: 600,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          color: 'rgba(235,235,235,0.78)',
        }}>
          {link.label}
        </span>
        <span className="pill-lbl-hover" aria-hidden="true" style={{
          position: 'absolute', left: 0, top: 0, width: '100%', textAlign: 'center',
          willChange: 'transform, opacity',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13, fontWeight: 700,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          color: '#000',
        }}>
          {link.label}
        </span>
      </span>
    </>
  );

  const pillStyle = {
    position: 'relative', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center',
    height: pillH ?? 36, padding: '0 18px',
    borderRadius: 9999, background: PILL_BG,
    border: '1px solid rgba(255,255,255,0.12)',
    overflow: 'hidden', cursor: 'pointer',
    textDecoration: 'none', userSelect: 'none', WebkitUserSelect: 'none',
    transition: `border-color 0.2s ${EASE_CSS}`,
  };

  const sharedEvents = {
    ref: pillRef,
    onMouseEnter: enter,
    onMouseLeave: leave,
    'data-cursor': 'hover',
  };

  /* ── Scroll-only pills (Contact, Leaderboard) ── */
  if (link.scrollTarget) {
    return (
      <button
        type="button"
        style={{ ...pillStyle, font: 'inherit' }}
        onClick={() => onScrollClick(link.scrollTarget)}
        {...sharedEvents}
      >
        {inner}
      </button>
    );
  }

  /* ── Route pills ── */
  return (
    <Link to={link.href} style={pillStyle} {...sharedEvents}>
      {inner}
    </Link>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────── */
const Navbar = ({ onGetStarted, onSignIn }) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const reduced   = useReducedMotion();
  const MotionDiv = useMemo(() => motion.div, []);
  const MotionA   = useMemo(() => motion.a, []);
  const navigate  = useNavigate();
  const { pathname } = useLocation();
  const dropdownRef = useRef(null);

  /* ── Close dropdown when clicking outside ── */
  useEffect(() => {
    const clickOut = (e) => {
      if (profileOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, [profileOpen]);

  const logoIconRef = useRef(null);
  const logoTween   = useRef(null);
  const pillsWrapRef = useRef(null);

  /* ── Scroll shrink at 100px ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Escape closes mobile menu ── */
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  /* ── Entrance stagger ── */
  useEffect(() => {
    if (reduced || !pillsWrapRef.current) return;
    const pills = pillsWrapRef.current.querySelectorAll('a, button');
    gsap.set(pills, { opacity: 0, y: -10 });
    gsap.to(pills, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.06, delay: 0.3 });
  }, [reduced]);

  /* ── Logo spin ── */
  const handleLogoEnter = () => {
    if (!logoIconRef.current) return;
    logoTween.current?.kill();
    logoTween.current = gsap.to(logoIconRef.current, {
      rotate: 360, duration: 0.75, ease: 'elastic.out(1, 0.55)',
      overwrite: 'auto',
      onComplete: () => gsap.set(logoIconRef.current, { rotate: 0 }),
    });
  };

  /* ── Section scroll (never modifies URL) ── */
  const handleScrollNav = (sectionId) => {
    setMobileOpen(false);
    scrollToSection(sectionId, navigate, pathname);
  };

  const t = reduced ? 'none' : TR;

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: scrolled ? '10px 24px' : '20px 24px 0',
      background:           scrolled ? 'rgba(10,10,10,0.82)' : 'transparent',
      backdropFilter:       scrolled ? 'blur(22px) saturate(1.4)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(22px) saturate(1.4)' : 'none',
      borderBottom:  scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
      boxShadow:     scrolled ? '0 4px 28px rgba(0,0,0,0.55)' : 'none',
      transition: t === 'none' ? 'none'
        : `padding ${TR}, background ${TR}, backdrop-filter ${TR}, -webkit-backdrop-filter ${TR}, border-color ${TR}, box-shadow ${TR}`,
    }}>
      <motion.nav
        style={{
          maxWidth: 1520, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center', gap: 20,
        }}
        initial={reduced ? false : { y: -12, opacity: 0 }}
        animate={reduced ? undefined : { y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* ── Logo ── */}
        <Link
          to="/"
          data-cursor="hover"
          onMouseEnter={handleLogoEnter}
          style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}
        >
          <div ref={logoIconRef} style={{
            width: scrolled ? 36 : 44, height: scrolled ? 36 : 44,
            background: LIME, borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: scrolled ? 15 : 18, fontWeight: 800, color: '#000',
            fontFamily: "'Space Grotesk', sans-serif",
            boxShadow: '0 0 28px rgba(204,255,0,0.28)',
            transition: `${t}, font-size ${t}`, willChange: 'transform',
          }}>
            A
          </div>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
            fontSize: scrolled ? 17 : 20, letterSpacing: '-0.06em', color: '#ebebeb',
            transition: `font-size ${t}`,
          }}>
            Apex<span className="gradient-text-static">Nova</span>
          </span>
        </Link>

        {/* ── Desktop pill nav ── */}
        <div
          ref={pillsWrapRef}
          className="nav-desktop"
          style={{
            justifySelf: 'center', display: 'flex', gap: 6, alignItems: 'center',
            padding: scrolled ? '5px 8px' : '8px 10px',
            borderRadius: 9999,
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.09)',
            maxWidth: 'fit-content',
            transition: `padding ${t}`,
          }}
        >
          {navLinks.map((link, i) => (
            <NavPill
              key={link.label}
              link={link}
              index={i}
              pillH={scrolled ? 32 : 36}
              onScrollClick={handleScrollNav}
            />
          ))}
        </div>

        {/* ── Right actions ── */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', justifySelf: 'end' }}>
          <div className="font-mono-tech"
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(235,235,235,0.55)' }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: LIME, animation: 'pulse-dot 2s infinite',
            }} />
            SYS · OK
          </div>
          
          {user ? (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '4px 12px 4px 4px', borderRadius: 9999,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(204,255,0,0.3)',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 9999,
                  background: user.avatar_url ? 'transparent' : LIME, color: '#000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif",
                  overflow: 'hidden',
                }}>
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user.name ? user.name.charAt(0).toUpperCase() : 'U'
                  )}
                </div>
                <span style={{ color: '#ebebeb', fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {user.name}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#ebebeb', transition: 'transform 0.2s', transform: profileOpen ? 'rotate(180deg)' : 'none' }}><path d="M6 9l6 6 6-6"/></svg>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(5px)' }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 12px)', right: 0,
                      width: 240, padding: 8,
                      background: 'linear-gradient(145deg, rgba(20,20,20,0.95) 0%, rgba(10,10,10,0.98) 100%)',
                      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                      borderRadius: '1.5rem',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 20px 40px -10px rgba(0,0,0,0.8), 0 0 0 1px rgba(204,255,0,0.1)',
                      overflow: 'hidden',
                      zIndex: 1000
                    }}
                  >
                    {/* Header info */}
                    <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 8, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 11, color: 'rgba(235,235,235,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>Signed in as</span>
                      <span style={{ fontSize: 14, color: '#ebebeb', fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</span>
                    </div>

                    <button type="button" onClick={() => { setProfileOpen(false); navigate('/profile'); }} style={{ width: '100%', padding: '12px 14px', background: 'transparent', border: 'none', color: '#ebebeb', textAlign: 'left', fontSize: 14, fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s ease' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#ccff00'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ebebeb'; }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      User Profile
                    </button>
                    
                    <button type="button" onClick={() => { setProfileOpen(false); navigate('/profile?tab=settings'); }} style={{ width: '100%', padding: '12px 14px', background: 'transparent', border: 'none', color: '#ebebeb', textAlign: 'left', fontSize: 14, fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s ease' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#ccff00'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ebebeb'; }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                      Account Settings
                    </button>

                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 8px' }} />

                    <button type="button" onClick={() => { setProfileOpen(false); logout(); }} style={{ width: '100%', padding: '12px 14px', background: 'transparent', border: 'none', color: '#f87171', textAlign: 'left', fontSize: 14, fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s ease' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                      Logout Session
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <button type="button" id="navbar-signin-btn" data-cursor="hover"
                className="btn-secondary nav-signin-btn" onClick={onSignIn}
                style={{ padding: scrolled ? '7px 16px' : '9px 20px', fontSize: 13, transition: `padding ${t}` }}>
                Sign in
              </button>
              <button type="button" id="navbar-get-started-btn" data-cursor="hover"
                className="btn-primary" onClick={onGetStarted}
                style={{ padding: scrolled ? '8px 18px' : '10px 22px', fontSize: 13, transition: `padding ${t}` }}>
                Get Started
              </button>
            </>
          )}
          <button type="button" data-cursor="hover" aria-label="Open menu"
            onClick={() => setMobileOpen(v => !v)}
            className="nav-menu-btn glass"
            style={{
              width: 44, height: 44, borderRadius: 9999,
              color: 'rgba(255,255,255,0.9)',
              display: 'none', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </motion.nav>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <MotionDiv
            initial={reduced ? false : { opacity: 0 }}
            animate={reduced ? undefined : { opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'fixed', inset: 0, zIndex: 99,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
            }}
            onClick={() => setMobileOpen(false)}
          >
            <MotionDiv
              initial={reduced ? false : { y: -10, opacity: 0, scale: 0.97 }}
              animate={reduced ? undefined : { y: 0, opacity: 1, scale: 1 }}
              exit={reduced ? undefined : { y: -10, opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="glass-strong"
              onClick={e => e.stopPropagation()}
              style={{
                maxWidth: 520, margin: '100px auto 0',
                borderRadius: '2rem', padding: 18,
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, letterSpacing: '-0.04em', color: '#ebebeb' }}>
                  Menu
                </div>
                <button type="button" data-cursor="hover" aria-label="Close menu"
                  onClick={() => setMobileOpen(false)} className="glass"
                  style={{
                    width: 44, height: 44, borderRadius: 9999,
                    color: 'rgba(255,255,255,0.9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div style={{ display: 'grid', gap: 10, padding: '8px 4px 14px' }}>
                {navLinks.map((l, i) => {
                  const sharedStyle = {
                    textDecoration: 'none', padding: '14px 16px',
                    borderRadius: '1.25rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(235,235,235,0.85)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif",
                    width: '100%', cursor: 'pointer',
                  };

                  const arrow = <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>;

                  return (
                    <motion.div
                      key={l.label}
                      initial={reduced ? false : { opacity: 0, y: 10 }}
                      animate={reduced ? undefined : { opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.04 + i * 0.04 }}
                    >
                      {l.scrollTarget ? (
                        <button
                          type="button"
                          data-cursor="hover"
                          onClick={() => handleScrollNav(l.scrollTarget)}
                          style={{ ...sharedStyle, font: 'inherit' }}
                        >
                          <span>{l.label}</span>
                          {arrow}
                        </button>
                      ) : (
                        <Link
                          to={l.href}
                          data-cursor="hover"
                          onClick={() => setMobileOpen(false)}
                          style={sharedStyle}
                        >
                          <span>{l.label}</span>
                          {arrow}
                        </Link>
                      )}
                    </motion.div>
                  );
                })}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                  {user ? (
                    <>
                      <button type="button" className="btn-secondary" onClick={() => { setMobileOpen(false); navigate('/profile'); }} style={{ width: '100%' }}>Profile</button>
                      <button type="button" className="btn-secondary" onClick={() => { setMobileOpen(false); logout(); }} style={{ width: '100%', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}>Logout</button>
                    </>
                  ) : (
                    <>
                      <button type="button" id="navbar-mobile-signin-btn" data-cursor="hover"
                        className="btn-secondary" onClick={onSignIn} style={{ width: '100%' }}>
                        Sign in
                      </button>
                      <button type="button" id="navbar-mobile-get-started-btn" data-cursor="hover"
                        className="btn-primary" onClick={onGetStarted} style={{ width: '100%' }}>
                        Get Started
                      </button>
                    </>
                  )}
                </div>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 980px) {
          .nav-desktop    { display: none !important; }
          .nav-menu-btn   { display: inline-flex !important; }
          .nav-signin-btn { display: none !important; }
        }
        @media (max-width: 520px) {
          header nav { grid-template-columns: 1fr auto !important; }
          header nav > a span:last-child { display: none; }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
