import React, { useState, useCallback, useRef } from 'react';

const EMPTY = '';

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function lineWin(board, p) {
  return LINES.some(([a, b, c]) => board[a] === p && board[b] === p && board[c] === p);
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

const TicTacToeGame = ({ onGameOver, playerName = 'You', accent = '#34d399' }) => {
  const [board, setBoard] = useState(() => Array(9).fill(EMPTY));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('Your move (X)');
  const roundRef = useRef(1);
  const scoreRef = useRef(0);
  const maxRounds = 3;

  const advance = useCallback(
    (outcome) => {
      const pts = outcome === 'win' ? 420 : outcome === 'draw' ? 140 : 40;
      scoreRef.current += pts;
      if (roundRef.current >= maxRounds) {
        setMsg(`Match over — ${scoreRef.current} pts`);
        setTimeout(() => onGameOver?.(scoreRef.current >>> 0), 500);
        return;
      }
      roundRef.current += 1;
      setBoard(Array(9).fill(EMPTY));
      setMsg(`Round ${roundRef.current}/${maxRounds} — your move`);
      setBusy(false);
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
      setMsg('You win this round!');
      setTimeout(() => advance('win'), 400);
      return;
    }
    if (!next.includes(EMPTY)) {
      setBoard(next);
      setMsg('Draw.');
      setTimeout(() => advance('draw'), 400);
      return;
    }

    const j = aiMove(next);
    if (j != null) next[j] = 'O';
    setBoard([...next]);

    if (lineWin(next, 'O')) {
      setMsg('CPU wins round.');
      setTimeout(() => advance('loss'), 400);
      return;
    }
    if (!next.includes(EMPTY)) {
      setMsg('Draw.');
      setTimeout(() => advance('draw'), 400);
      return;
    }
    setBusy(false);
  };

  return (
    <div style={{ textAlign: 'center', fontFamily: "'Space Grotesk',sans-serif", color: '#fff' }}>
      <div style={{ fontSize: 13, opacity: 0.55, marginBottom: 16 }}>
        Tic Tac Toe Masters • {playerName} • Round {Math.min(roundRef.current, maxRounds)}/{maxRounds}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 88px)', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
        {board.map((cell, i) => (
          <button
            key={i}
            type="button"
            onClick={() => clickCell(i)}
            disabled={busy}
            style={{
              width: 88,
              height: 88,
              fontSize: 36,
              fontWeight: 800,
              borderRadius: 14,
              border: `2px solid ${accent}66`,
              background: 'rgba(255,255,255,0.04)',
              color: cell === 'X' ? accent : '#f472b6',
              cursor: !busy && cell === EMPTY ? 'pointer' : 'default',
              opacity: busy ? 0.75 : 1,
            }}
          >
            {cell}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 14, color: accent }}>{msg}</div>
    </div>
  );
};

export default TicTacToeGame;
