import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMatch } from '../context/MatchContext';

const LIME   = '#ccff00';
const GREEN  = '#10b981';
const PURPLE = '#a855f7';
const ROSE   = '#f43f5e';
const GOLD   = '#fbbf24';
const CYAN   = '#22d3ee';
const font   = { head: "'Space Grotesk', sans-serif", mono: "'JetBrains Mono', monospace" };

const rankColors = ['#fbbf24', '#94a3b8', '#b45309'];

const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
};

/* ── Confetti Particle ── */
const Confetti = () => (
  <>
    {[...Array(18)].map((_, i) => (
      <motion.div key={i}
        initial={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
        animate={{
          opacity: [1, 1, 0],
          y: [-20, -Math.random() * 260 - 60],
          x: [(Math.random() - 0.5) * 500],
          rotate: [0, (Math.random() - 0.5) * 720],
        }}
        transition={{ duration: 2.5 + Math.random(), ease: 'easeOut', delay: i * 0.08 }}
        style={{
          position: 'absolute',
          width: 10, height: 10,
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          background: [LIME, GREEN, CYAN, PURPLE, GOLD][i % 5],
          left: '50%', top: '40%',
          pointerEvents: 'none',
        }}
      />
    ))}
  </>
);

/* ── Rank Row ── */
const RankRow = ({ player, index }) => {
  const isPlayer = player.isPlayer;
  const isWinner = player.rank === 1;
  const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.1, type: 'spring', stiffness: 200 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 20px', borderRadius: '1rem',
        background: isPlayer
          ? `${LIME}10`
          : isWinner ? `${GOLD}08` : 'rgba(255,255,255,0.02)',
        border: isPlayer
          ? `1px solid ${LIME}30`
          : isWinner ? `1px solid ${GOLD}25` : '1px solid rgba(255,255,255,0.05)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {isWinner && (
        <motion.div
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse at left, ${GOLD}10, transparent 60%)`,
          }}
        />
      )}

      {/* Rank */}
      <div style={{ fontFamily: font.mono, fontSize: 16, fontWeight: 900, width: 36, textAlign: 'center', color: index < 3 ? rankColors[index] : 'rgba(255,255,255,0.3)' }}>
        {medal || `#${player.rank}`}
      </div>

      {/* Avatar */}
      <motion.div
        animate={isWinner ? { boxShadow: [`0 0 15px ${player.color}40`, `0 0 30px ${player.color}60`, `0 0 15px ${player.color}40`] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          width: 42, height: 42, borderRadius: '50%',
          background: `linear-gradient(135deg, ${player.color}, ${player.color}60)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 900, color: '#fff', fontFamily: font.head,
          border: `2px solid ${player.color}40`, flexShrink: 0,
        }}
      >
        {player.name.charAt(0)}
      </motion.div>

      {/* Name */}
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: font.head, fontSize: 15, fontWeight: 800, color: isPlayer ? LIME : '#ebebeb', display: 'flex', alignItems: 'center', gap: 8 }}>
          {isPlayer ? 'You' : player.name}
          {isWinner && <span style={{ fontFamily: font.mono, fontSize: 9, fontWeight: 700, color: GOLD, background: `${GOLD}15`, border: `1px solid ${GOLD}30`, padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase' }}>Winner</span>}
        </div>
        <div style={{ fontFamily: font.mono, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
          {player.score.toLocaleString()} pts
        </div>
      </div>

      {/* Points delta */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 + index * 0.1, type: 'spring', stiffness: 300 }}
        style={{
          fontFamily: font.mono, fontSize: 15, fontWeight: 800,
          color: player.pointsDelta?.startsWith('+') ? GREEN : ROSE,
          background: player.pointsDelta?.startsWith('+') ? `${GREEN}15` : `${ROSE}15`,
          border: `1px solid ${player.pointsDelta?.startsWith('+') ? `${GREEN}30` : `${ROSE}30`}`,
          borderRadius: 10, padding: '6px 14px',
        }}
      >
        {player.pointsDelta} RP
      </motion.div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════
   POST MATCH RESULT SCREEN
═══════════════════════════════════════════ */
const PostMatchResult = () => {
  const { phase, matchResult, playAgain, returnToLobby, gameType } = useMatch();

  if (phase !== 'POST_MATCH' || !matchResult) return null;

  const { players, winner } = matchResult;
  const playerResult = players.find(p => p.isPlayer);
  const playerWon = playerResult?.rank === 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(6,6,8,0.96)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '20px', overflow: 'hidden',
        }}
      >
        {/* Confetti for winner */}
        {playerWon && <Confetti />}

        {/* Winner glow background */}
        {playerWon && (
          <motion.div
            animate={{ opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{
              position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 600, height: 400, borderRadius: '50%',
              background: `radial-gradient(ellipse, ${LIME}25, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
        )}

        <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 28, position: 'relative', zIndex: 1 }}>

          {/* Result Banner */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            style={{ textAlign: 'center' }}
          >
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ fontSize: playerWon ? 64 : 48, lineHeight: 1, marginBottom: 12 }}
            >
              {playerWon ? '🏆' : '💀'}
            </motion.div>
            <div style={{
              fontFamily: font.head, fontSize: playerWon ? 42 : 32, fontWeight: 900,
              color: playerWon ? LIME : '#ebebeb', letterSpacing: '-0.04em',
              lineHeight: 1, marginBottom: 6,
              textShadow: playerWon ? `0 0 40px ${LIME}50` : 'none',
            }}>
              {playerWon ? 'Victory!' : 'Match Over'}
            </div>
            <div style={{ fontFamily: font.mono, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
              {playerWon
                ? `You dominated! +25 RP earned.`
                : `${winner.name} wins. Better luck next time.`}
            </div>
          </motion.div>

          {/* Rankings */}
          <div style={{ ...glass, borderRadius: '1.5rem', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontFamily: font.mono, fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Final Rankings
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {players.map((p, i) => <RankRow key={p.id ?? i} player={p} index={i} />)}
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Your Score', value: playerResult?.score?.toLocaleString() || '—' },
              { label: 'RP Change',  value: playerResult?.pointsDelta || '—', color: playerResult?.pointsDelta?.startsWith('+') ? GREEN : ROSE },
              { label: 'New Rank',   value: `#${(7 + (playerWon ? -1 : 1))}` },
            ].map(s => (
              <div key={s.label} style={{ ...glass, borderRadius: '1rem', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontFamily: font.mono, fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: font.head, fontSize: 18, fontWeight: 800, color: s.color || '#fff' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={returnToLobby}
              style={{
                flex: 1, padding: '14px', borderRadius: '1rem',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#ebebeb', fontFamily: font.head, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              ← Return to Lobby
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={playAgain}
              style={{
                flex: 1, padding: '14px', borderRadius: '1rem', border: 'none',
                background: `linear-gradient(135deg, ${LIME}, ${GREEN})`,
                color: '#000', fontFamily: font.head, fontSize: 15, fontWeight: 800, cursor: 'pointer',
                boxShadow: `0 8px 30px ${LIME}30`,
              }}
            >
              Play Again →
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PostMatchResult;
