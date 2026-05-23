import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useRoomChannel } from '../../hooks/useRoomChannel';
import { API_BASE_URL, authHeaders } from '../../lib/api';

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

const ThinkingDots = ({ color }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        style={{
          width: 5, height: 5, borderRadius: '50%',
          background: color, boxShadow: `0 0 6px ${color}`,
          animation: 'tttDot 1.2s ease-in-out infinite',
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
  </span>
);

/* ════════════════════════════════════════════════════
   TicTacToeGame
   - Solo: vs CPU, 3 rounds, point system
   - Multiplayer: X = host, O = opponent
     · Each move broadcast as { type: 'ttt.move', payload: { idx, mark } }
     · Final result reported via onGameOver from each side
═══════════════════════════════════════════════════════ */
const TicTacToeGame = ({
  onGameOver,
  playerName = 'You',
  accent = '#f97316',
  secondary = '#ef4444',
  // Multiplayer extras
  roomCode = null,
  userId = null,
  players = null,
  token = null,
}) => {
  const isMP = !!(roomCode && players?.length >= 2 && token);

  /* My mark — host = X, second = O */
  const myMark = useMemo(() => {
    if (!isMP || !userId || !players) return 'X';
    const sorted = [...players].sort((a, b) => {
      if (a.is_host && !b.is_host) return -1;
      if (b.is_host && !a.is_host) return 1;
      return a.id - b.id;
    });
    return sorted[0].id === userId ? 'X' : 'O';
  }, [isMP, userId, players]);
  const oppMark = myMark === 'X' ? 'O' : 'X';
  const opponent = useMemo(() => {
    if (!isMP || !players) return null;
    return players.find((p) => p.id !== userId) || null;
  }, [isMP, players, userId]);

  const [board, setBoard] = useState(() => Array(9).fill(EMPTY));
  const [turn, setTurn] = useState('X'); // who's to move
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(isMP
    ? (myMark === 'X' ? 'Your move (X)' : "Waiting for X's first move…")
    : 'Your move (X)');
  const [winLine, setWinLine] = useState(null);
  const [wins, setWins] = useState({ x: 0, o: 0, d: 0 });
  const [thinking, setThinking] = useState(false);
  const roundRef = useRef(1);
  const scoreRef = useRef(0);
  const finishedRef = useRef(false);
  const maxRounds = 3;

  const myTurn = isMP ? (turn === myMark) : (turn === 'X');

  /* ── Broadcast a move (multiplayer) ── */
  const sendMove = useCallback(async (idx, mark) => {
    if (!isMP) return;
    try {
      await fetch(`${API_BASE_URL}/rooms/${roomCode}/move`, {
        method: 'POST',
        headers: authHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ type: 'ttt.move', payload: { idx, mark, round: roundRef.current } }),
      });
    } catch (err) { console.warn('ttt sendMove failed:', err); }
  }, [isMP, roomCode, token]);

  /* ── Round advance ── */
  const advance = useCallback((outcome) => {
    const pts = outcome === 'win' ? 420 : outcome === 'draw' ? 140 : 40;
    scoreRef.current += pts;
    setWins((w) => ({
      x: w.x + (outcome === 'win' ? 1 : 0),
      o: w.o + (outcome === 'loss' ? 1 : 0),
      d: w.d + (outcome === 'draw' ? 1 : 0),
    }));
    if (roundRef.current >= maxRounds) {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setMsg(`Match over · ${scoreRef.current} pts`);
      setTimeout(() => onGameOver?.(scoreRef.current >>> 0), 700);
      return;
    }
    roundRef.current += 1;
    setTimeout(() => {
      setBoard(Array(9).fill(EMPTY));
      setWinLine(null);
      setTurn('X');
      setMsg(`Round ${roundRef.current}/${maxRounds} — ${isMP ? (myMark === 'X' ? 'your move (X)' : "X's move") : 'your move'}`);
      setBusy(false);
      setThinking(false);
    }, 900);
  }, [onGameOver, maxRounds, isMP, myMark]);

  /* ── Resolve a freshly-placed mark ── */
  const resolveAfterPlace = useCallback((next, placedMark) => {
    if (lineWin(next, placedMark)) {
      setBoard(next);
      setWinLine(winningLine(next, placedMark));
      const wonByMe = isMP ? placedMark === myMark : placedMark === 'X';
      setMsg(wonByMe ? 'You win this round!' : (isMP ? `${opponent?.name || 'Opponent'} takes it.` : 'CPU wins round.'));
      setTimeout(() => advance(wonByMe ? 'win' : 'loss'), 600);
      return true;
    }
    if (!next.includes(EMPTY)) {
      setBoard(next);
      setMsg("It's a draw.");
      setTimeout(() => advance('draw'), 600);
      return true;
    }
    return false;
  }, [advance, isMP, myMark, opponent?.name]);

  /* ── Apply remote move ── */
  const handleRemoteMove = useCallback((data) => {
    if (data?.type !== 'ttt.move') return;
    const { idx, mark, round } = data.payload || {};
    if (typeof idx !== 'number' || (mark !== 'X' && mark !== 'O')) return;
    if (round && round !== roundRef.current) return; // stale
    setBoard((prev) => {
      if (prev[idx] !== EMPTY) return prev;
      const next = [...prev];
      next[idx] = mark;
      const ended = resolveAfterPlace(next, mark);
      if (!ended) {
        setTurn(mark === 'X' ? 'O' : 'X');
        setBusy(false);
        setThinking(false);
        setMsg(mark === myMark ? 'Opponent thinking…' : 'Your move');
      }
      return next;
    });
  }, [resolveAfterPlace, myMark]);

  // Subscribe to room channel for opponent moves
  useRoomChannel(isMP ? roomCode : null, null, handleRemoteMove);

  /* ── Click handler ── */
  const clickCell = (idx) => {
    if (busy || finishedRef.current) return;
    if (board[idx] !== EMPTY) return;
    if (!myTurn) return;

    setBusy(true);
    const next = [...board];
    const mark = isMP ? myMark : 'X';
    next[idx] = mark;
    setBoard(next);

    // Check immediate win/draw
    if (resolveAfterPlace(next, mark)) {
      if (isMP) sendMove(idx, mark);
      return;
    }

    if (isMP) {
      sendMove(idx, mark);
      setTurn(mark === 'X' ? 'O' : 'X');
      setMsg('Sent. Waiting for opponent…');
      setThinking(true);
      setBusy(false);
      return;
    }

    // Solo: CPU turn
    setTurn('O');
    setMsg('CPU thinking…');
    setThinking(true);
    setTimeout(() => {
      const j = aiMove(next);
      if (j == null) { setBusy(false); setThinking(false); return; }
      const after = [...next];
      after[j] = 'O';
      setBoard(after);
      if (resolveAfterPlace(after, 'O')) return;
      setTurn('X');
      setMsg('Your move');
      setThinking(false);
      setBusy(false);
    }, 420);
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
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent, marginBottom: 2 }}>
            {isMP ? `${myMark === 'X' ? 'You (X)' : 'Opp (X)'}` : 'You (X)'}
          </div>
          <div style={{ fontWeight: 900, fontSize: 18, color: '#fff' }}>{wins.x}</div>
        </div>
        <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.5)', marginBottom: 2 }}>Round</div>
          <div style={{ fontWeight: 900, fontSize: 18, color: '#fff' }}>{Math.min(roundRef.current, maxRounds)}/{maxRounds}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: secondary, marginBottom: 2 }}>
            {isMP ? `${myMark === 'O' ? 'You (O)' : 'Opp (O)'}` : 'CPU (O)'}
          </div>
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
            const ghostMark = !cell && myTurn && !busy ? (isMP ? myMark : 'X') : null;
            return (
              <button
                key={i}
                type="button"
                onClick={() => clickCell(i)}
                disabled={busy || cell !== EMPTY || !myTurn || finishedRef.current}
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
                  cursor: !busy && cell === EMPTY && myTurn ? 'pointer' : 'default',
                  transition: 'all 0.18s ease',
                  transform: cell && !inWin ? 'scale(1)' : inWin ? 'scale(1.04)' : 'scale(1)',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (cell === EMPTY && !busy && myTurn) {
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
                {cell || (
                  ghostMark && (
                    <span style={{
                      color: ghostMark === 'X' ? accent : secondary,
                      opacity: 0,
                      pointerEvents: 'none',
                      transition: 'opacity 0.2s',
                    }} className="ttt-ghost">{ghostMark}</span>
                  )
                )}
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
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        {thinking && <ThinkingDots color={accent} />}
        {msg}
      </div>

      <style>{`
        @keyframes tttDot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        button:hover .ttt-ghost { opacity: 0.32; }
      `}</style>
    </div>
  );
};

export default TicTacToeGame;
