import React, { useMemo, useState, useCallback } from 'react';
import { Chess } from 'chess.js';

function pieceGlyph(p) {
  if (!p) return '';
  const map = {
    w: { p: '\u2659', r: '\u2656', n: '\u2658', b: '\u2657', q: '\u2655', k: '\u2654' },
    b: { p: '\u265F', r: '\u265C', n: '\u265E', b: '\u265D', q: '\u265B', k: '\u265A' },
  };
  return map[p.color][p.type] || '?';
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const MONO = "'JetBrains Mono', monospace";

const ChessBlitzGame = ({ onGameOver, accent = '#60a5fa', secondary = '#6366f1' }) => {
  const engine = useMemo(() => new Chess(), []);
  const [, force] = useState(0);
  const [sel, setSel] = useState(null);
  const [msg, setMsg] = useState('You play White — tap a piece, then a destination.');
  const [turn, setTurn] = useState('w');

  const repaint = () => force((x) => x + 1);

  const endIfDone = useCallback(() => {
    if (!engine.isGameOver()) return;
    let pts = 400;
    let result = '';
    if (engine.isCheckmate()) {
      if (engine.turn() === 'b') { pts = 6800; result = 'Checkmate — you win!'; }
      else { pts = 120; result = 'Checkmate — CPU wins.'; }
    } else if (engine.isStalemate()) { pts = 3200; result = 'Stalemate.'; }
    else if (engine.isDraw()) { pts = 3200; result = 'Draw.'; }
    setMsg(result);
    setTimeout(() => onGameOver?.(pts >>> 0), 600);
  }, [engine, onGameOver]);

  const aiTurn = useCallback(() => {
    const moves = engine.moves({ verbose: true });
    if (moves.length === 0) {
      endIfDone();
      return;
    }
    // Simple eval: prefer captures, then center
    let best = moves[0];
    let bestScore = -1;
    for (const m of moves) {
      let s = 0;
      if (m.flags.includes('c')) s += 5;
      if (['d4', 'd5', 'e4', 'e5'].includes(m.to)) s += 1;
      s += Math.random();
      if (s > bestScore) { bestScore = s; best = m; }
    }
    engine.move({ from: best.from, to: best.to, promotion: 'q' });
    setTurn('w');
    setMsg('Your move.');
    repaint();
    endIfDone();
  }, [engine, endIfDone]);

  const onSquareClick = (sq) => {
    if (engine.isGameOver()) return;
    if (engine.turn() !== 'w') return;

    const piece = engine.get(sq);

    if (sel === null || engine.get(sel)?.color !== 'w') {
      if (piece?.color === 'w') setSel(sq);
      return;
    }

    try {
      const r = engine.move({ from: sel, to: sq, promotion: 'q' });
      if (!r) throw new Error('bad');
      setSel(null);
      setTurn('b');
      repaint();
      setMsg('CPU thinking…');
      endIfDone();
      if (!engine.isGameOver()) window.setTimeout(aiTurn, 480);
    } catch {
      if (piece?.color === 'w') setSel(sq);
      else setSel(null);
    }
  };

  const squareAt = (rank, file) => file + rank;
  const brd = engine.board();

  const captured = useMemo(() => {
    const w = []; const b = [];
    const start = { p: 8, r: 2, n: 2, b: 2, q: 1, k: 1 };
    const live = { w: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 }, b: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 } };
    brd.forEach((row) => row.forEach((cell) => { if (cell) live[cell.color][cell.type] += 1; }));
    Object.entries(start).forEach(([t, n]) => {
      const dw = n - live.w[t]; for (let i = 0; i < dw; i++) w.push(pieceGlyph({ color: 'w', type: t }));
      const db = n - live.b[t]; for (let i = 0; i < db; i++) b.push(pieceGlyph({ color: 'b', type: t }));
    });
    return { capturedByBlack: w, capturedByWhite: b };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brd]);

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#f5f5f5', maxWidth: 460, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Status row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '10px 14px', borderRadius: 14,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${turn === 'w' ? `${accent}45` : 'rgba(255,255,255,0.08)'}`,
        transition: 'border-color 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: turn === 'w' ? accent : 'rgba(255,255,255,0.06)',
            border: `1px solid ${turn === 'w' ? accent : 'rgba(255,255,255,0.10)'}`,
            display: 'grid', placeItems: 'center',
            color: turn === 'w' ? '#0a0a0c' : 'rgba(235,235,235,0.5)',
            fontWeight: 900, fontSize: 14,
          }}>♔</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>White (you)</div>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: turn === 'w' ? accent : 'rgba(235,235,235,0.4)' }}>
              {turn === 'w' ? 'Your move' : 'Waiting'}
            </div>
          </div>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.5)' }}>
          {engine.history().length} {engine.history().length === 1 ? 'move' : 'moves'}
        </div>
      </div>

      {/* Captured by black (white pieces lost) */}
      <div style={{ minHeight: 22, display: 'flex', gap: 4, fontSize: 18, color: '#f5f5f5', opacity: 0.55, paddingLeft: 4 }}>
        {captured.capturedByBlack.length > 0 && captured.capturedByBlack.map((g, i) => <span key={i}>{g}</span>)}
      </div>

      {/* Board */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${accent}30`,
          boxShadow: `0 12px 36px -12px rgba(0,0,0,0.6), 0 0 30px -10px ${accent}40`,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          background: '#1a1a22',
        }}
      >
        {[8, 7, 6, 5, 4, 3, 2, 1].flatMap((rank, ri) =>
          FILES.map((f, fi) => {
            const sq = squareAt(rank, f);
            const pc = brd[ri][fi];
            const dark = (rank + fi) % 2 === 1;
            const selected = sel === sq;
            const lastMove = engine.history({ verbose: true }).slice(-1)[0];
            const isLastFrom = lastMove && lastMove.from === sq;
            const isLastTo = lastMove && lastMove.to === sq;
            return (
              <button
                key={sq}
                type="button"
                onClick={() => onSquareClick(sq)}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  position: 'relative',
                  border: 'none',
                  fontSize: 32,
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: dark
                    ? selected
                      ? `linear-gradient(135deg, ${accent}66, ${secondary}55)`
                      : isLastFrom || isLastTo
                        ? `${accent}22`
                        : '#2a2a32'
                    : selected
                      ? `linear-gradient(135deg, ${accent}aa, ${secondary}88)`
                      : isLastFrom || isLastTo
                        ? `${accent}33`
                        : '#3a3a44',
                  cursor: engine.turn() !== 'w' ? 'wait' : pc?.color === 'w' || sel ? 'pointer' : 'default',
                  color: pc?.color === 'w' ? '#f8fafc' : '#0a0a0c',
                  outline: selected ? `2px solid ${accent}` : 'none',
                  outlineOffset: selected ? '-2px' : '0',
                  transition: 'background 0.15s ease',
                  textShadow: pc?.color === 'w' ? '0 1px 2px rgba(0,0,0,0.5)' : '0 1px 1px rgba(255,255,255,0.2)',
                }}
              >
                {/* Coordinate label on edge squares */}
                {fi === 0 && (
                  <span style={{ position: 'absolute', top: 2, left: 4, fontSize: 9, fontFamily: MONO, color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)' }}>
                    {rank}
                  </span>
                )}
                {ri === 7 && (
                  <span style={{ position: 'absolute', bottom: 1, right: 4, fontSize: 9, fontFamily: MONO, color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)' }}>
                    {f}
                  </span>
                )}
                {pieceGlyph(pc)}
              </button>
            );
          })
        )}
      </div>

      {/* Captured by white (black pieces lost) */}
      <div style={{ minHeight: 22, display: 'flex', gap: 4, fontSize: 18, color: '#0a0a0c', filter: 'drop-shadow(0 1px 1px rgba(255,255,255,0.4))', opacity: 0.85, paddingLeft: 4 }}>
        {captured.capturedByWhite.length > 0 && captured.capturedByWhite.map((g, i) => <span key={i}>{g}</span>)}
      </div>

      {/* Message */}
      <div style={{
        padding: '10px 14px', borderRadius: 12,
        background: `${accent}10`,
        border: `1px solid ${accent}30`,
        textAlign: 'center',
        fontSize: 13, color: accent, fontWeight: 700,
        fontFamily: MONO, letterSpacing: '0.06em',
      }}>
        {msg}
      </div>

      <p style={{ fontSize: 10, color: 'rgba(235,235,235,0.35)', textAlign: 'center', fontFamily: MONO, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Promotion auto-queens · checkmate = top score
      </p>
    </div>
  );
};

export default ChessBlitzGame;
