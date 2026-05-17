import React, { useState, useCallback, useRef } from 'react';

const EMPTY = '';
const MONO = "'JetBrains Mono', monospace";

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function lineWin(board, p) {
  return LINES.some(([a, b, c]) => board[a] === p && board[b] === p && board[c] === p);
}

function winningLine(board, p) {
  return LINES.find(([a, b, c]) => board[a] === p && board[b] === p && board[c] === p) || null;
}

function aiMove(board) {
  const pick = (sym) => {
    for (const [a, b, c] of LINES) {
      const cells = [a, b, c];
      if (cells.filter((i) => board[i] === sym).length === 2 && cells.some((i) => board[i] === EMPTY))
        return cells.find((i) => board[i] === EMPTY);
    }
    return null;
  };
  let i = pick('O');
  if (i == null) i = pick('X');
  if (i != null) return i;
  const order = [4, 0, 2, 6, 8, 1, 3, 5, 7];
  const free = order.filter((idx) => board[idx] === EMPTY);
  return free.length ? free[Math.floor(Math.random() * free.length)] : null;
}

const TicTacToeGame = ({ onGameOver, playerName = 'You', accent = '#f97316', secondary = '#ef4444' }) => {
  const [board, setBoard] = useState(() => Array(9).fill(EMPTY));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('Your move (X)');
  const [winLine, setWinLine] = useState(null);
  const [wins, setWins] = useState({ x: 0, o: 0, d: 0 });
  const roundRef = useRef(1);
  const scoreRef = useRef(0);
  const maxRounds = 3;

  const advance = useCallback(
    (outcome) => {
      const pts = outcome === 'win' ? 420 : outcome === 'draw' ? 140 : 40;
      scoreRef.current += pts;
      setWins((w) => ({
        x: w.x + (outcome === 'win' ? 1 : 0),
        o: w.o + (outcome === 'loss' ? 1 : 0),
        d: w.d + (outcome === 'draw' ? 1 : 0),
      }));
      if (roundRef.current >= maxRounds) {
        setMsg(`Match over · ${scoreRef.current} pts`);
        setTimeout(() => onGameOver?.(scoreRef.current >>> 0), 700);
        return;
      }
      roundRef.current += 1;
      setTimeout(() => {
        setBoard(Array(9).fill(EMPTY));
        setWinLine(null);
        setMsg(`Round ${roundRef.current}/${maxRounds} — your move`);
        setBusy(false);
      }, 800);
    },
    [onGameOver, maxRounds]
  );

  const clickCell = (idx) => {
    if (busy || board[idx] !== EMPTY) return;
    setBusy(true);
    const next = [...board];
    next[idx] = 'X';

    if (lineWin(next, 'X')) {
      setBoard(next);
      setWinLine(winningLine(next, 'X'));
      setMsg('You win this round!');
      setTimeout(() => advance('win'), 600);
      return;
    }
    if (!next.includes(EMPTY)) {
      setBoard(next);
      setMsg("It's a draw.");
      setTimeout(() => advance('draw'), 600);
      return;
    }

    setBoard([...next]);
    setMsg('CPU thinking…');

    setTimeout(() => {
      const j = aiMove(next);
      if (j != null) next[j] = 'O';
      setBoard([...next]);

      if (lineWin(next, 'O')) {
        setWinLine(winningLine(next, 'O'));
        setMsg('CPU wins round.');
        setTimeout(() => advance('loss'), 600);
        return;
      }
      if (!next.includes(EMPTY)) {
        setMsg("It's a draw.");
        setTimeout(() => advance('draw'), 600);
        return;
      }
      setMsg('Your move (X)');
      setBusy(false);
    }, 380);
  };

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#fff', maxWidth: 380, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Score header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
        padding: '10px 12px', borderRadius: 14,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent, marginBottom: 2 }}>You (X)</div>
          <div style={{ fontWeight: 900, fontSize: 18, color: '#fff' }}>{wins.x}</div>
        </div>
        <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.5)', marginBottom: 2 }}>Round</div>
          <div style={{ fontWeight: 900, fontSize: 18, color: '#fff' }}>{Math.min(roundRef.current, maxRounds)}/{maxRounds}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: secondary, marginBottom: 2 }}>CPU (O)</div>
          <div style={{ fontWeight: 900, fontSize: 18, color: '#fff' }}>{wins.o}</div>
        </div>
      </div>

      {/* Board */}
      <div style={{
        position: 'relative',
        padding: 14, borderRadius: 18,
        background: `linear-gradient(135deg, ${accent}10, ${secondary}08)`,
        border: `1px solid ${accent}25`,
        boxShadow: `0 14px 40px -16px rgba(0,0,0,0.6), 0 0 30px -10px ${accent}30`,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 96px)', gap: 8, justifyContent: 'center' }}>
          {board.map((cell, i) => {
            const inWin = winLine?.includes(i);
            const cellColor = cell === 'X' ? accent : secondary;
            return (
              <button
                key={i}
                type="button"
                onClick={() => clickCell(i)}
                disabled={busy}
                style={{
                  width: 96,
                  height: 96,
                  fontSize: 48,
                  fontWeight: 900,
                  borderRadius: 14,
                  border: `2px solid ${inWin ? cellColor : `${accent}33`}`,
                  background: inWin ? `${cellColor}1f` : cell ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.025)',
                  color: cellColor,
                  textShadow: cell ? `0 0 16px ${cellColor}66` : 'none',
                  cursor: !busy && cell === EMPTY ? 'pointer' : 'default',
                  transition: 'all 0.18s ease',
                  transform: cell && !inWin ? 'scale(1)' : inWin ? 'scale(1.04)' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  if (cell === EMPTY && !busy) {
                    e.currentTarget.style.background = `${accent}10`;
                    e.currentTarget.style.borderColor = `${accent}66`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (cell === EMPTY) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
                    e.currentTarget.style.borderColor = `${accent}33`;
                  }
                }}
              >
                {cell}
              </button>
            );
          })}
        </div>
      </div>

      {/* Message */}
      <div style={{
        padding: '11px 16px', borderRadius: 12,
        background: `${accent}10`,
        border: `1px solid ${accent}30`,
        textAlign: 'center',
        fontSize: 13, color: accent, fontWeight: 700,
        fontFamily: MONO, letterSpacing: '0.06em',
      }}>
        {msg}
      </div>
    </div>
  );
};

export default TicTacToeGame;
