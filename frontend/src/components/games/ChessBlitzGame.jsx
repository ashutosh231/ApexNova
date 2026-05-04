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

const ChessBlitzGame = ({ onGameOver }) => {
  const engine = useMemo(() => new Chess(), []);
  const [, force] = useState(0);
  const [sel, setSel] = useState(null);
  const [msg, setMsg] = useState('You play White — tap piece then destination');

  const repaint = () => force((x) => x + 1);

  const endIfDone = useCallback(() => {
    if (!engine.isGameOver()) return;
    let pts = 400;
    if (engine.isCheckmate()) pts = engine.turn() === 'b' ? 6800 : 120;
    else if (engine.isDraw()) pts = 3200;
    setTimeout(() => onGameOver?.(pts >>> 0), 450);
  }, [engine, onGameOver]);

  const aiTurn = useCallback(() => {
    const moves = engine.moves({ verbose: true });
    if (moves.length === 0) {
      endIfDone();
      return;
    }
    const pick = moves[Math.floor(Math.random() * moves.length)];
    engine.move({ from: pick.from, to: pick.to, promotion: 'q' });
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
      repaint();
      setMsg('Thinking…');
      endIfDone();
      if (!engine.isGameOver()) window.setTimeout(aiTurn, 360);
    } catch {
      if (piece?.color === 'w') setSel(sq);
      else setSel(null);
    }
  };

  const squareAt = (rank, file) => file + rank;
  const brd = engine.board();

  return (
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", color: '#e5e5e5', maxWidth: 420, margin: '0 auto' }}>
      <p style={{ fontSize: 12, opacity: 0.55, marginBottom: 10, textAlign: 'center' }}>Chess Blitz vs CPU • {msg}</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          borderRadius: 10,
          overflow: 'hidden',
          border: '2px solid rgba(245,245,245,0.18)',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {[8, 7, 6, 5, 4, 3, 2, 1].flatMap((rank, ri) =>
          FILES.map((f, fi) => {
            const sq = squareAt(rank, f);
            const pc = brd[ri][fi];
            const dark = (rank + fi) % 2 === 1;
            const selected = sel === sq;
            return (
              <button
                key={sq}
                type="button"
                onClick={() => onSquareClick(sq)}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  border: selected ? '2px solid #ccff00' : 'none',
                  fontSize: 30,
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: dark ? '#2d3748' : '#4a5568',
                  cursor: engine.turn() !== 'w' ? 'wait' : 'pointer',
                  color: pc?.color === 'w' ? '#f8fafc' : '#0f172a',
                }}
              >
                {pieceGlyph(pc)}
              </button>
            );
          })
        )}
      </div>
      <p style={{ fontSize: 11, opacity: 0.35, marginTop: 12, textAlign: 'center' }}>
        Promotion auto-queens. Checkmate earns top score — art of war.
      </p>
    </div>
  );
};

export default ChessBlitzGame;
