import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ─── Constants ─── */
const ICON_SET = [
  '❤️', '⭐', '⚡', '🛡️', '💎', '☁️', '☀️', '🌙',
  '🔥', '💧', '⚓', '🔗', '🎯', '🎵', '🍀', '🦋',
  '🌸', '🎲',
];

const CONFIGS = {
  easy:   { pairs: 2,  cols: 2 },
  normal: { pairs: 8,  cols: 4 },
  hard:   { pairs: 12, cols: 6 },
};

const NEON_PINK = '#ff00ff';
const NEON_CYAN = '#00ffff';
const NEON_GREEN = '#39ff14';

/* ─── Card Component ─── */
const MemoryCard = ({ icon, flipped, matched, onClick, disabled }) => {
  return (
    <div
      onClick={() => !disabled && !flipped && !matched && onClick()}
      style={{
        perspective: '1000px',
        cursor: disabled || flipped || matched ? 'default' : 'pointer',
        width: '100%',
        aspectRatio: '1',
      }}
    >
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.5s ease',
        transform: flipped || matched ? 'rotateY(180deg)' : 'rotateY(0)',
      }}>
        {/* Front — face down */}
        <div style={{
          backfaceVisibility: 'hidden',
          position: 'absolute', width: '100%', height: '100%',
          background: 'rgba(15,23,42,0.95)',
          border: '2px solid rgba(100,116,139,0.4)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, color: 'rgba(100,116,139,0.5)',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={e => { if (!flipped && !matched && !disabled) e.currentTarget.style.borderColor = NEON_CYAN; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(100,116,139,0.4)'; }}
        >
          ?
        </div>
        {/* Back — face up */}
        <div style={{
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          position: 'absolute', width: '100%', height: '100%',
          background: matched ? 'rgba(57,255,20,0.08)' : 'rgba(0,0,0,0.9)',
          border: `3px solid ${matched ? NEON_GREEN : NEON_PINK}`,
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36,
          boxShadow: matched ? `0 0 20px ${NEON_GREEN}40` : `0 0 15px ${NEON_PINK}30`,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
};

/* ─── Main PixelMemoryGame Component ─── */
const PixelMemoryGame = ({ onGameOver, playerName = 'You', autoStart = false, allowRestart = true }) => {
  const [difficulty, setDifficulty] = useState('normal');
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameState, setGameState] = useState('idle'); // idle | countdown | playing | won
  const [countdown, setCountdown] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [scorePopup, setScorePopup] = useState(null);
  const timerRef = useRef(null);

  const config = CONFIGS[difficulty];
  const totalPairs = config.pairs;

  /* ── Init cards ── */
  const initCards = useCallback((diff) => {
    const cfg = CONFIGS[diff];
    const icons = ICON_SET.slice(0, cfg.pairs);
    const deck = [...icons, ...icons]
      .sort(() => Math.random() - 0.5)
      .map((icon, i) => ({ id: i, icon }));
    setCards(deck);
    setFlippedIndices([]);
    setMatchedPairs(new Set());
    setMoves(0);
    setScore(0);
    setTimer(0);
    setIsLocked(false);
    setScorePopup(null);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  /* ── Start game ── */
  const startGame = useCallback(() => {
    initCards(difficulty);
    setGameState('playing');
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
  }, [difficulty, initCards]);

  /* ── Run countdown then start ── */
  const runCountdown = useCallback(() => {
    initCards(difficulty);
    setGameState('countdown');
    setCountdown(3);
    let n = 3;
    const iv = setInterval(() => {
      n--;
      if (n === 0) {
        clearInterval(iv);
        setCountdown(null);
        startGame();
      } else {
        setCountdown(n);
      }
    }, 1000);
  }, [difficulty, initCards, startGame]);

  /* ── Auto start ── */
  useEffect(() => {
    if (autoStart) runCountdown();
  }, [autoStart, runCountdown]);

  /* ── Cleanup timer ── */
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  /* ── Card click ── */
  const handleCardClick = useCallback((index) => {
    if (isLocked || gameState !== 'playing') return;
    if (flippedIndices.includes(index) || matchedPairs.has(cards[index]?.icon)) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      setMoves(m => m + 1);
      const [first, second] = newFlipped;

      if (cards[first].icon === cards[second].icon) {
        // Match!
        const points = 500 + Math.max(0, 30 - (moves + 1)) * 10;
        setScore(s => s + points);
        setScorePopup({ points, key: Date.now() });
        setTimeout(() => setScorePopup(null), 800);

        setMatchedPairs(prev => {
          const next = new Set(prev);
          next.add(cards[first].icon);
          return next;
        });
        setFlippedIndices([]);
        setIsLocked(false);

        // Check win
        if (matchedPairs.size + 1 === totalPairs) {
          if (timerRef.current) clearInterval(timerRef.current);
          const finalScore = score + points;
          setGameState('won');
          if (onGameOver) {
            setTimeout(() => onGameOver(finalScore), 600);
          }
        }
      } else {
        // No match
        setTimeout(() => {
          setFlippedIndices([]);
          setIsLocked(false);
        }, 900);
      }
    }
  }, [isLocked, gameState, flippedIndices, matchedPairs, cards, moves, totalPairs, score, onGameOver]);

  /* ── Hint ── */
  const handleHint = useCallback(() => {
    if (isLocked || gameState !== 'playing') return;
    const unmatched = cards.filter(c => !matchedPairs.has(c.icon));
    if (unmatched.length < 2) return;

    setIsLocked(true);
    const first = unmatched[0];
    const match = unmatched.find(c => c.id !== first.id && c.icon === first.icon);
    if (match) {
      setFlippedIndices([first.id, match.id]);
      setTimeout(() => {
        setFlippedIndices([]);
        setIsLocked(false);
      }, 1000);
    } else {
      setIsLocked(false);
    }
  }, [isLocked, gameState, cards, matchedPairs]);

  /* ── Difficulty change ── */
  const changeDifficulty = (diff) => {
    if (gameState === 'playing') return;
    setDifficulty(diff);
    initCards(diff);
    setGameState('idle');
  };

  const fmtTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const W = Math.min(640, typeof window !== 'undefined' ? window.innerWidth - 48 : 640);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 700 }}>
      {/* ── Retro Header ── */}
      <div style={{
        width: '100%',
        background: 'rgba(0,0,0,0.8)',
        boxShadow: `0 -3px 0 0 #fff, 0 3px 0 0 #fff, -3px 0 0 0 #fff, 3px 0 0 0 #fff`,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{
            fontFamily: "'Press Start 2P', 'VT323', monospace",
            fontSize: 16, color: '#fff',
            textShadow: `2px 2px 0px ${NEON_PINK}`,
            letterSpacing: -1,
          }}>PIXEL MEMORY</div>
          <div style={{
            fontSize: 11, color: NEON_CYAN, letterSpacing: '0.2em',
            textTransform: 'uppercase', fontWeight: 700, marginTop: 2,
          }}>Ultra Edition</div>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: NEON_GREEN, textTransform: 'uppercase', marginBottom: 2 }}>Score</div>
            <div style={{ fontFamily: 'monospace', fontSize: 22, color: '#fff', fontWeight: 700 }}>
              {score.toString().padStart(6, '0')}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#facc15', textTransform: 'uppercase', marginBottom: 2 }}>Timer</div>
            <div style={{ fontFamily: 'monospace', fontSize: 22, color: '#fff', fontWeight: 700 }}>
              {fmtTime(timer)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: NEON_PINK, textTransform: 'uppercase', marginBottom: 2 }}>Moves</div>
            <div style={{ fontFamily: 'monospace', fontSize: 22, color: '#fff', fontWeight: 700 }}>
              {moves.toString().padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>

      {/* ── Player name ── */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{playerName}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          Matched: {matchedPairs.size}/{totalPairs}
        </div>
      </div>

      {/* ── Game Grid ── */}
      <div style={{
        position: 'relative', width: '100%',
        boxShadow: `0 -3px 0 0 ${NEON_CYAN}, 0 3px 0 0 ${NEON_CYAN}, -3px 0 0 0 ${NEON_CYAN}, 3px 0 0 0 ${NEON_CYAN}, 0 0 15px ${NEON_CYAN}`,
        background: 'rgba(0,0,0,0.6)',
        padding: 12,
        borderRadius: 4,
      }}>
        {/* Scanlines overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
          background: 'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.2) 50%)',
          backgroundSize: '100% 4px',
        }} />

        {/* Score popup */}
        {scorePopup && (
          <div key={scorePopup.key} style={{
            position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
            fontSize: 28, fontWeight: 900, color: NEON_GREEN,
            fontFamily: "'Press Start 2P', monospace",
            textShadow: `0 0 20px ${NEON_GREEN}`,
            zIndex: 20, pointerEvents: 'none',
            animation: 'scorePop 0.8s ease-out forwards',
          }}>+{scorePopup.points}</div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
          gap: 10,
          position: 'relative', zIndex: 1,
        }}>
          {cards.map((card, idx) => (
            <MemoryCard
              key={card.id}
              icon={card.icon}
              flipped={flippedIndices.includes(idx)}
              matched={matchedPairs.has(card.icon)}
              onClick={() => handleCardClick(idx)}
              disabled={isLocked || gameState !== 'playing'}
            />
          ))}
        </div>

        {/* Countdown overlay */}
        {countdown !== null && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 30,
            background: 'rgba(6,6,8,0.88)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
            borderRadius: 4,
          }}>
            <div style={{ fontSize: 13, color: NEON_CYAN, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Get Ready</div>
            <div style={{
              fontSize: 96, fontWeight: 900, color: NEON_CYAN, lineHeight: 1,
              textShadow: `0 0 60px ${NEON_CYAN}80`,
            }}>{countdown}</div>
          </div>
        )}

        {/* Idle overlay */}
        {gameState === 'idle' && countdown === null && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 30,
            background: 'rgba(6,6,8,0.78)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
            borderRadius: 4,
          }}>
            <div style={{ fontSize: 48 }}>🧩</div>
            <button onClick={runCountdown} style={{
              background: NEON_GREEN, color: '#000', border: 'none', borderRadius: 8,
              padding: '12px 32px', fontSize: 14, fontWeight: 800, cursor: 'pointer',
              fontFamily: "'Press Start 2P', monospace",
              boxShadow: `0 0 30px ${NEON_GREEN}55`,
              textTransform: 'uppercase',
            }}>Start Game</button>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Click cards to find matching pairs</div>
          </div>
        )}

        {/* Won overlay */}
        {gameState === 'won' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 30,
            background: 'rgba(6,6,8,0.88)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
            borderRadius: 4,
          }}>
            <div style={{ fontSize: 40 }}>🏆</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: "'Press Start 2P', monospace" }}>MISSION COMPLETE</div>
            <div style={{
              fontSize: 32, fontWeight: 900, color: NEON_GREEN,
              fontFamily: 'monospace', textShadow: `0 0 20px ${NEON_GREEN}60`,
            }}>{score.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              {moves} moves · {fmtTime(timer)}
            </div>
            {allowRestart && (
              <button onClick={runCountdown} style={{
                background: 'rgba(255,255,255,0.08)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                padding: '8px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 4,
              }}>Play Again</button>
            )}
            {!allowRestart && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
                Waiting for match to conclude...
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Completionist</span>
          <span style={{ fontSize: 10, color: NEON_GREEN, fontWeight: 700 }}>{matchedPairs.size}/{totalPairs}</span>
        </div>
        <div style={{ height: 4, width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: `${totalPairs > 0 ? (matchedPairs.size / totalPairs) * 100 : 0}%`,
            background: NEON_GREEN,
            transition: 'width 0.4s ease',
            boxShadow: `0 0 8px ${NEON_GREEN}60`,
          }} />
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Click to flip · Match all pairs · Fewer moves = higher score</div>

      {/* Keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
        @keyframes scorePop {
          0% { transform: translate(-50%,-50%) scale(1); opacity: 0; }
          50% { transform: translate(-50%,-50%) scale(1.5); opacity: 1; }
          100% { transform: translate(-50%,-50%) scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default PixelMemoryGame;
