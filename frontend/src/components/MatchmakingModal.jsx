import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';

const LIME   = '#ccff00';
const GREEN  = '#10b981';
const PURPLE = '#a855f7';
const ROSE   = '#f43f5e';
const font   = { head: "'Space Grotesk', sans-serif", mono: "'JetBrains Mono', monospace" };

/* ── Radar pulse animation ── */
const RadarPulse = ({ color = LIME }) => (
  <div style={{ position: 'relative', width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {[0, 1, 2].map(i => (
      <motion.div key={i}
        animate={{ scale: [0.3, 2], opacity: [0.6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
        style={{
          position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
          border: `2px solid ${color}`,
        }}
      />
    ))}
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      style={{
        width: 80, height: 80, borderRadius: '50%',
        border: `2px solid ${color}30`,
        borderTopColor: color,
        position: 'absolute',
      }}
    />
    <div style={{
      width: 56, height: 56, borderRadius: '50%',
      background: `${color}15`, border: `2px solid ${color}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 24,
    }}>
      🌍
    </div>
  </div>
);

/* ── Player Found Card ── */
const FoundCard = ({ player, isPlayer = false, delay = 0 }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 250, damping: 20, delay }}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    }}
  >
    <motion.div
      animate={{ boxShadow: [`0 0 20px ${player.color}40`, `0 0 40px ${player.color}60`, `0 0 20px ${player.color}40`] }}
      transition={{ duration: 2, repeat: Infinity }}
      style={{
        width: 70, height: 70, borderRadius: '50%',
        background: `linear-gradient(135deg, ${player.color}, ${player.color}60)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, fontWeight: 900, color: '#fff',
        fontFamily: font.head, border: `3px solid ${player.color}60`,
      }}
    >
      {player.name.charAt(0)}
    </motion.div>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: font.head, fontSize: 14, fontWeight: 700, color: '#fff' }}>
        {isPlayer ? 'You' : player.name}
      </div>
      <div style={{ fontFamily: font.mono, fontSize: 10, color: isPlayer ? LIME : 'rgba(255,255,255,0.4)' }}>
        Rank #{player.rank || '?'}
      </div>
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════
   MATCHMAKING MODAL / FLOW OVERLAY
═══════════════════════════════════════════ */
const MatchmakingModal = () => {
  const { phase, opponents, matchType, leaveMatch, MATCH_TYPES } = useMatch();
  const navigate = useNavigate();
  const [dots, setDots] = useState('.');

  const visible = phase === 'SEARCHING' || phase === 'MATCH_FOUND';

  /* Animated dots */
  useEffect(() => {
    if (phase !== 'SEARCHING') return;
    const iv = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500);
    return () => clearInterval(iv);
  }, [phase]);

  /* Navigate to match room when match is found */
  useEffect(() => {
    if (phase === 'IN_ROOM') {
      navigate('/match-room');
    }
  }, [phase, navigate]);

  if (!visible) return null;

  const modeLabel = MATCH_TYPES[matchType]?.label || 'Match';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(6,6,8,0.92)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 0,
        }}
      >
        {/* ── SEARCHING ── */}
        {phase === 'SEARCHING' && (
          <motion.div
            key="searching"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}
          >
            <RadarPulse color={LIME} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: font.head, fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 8 }}>
                Finding Opponents{dots}
              </div>
              <div style={{ fontFamily: font.mono, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                {modeLabel} · Auto-matchmaking active
              </div>
            </div>

            {/* Live stats while searching */}
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                { label: 'Players Searching', value: '1,247' },
                { label: 'Avg Wait Time', value: '~3s' },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '1rem', padding: '14px 24px', textAlign: 'center',
                }}>
                  <div style={{ fontFamily: font.mono, fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: font.head, fontSize: 20, fontWeight: 800, color: LIME }}>{s.value}</div>
                </div>
              ))}
            </div>

            <button onClick={leaveMatch} style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.5)', borderRadius: 999, padding: '10px 28px',
              fontFamily: font.head, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${ROSE}50`; e.currentTarget.style.color = ROSE; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            >
              Cancel Search
            </button>
          </motion.div>
        )}

        {/* ── MATCH FOUND ── */}
        {phase === 'MATCH_FOUND' && (
          <motion.div
            key="found"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36 }}
          >
            {/* Match Found banner */}
            <motion.div
              animate={{ boxShadow: [`0 0 30px ${GREEN}30`, `0 0 60px ${GREEN}50`, `0 0 30px ${GREEN}30`] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                background: `${GREEN}18`, border: `1px solid ${GREEN}40`,
                borderRadius: '1rem', padding: '12px 32px',
                fontFamily: font.mono, fontSize: 14, fontWeight: 800, color: GREEN,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>⚡</motion.div>
              Match Found!
            </motion.div>

            {/* Players vs Players */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
              {/* You */}
              <FoundCard player={{ name: 'You', rank: 7, color: LIME }} isPlayer delay={0} />

              {/* VS dividers + opponents */}
              {opponents.map((opp, i) => (
                <React.Fragment key={opp.id}>
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + i * 0.3 }}
                    style={{ fontFamily: font.head, fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,0.3)' }}
                  >
                    VS
                  </motion.div>
                  <FoundCard player={opp} delay={0.4 + i * 0.3} />
                </React.Fragment>
              ))}
            </div>

            <div style={{ fontFamily: font.mono, fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
              Entering match room…
            </div>

            {/* Countdown line */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 280 }}
              transition={{ duration: 2, ease: 'linear' }}
              style={{ height: 2, background: `linear-gradient(90deg, ${GREEN}, ${LIME})`, borderRadius: 999 }}
            />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default MatchmakingModal;
