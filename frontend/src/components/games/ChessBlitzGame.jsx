import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { useRoomChannel } from '../../hooks/useRoomChannel';
import { API_BASE_URL, authHeaders } from '../../lib/api';

/* ── Constants ────────────────────────────────────────── */
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const MONO = "'JetBrains Mono', monospace";
const BOARD_SIZE = 560; // ↑ bigger board (was ~380)

function pieceGlyph(p) {
  if (!p) return '';
  const map = {
    w: { p: '\u2659', r: '\u2656', n: '\u2658', b: '\u2657', q: '\u2655', k: '\u2654' },
    b: { p: '\u265F', r: '\u265C', n: '\u265E', b: '\u265D', q: '\u265B', k: '\u265A' },
  };
  return map[p.color][p.type] || '?';
}

/* ── Animated thinking dots (used in status row) ─────── */
const ThinkingDots = ({ color = '#60a5fa' }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        style={{
          width: 5, height: 5, borderRadius: '50%',
          background: color,
          boxShadow: `0 0 6px ${color}`,
          animation: `chessThink 1.2s ease-in-out infinite`,
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
  </span>
);

/* ════════════════════════════════════════════════════
   ChessBlitzGame
   - Bigger 560px board with legal-move dots
   - Solo mode → vs random-eval CPU
   - Multiplayer → real-time sync via /rooms/{code}/move
     · Host (first player.id) plays White, second plays Black
     · Each move is broadcast; opponent applies it locally
═══════════════════════════════════════════════════════ */
const ChessBlitzGame = ({
  onGameOver,
  accent = '#60a5fa',
  secondary = '#6366f1',
  // Multiplayer extras
  roomCode = null,
  userId = null,
  players = null,
  token = null,
}) => {
  const isMP = !!(roomCode && players?.length >= 2 && token);

  /* Decide colour from player order (host = white). Stable across remounts. */
  const myColor = useMemo(() => {
    if (!isMP || !userId || !players) return 'w';
    const sorted = [...players].sort((a, b) => {
      if (a.is_host && !b.is_host) return -1;
      if (b.is_host && !a.is_host) return 1;
      return a.id - b.id;
    });
    const idx = sorted.findIndex((p) => p.id === userId);
    return idx === 0 ? 'w' : 'b';
  }, [isMP, userId, players]);

  const opponent = useMemo(() => {
    if (!isMP || !players) return null;
    return players.find((p) => p.id !== userId) || null;
  }, [isMP, players, userId]);

  const engine = useMemo(() => new Chess(), []);
  const [, force] = useState(0);
  const [sel, setSel] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);   // {from, to, captured}
  const [msg, setMsg] = useState(isMP
    ? (myColor === 'w' ? 'You play White — opening move is yours.' : 'You play Black — waiting for White…')
    : 'You play White — tap a piece, then a destination.');
  const [thinking, setThinking] = useState(false);    // animated thinking state
  const [isOver, setIsOver] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const repaint = () => force((x) => x + 1);

  const turn = engine.turn(); // 'w' | 'b'
  const myTurn = isMP ? (myColor === turn) : (turn === 'w');

  /* ── Move broadcast (multiplayer) ── */
  const sendMove = useCallback(async (move) => {
    if (!isMP) return;
    try {
      await fetch(`${API_BASE_URL}/rooms/${roomCode}/move`, {
        method: 'POST',
        headers: authHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          type: 'chess.move',
          payload: { from: move.from, to: move.to, promotion: 'q', san: move.san, fen: engine.fen() },
        }),
      });
    } catch (err) {
      console.warn('chess sendMove failed:', err);
    }
  }, [isMP, roomCode, token, engine]);

  /* ── End-of-game scoring ── */
  const endIfDone = useCallback(() => {
    if (!engine.isGameOver()) return;
    let pts = 400;
    let result = 'Game over.';
    if (engine.isCheckmate()) {
      const loser = engine.turn(); // side to move that has no legal moves = the loser
      const iWon = loser !== myColor; // (in solo, myColor is 'w')
      pts = iWon ? 6800 : 120;
      result = iWon ? 'Checkmate — you win!' : 'Checkmate — you lost.';
    } else if (engine.isStalemate()) { pts = 3200; result = 'Stalemate.'; }
    else if (engine.isDraw()) { pts = 3200; result = 'Draw by rule.'; }
    setMsg(result);
    setIsOver(true);
    setThinking(false);
    setTimeout(() => onGameOver?.(pts >>> 0), 700);
  }, [engine, onGameOver, myColor]);

  /* ── Solo CPU turn ── */
  const aiTurn = useCallback(() => {
    if (engine.isGameOver()) { endIfDone(); return; }
    const moves = engine.moves({ verbose: true });
    if (moves.length === 0) { endIfDone(); return; }
    // Light heuristic: prefer captures and centre, with a touch of randomness
    let best = moves[0];
    let bestScore = -Infinity;
    for (const m of moves) {
      let s = 0;
      if (m.flags.includes('c')) s += 5;
      if (['d4', 'd5', 'e4', 'e5'].includes(m.to)) s += 1.2;
      if (['c4', 'c5', 'f4', 'f5'].includes(m.to)) s += 0.6;
      if (m.flags.includes('e')) s += 4; // en passant
      if (m.promotion) s += 6;
      s += Math.random() * 0.8;
      if (s > bestScore) { bestScore = s; best = m; }
    }
    engine.move({ from: best.from, to: best.to, promotion: 'q' });
    setMoveCount((n) => n + 1);
    setMsg('Your move.');
    setThinking(false);
    repaint();
    endIfDone();
  }, [engine, endIfDone]);

  /* ── Apply remote move (multiplayer) ── */
  const handleRemoteMove = useCallback((data) => {
    if (data?.type !== 'chess.move') return;
    if (!data.payload) return;
    const { from, to, promotion } = data.payload;
    try {
      const r = engine.move({ from, to, promotion: promotion || 'q' });
      if (r) {
        setMoveCount((n) => n + 1);
        setMsg(myTurn === false ? 'Your move.' : '…');
        setThinking(false);
        setSel(null);
        setLegalMoves([]);
        repaint();
        endIfDone();
      }
    } catch (err) {
      console.warn('chess handleRemoteMove failed:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, endIfDone]);

  // Subscribe to room channel for opponent moves
  useRoomChannel(isMP ? roomCode : null, null, handleRemoteMove);

  /* ── Click handler ── */
  const onSquareClick = (sq) => {
    if (isOver) return;
    if (!myTurn) return;

    const piece = engine.get(sq);

    // Selecting one of my pieces
    if (sel === null || engine.get(sel)?.color !== myColor) {
      if (piece?.color === myColor) {
        setSel(sq);
        // Show legal destinations as dots
        setLegalMoves(engine.moves({ square: sq, verbose: true }));
      }
      return;
    }

    // Same square — deselect
    if (sq === sel) {
      setSel(null);
      setLegalMoves([]);
      return;
    }

    // Switching to a different one of my pieces
    if (piece?.color === myColor) {
      setSel(sq);
      setLegalMoves(engine.moves({ square: sq, verbose: true }));
      return;
    }

    // Try to move
    try {
      const r = engine.move({ from: sel, to: sq, promotion: 'q' });
      if (!r) throw new Error('illegal');
      setSel(null);
      setLegalMoves([]);
      setMoveCount((n) => n + 1);
      repaint();
      endIfDone();

      if (isMP) {
        sendMove(r);
        setMsg('Sent. Waiting for opponent…');
        setThinking(true);
      } else {
        // Solo: trigger CPU turn after a beat
        setMsg('CPU thinking…');
        setThinking(true);
        if (!engine.isGameOver()) {
          window.setTimeout(aiTurn, 520);
        }
      }
    } catch {
      // Illegal — reselect if user clicked another own piece
      if (piece?.color === myColor) {
        setSel(sq);
        setLegalMoves(engine.moves({ square: sq, verbose: true }));
      } else {
        setSel(null);
        setLegalMoves([]);
      }
    }
  };

  const squareAt = (rank, file) => file + rank;
  const brd = engine.board();
  // Captured pieces
  const captured = useMemo(() => {
    const lostByWhite = []; const lostByBlack = [];
    const start = { p: 8, r: 2, n: 2, b: 2, q: 1, k: 1 };
    const live = { w: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 }, b: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 } };
    brd.forEach((row) => row.forEach((cell) => { if (cell) live[cell.color][cell.type] += 1; }));
    Object.entries(start).forEach(([t, n]) => {
      const dw = n - live.w[t];
      for (let i = 0; i < dw; i++) lostByWhite.push(pieceGlyph({ color: 'w', type: t }));
      const db = n - live.b[t];
      for (let i = 0; i < db; i++) lostByBlack.push(pieceGlyph({ color: 'b', type: t }));
    });
    return { lostByWhite, lostByBlack };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brd]);

  /* Display order — flip board for black so own pieces are at the bottom */
  const ranks = myColor === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const files = myColor === 'w' ? FILES : [...FILES].reverse();

  const lastMove = engine.history({ verbose: true }).slice(-1)[0];

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#f5f5f5', maxWidth: BOARD_SIZE + 40, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Top: Opponent (or CPU) ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '10px 14px', borderRadius: 14,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${turn !== myColor && !isOver ? `${secondary}55` : 'rgba(255,255,255,0.08)'}`,
        transition: 'border-color 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: myColor === 'w' ? '#0a0a0c' : '#f5f5f5',
            border: `1px solid ${turn !== myColor ? secondary : 'rgba(255,255,255,0.10)'}`,
            display: 'grid', placeItems: 'center',
            color: myColor === 'w' ? '#f5f5f5' : '#0a0a0c',
            fontWeight: 900, fontSize: 22, lineHeight: 1,
          }}>♚</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              {isMP ? (opponent?.name || 'Opponent') : 'CPU'}
              <span style={{
                fontSize: 9, padding: '2px 6px', borderRadius: 4,
                background: 'rgba(255,255,255,0.06)', color: 'rgba(235,235,235,0.6)',
                fontFamily: MONO, letterSpacing: '0.1em',
              }}>{myColor === 'w' ? 'BLACK' : 'WHITE'}</span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: turn !== myColor && !isOver ? secondary : 'rgba(235,235,235,0.4)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              {turn !== myColor && !isOver ? (
                <>Thinking <ThinkingDots color={secondary} /></>
              ) : (
                'Idle'
              )}
            </div>
          </div>
        </div>
        {/* Captured by me (their lost pieces) */}
        <div style={{ minWidth: 60, display: 'flex', flexWrap: 'wrap', gap: 2, fontSize: 18, justifyContent: 'flex-end', maxWidth: 160, color: myColor === 'w' ? '#0a0a0c' : '#f5f5f5', filter: myColor === 'w' ? 'drop-shadow(0 1px 1px rgba(255,255,255,0.4))' : 'drop-shadow(0 1px 1px rgba(0,0,0,0.6))' }}>
          {(myColor === 'w' ? captured.lostByBlack : captured.lostByWhite).map((g, i) => <span key={i}>{g}</span>)}
        </div>
      </div>

      {/* ── Board ── */}
      <div style={{ position: 'relative', width: '100%', maxWidth: BOARD_SIZE, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            borderRadius: 14,
            overflow: 'hidden',
            border: `1px solid ${accent}40`,
            boxShadow: `0 18px 50px -16px rgba(0,0,0,0.7), 0 0 40px -10px ${accent}45, inset 0 0 0 1px ${accent}18`,
            userSelect: 'none',
            WebkitUserSelect: 'none',
            background: '#1a1a22',
          }}
        >
          {ranks.flatMap((rank, ri) =>
            files.map((f, fi) => {
              const sq = squareAt(rank, f);
              // brd is always indexed 8..1 / a..h; remap if flipped
              const trueRi = myColor === 'w' ? ri : 7 - ri;
              const trueFi = myColor === 'w' ? fi : 7 - fi;
              const pc = brd[trueRi][trueFi];
              const dark = (rank + (myColor === 'w' ? fi : 7 - fi)) % 2 === 1;
              const selected = sel === sq;
              const isLastFrom = lastMove && lastMove.from === sq;
              const isLastTo = lastMove && lastMove.to === sq;
              const moveTo = legalMoves.find((m) => m.to === sq);
              const isCapture = !!moveTo?.captured;
              const isCheck = engine.inCheck() && pc?.type === 'k' && pc?.color === turn;

              // Background colour layers
              let bg = dark ? '#2a2a32' : '#3a3a44';
              if (isLastFrom || isLastTo) bg = dark ? `${accent}33` : `${accent}55`;
              if (selected) bg = dark
                ? `linear-gradient(135deg, ${accent}77, ${secondary}55)`
                : `linear-gradient(135deg, ${accent}cc, ${secondary}88)`;

              return (
                <button
                  key={sq}
                  type="button"
                  onClick={() => onSquareClick(sq)}
                  disabled={!myTurn || isOver}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    position: 'relative',
                    border: 'none',
                    fontSize: BOARD_SIZE / 8 * 0.72,
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: bg,
                    cursor: !myTurn || isOver
                      ? 'not-allowed'
                      : pc?.color === myColor || moveTo
                        ? 'pointer'
                        : 'default',
                    color: pc?.color === 'w' ? '#f8fafc' : '#0a0a0c',
                    outline: selected ? `3px solid ${accent}` : 'none',
                    outlineOffset: selected ? '-3px' : '0',
                    transition: 'background 0.15s ease',
                    textShadow: pc?.color === 'w'
                      ? '0 2px 3px rgba(0,0,0,0.6), 0 0 1px rgba(0,0,0,0.4)'
                      : '0 1px 1px rgba(255,255,255,0.3)',
                    padding: 0,
                    fontFamily: 'inherit',
                  }}
                >
                  {/* File coord on bottom row */}
                  {ri === 7 && (
                    <span style={{ position: 'absolute', bottom: 2, right: 5, fontSize: 11, fontFamily: MONO, color: dark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.42)', fontWeight: 700 }}>
                      {f}
                    </span>
                  )}
                  {/* Rank coord on left column */}
                  {fi === 0 && (
                    <span style={{ position: 'absolute', top: 2, left: 5, fontSize: 11, fontFamily: MONO, color: dark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.42)', fontWeight: 700 }}>
                      {rank}
                    </span>
                  )}

                  {/* Check ring */}
                  {isCheck && (
                    <div style={{
                      position: 'absolute', inset: 4,
                      borderRadius: '50%',
                      boxShadow: `0 0 0 3px #fb7185, 0 0 24px #fb7185aa, inset 0 0 18px #fb718555`,
                      pointerEvents: 'none',
                      animation: 'chessCheckPulse 1.4s ease-in-out infinite',
                    }} />
                  )}

                  {/* Piece */}
                  {pieceGlyph(pc)}

                  {/* Legal-move overlay — dot for empty, ring for capture */}
                  {moveTo && !isCapture && (
                    <span style={{
                      position: 'absolute',
                      width: '28%', height: '28%',
                      borderRadius: '50%',
                      background: `${accent}cc`,
                      boxShadow: `0 0 12px ${accent}99`,
                      pointerEvents: 'none',
                      animation: 'chessHintPop 0.32s ease-out',
                    }} />
                  )}
                  {moveTo && isCapture && (
                    <span style={{
                      position: 'absolute',
                      inset: 6,
                      borderRadius: '50%',
                      border: `4px solid ${accent}cc`,
                      boxShadow: `0 0 14px ${accent}aa, inset 0 0 14px ${accent}55`,
                      pointerEvents: 'none',
                      animation: 'chessHintPop 0.32s ease-out',
                    }} />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Thinking veil while waiting (multiplayer or CPU turn) */}
        {thinking && !isOver && (
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: 14, pointerEvents: 'none',
            background: `radial-gradient(ellipse at center, ${secondary}10, transparent 70%)`,
            border: `1px solid ${secondary}33`,
            animation: 'chessThinkVeil 1.6s ease-in-out infinite',
          }} />
        )}
      </div>

      {/* ── Bottom: Me ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '10px 14px', borderRadius: 14,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${myTurn && !isOver ? `${accent}55` : 'rgba(255,255,255,0.08)'}`,
        boxShadow: myTurn && !isOver ? `0 0 18px -6px ${accent}` : 'none',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: myColor === 'w' ? '#f5f5f5' : '#0a0a0c',
            border: `1px solid ${myTurn ? accent : 'rgba(255,255,255,0.10)'}`,
            display: 'grid', placeItems: 'center',
            color: myColor === 'w' ? '#0a0a0c' : '#f5f5f5',
            fontWeight: 900, fontSize: 22, lineHeight: 1,
          }}>♔</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              You
              <span style={{
                fontSize: 9, padding: '2px 6px', borderRadius: 4,
                background: `${accent}15`, color: accent,
                fontFamily: MONO, letterSpacing: '0.1em',
              }}>{myColor === 'w' ? 'WHITE' : 'BLACK'}</span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: myTurn && !isOver ? accent : 'rgba(235,235,235,0.4)', marginTop: 2 }}>
              {myTurn && !isOver ? 'Your move' : isOver ? 'Match over' : 'Waiting'}
            </div>
          </div>
        </div>
        <div style={{ minWidth: 60, display: 'flex', flexWrap: 'wrap', gap: 2, fontSize: 18, justifyContent: 'flex-end', maxWidth: 160, color: myColor === 'w' ? '#f5f5f5' : '#0a0a0c', filter: myColor === 'w' ? 'drop-shadow(0 1px 1px rgba(0,0,0,0.6))' : 'drop-shadow(0 1px 1px rgba(255,255,255,0.4))' }}>
          {(myColor === 'w' ? captured.lostByWhite : captured.lostByBlack).map((g, i) => <span key={i}>{g}</span>)}
        </div>
      </div>

      {/* ── Status strip ── */}
      <div style={{
        padding: '11px 16px', borderRadius: 12,
        background: `${accent}10`,
        border: `1px solid ${accent}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        fontSize: 13, color: accent, fontWeight: 700,
        fontFamily: MONO, letterSpacing: '0.06em',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {thinking && <ThinkingDots color={accent} />}
          {msg}
        </span>
        <span style={{ color: 'rgba(235,235,235,0.55)', fontSize: 11 }}>
          {moveCount} {moveCount === 1 ? 'move' : 'moves'}
        </span>
      </div>

      <p style={{ fontSize: 10, color: 'rgba(235,235,235,0.35)', textAlign: 'center', fontFamily: MONO, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
        Promotion auto-queens · checkmate = top score
      </p>

      <style>{`
        @keyframes chessThink {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes chessThinkVeil {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes chessHintPop {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes chessCheckPulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
      `}</style>
    </div>
  );
};

export default ChessBlitzGame;
