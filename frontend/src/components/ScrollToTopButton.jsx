import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="scroll-top-btn"
          type="button"
          aria-label="Scroll to top"
          data-cursor="hover"
          onClick={scrollTop}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          initial={{ opacity: 0, y: 24, scale: 0.85 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{    opacity: 0, y: 24, scale: 0.85 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            /* ── Position ── */
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 999,

            /* ── Size ── */
            width:  52,
            height: 52,
            borderRadius: '50%',

            /* ── Colours – lime fill on hover, glass at rest ── */
            background: hovered
              ? '#ccff00'
              : 'rgba(20,20,20,0.72)',
            border: hovered
              ? '1px solid #ccff00'
              : '1px solid rgba(255,255,255,0.14)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: hovered
              ? '0 0 28px rgba(204,255,0,0.45), 0 8px 24px rgba(0,0,0,0.5)'
              : '0 4px 20px rgba(0,0,0,0.45)',

            /* ── Layout ── */
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',

            /* ── Transition ── */
            transition:
              'background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
          }}
        >
          {/* Animated arrow — slides slightly upward on hover */}
          <motion.svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={hovered ? '#000' : '#ccff00'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ y: hovered ? -2 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
          </motion.svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTopButton;
