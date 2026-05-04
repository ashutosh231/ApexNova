import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

const LIME = '#ccff00';

/** Fixed maze: # wall, . path, S start, E exit, G math gate */
const MAZE_LINES = [
  '###########',
  '#S........#',
  '#.#######.#',
  '#.#.....#.#',
  '#.#.#G#.#.#',
  '#...###...#',
  '###.#.#.###',
  '#.....#...#',
  '#.###.#.#.#',
  '#...G...#.#',
  '#.#####.#.#',
  '#........E#',
  '###########',
];

function parseMaze(lines) {
  const rows = lines.length;
  const cols = lines[0].length;
  let start = null;
  let exit = null;
  const gates = [];
  const grid = lines.map((line, r) =>
    line.split('').map((ch, c) => {
      if (ch === 'S') start = [r, c];
      if (ch === 'E') exit = [r, c];
      if (ch === 'G') gates.push(`${r},${c}`);
      if (ch === '#') return '#';
      return '.';
    })
  );
  return { grid, rows, cols, start, exit, gates };
}

function makeProblem() {
  const a = 2 + Math.floor(Math.random() * 14);
  const b = 2 + Math.floor(Math.random() * 12);
  const c = 2 + Math.floor(Math.random() * 9);
  const modes = ['add', 'mix'];
  const mode = modes[Math.floor(Math.random() * modes.length)];
  if (mode === 'add') {
    const x = 5 + Math.floor(Math.random() * 35);
    const y = 5 + Math.floor(Math.random() * 35);
    return { q: `${x} + ${y}`, ans: String(x + y) };
  }
  return { q: `${a} + ${b} × ${c}`, ans: String(a + b * c) };
}

const MathMazeGame = ({ onGameOver, accent = '#a5b4fc' }) => {
  const { grid, rows, cols, start, exit, gates } = useMemo(() => parseMaze(MAZE_LINES), []);
  const gateSet = useMemo(() => new Set(gates), [gates]);
  const [player, setPlayer] = useState(start);
  const [solvedGates, setSolvedGates] = useState(() => new Set());
  const [steps, setSteps] = useState(0);
  const [challenge, setChallenge] = useState(null);
  const [hint, setHint] = useState('Arrow keys / WASD • Reach E');
  const [answer, setAnswer] = useState('');
  const started = useRef(performance.now());
  const pendingDir = useRef(null);

  const keyAt = useCallback(
    (r, c) => {
      if (r < 0 || c < 0 || r >= rows || c >= cols) return '#';
      return grid[r][c];
    },
    [grid, rows, cols]
  );

  const tryMove = useCallback(
    (dr, dc) => {
      if (!player || challenge) return;
      const [pr, pc] = player;
      const nr = pr + dr;
      const nc = pc + dc;
      const cell = keyAt(nr, nc);
      if (cell === '#') return;

      const nk = `${nr},${nc}`;
      if (gateSet.has(nk) && !solvedGates.has(nk)) {
        pendingDir.current = [dr, dc];
        setChallenge(makeProblem());
        setAnswer('');
        setHint('Solve the gate to pass');
        return;
      }

      setSteps((s) => s + 1);
      setPlayer([nr, nc]);

      if (nr === exit[0] && nc === exit[1]) {
        const elapsed = performance.now() - started.current;
        const gatePts = solvedGates.size * 130;
        const stepPts = Math.max(0, 520 - steps * 4);
        const timePts = Math.max(0, 480 - Math.floor(elapsed / 420));
        const total = (920 + gatePts + stepPts + timePts) >>> 0;
        setHint('Escaped!');
        window.setTimeout(() => onGameOver?.(total), 420);
      }
    },
    [player, challenge, keyAt, gateSet, solvedGates, exit, steps, onGameOver]
  );

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      let dr = 0;
      let dc = 0;
      if (k === 'arrowup' || k === 'w') dr = -1;
      else if (k === 'arrowdown' || k === 's') dr = 1;
      else if (k === 'arrowleft' || k === 'a') dc = -1;
      else if (k === 'arrowright' || k === 'd') dc = 1;
      else return;
      e.preventDefault();
      tryMove(dr, dc);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tryMove]);

  const submitGate = () => {
    if (!challenge || !pendingDir.current) return;
    const ok = answer.trim() === challenge.ans;
    if (!ok) {
      setHint('Wrong — order of ops: multiply before add.');
      return;
    }
    const [dr, dc] = pendingDir.current;
    const nk = `${player[0] + dr},${player[1] + dc}`;
    setSolvedGates((prev) => new Set([...prev, nk]));
    setChallenge(null);
    pendingDir.current = null;
    setSteps((s) => s + 1);
    setPlayer([player[0] + dr, player[1] + dc]);
    setHint('Gate cleared — keep going');
    setAnswer('');
  };

  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const nk = `${r},${c}`;
      const isWall = grid[r][c] === '#';
      const isGate = gateSet.has(nk);
      const isSolved = solvedGates.has(nk);
      const isP = player && player[0] === r && player[1] === c;
      const isE = r === exit[0] && c === exit[1];
      let bg = isWall ? '#14161f' : 'rgba(255,255,255,0.06)';
      let border = '1px solid rgba(255,255,255,0.06)';
      let label = '';
      if (isGate && !isSolved) {
        bg = `${accent}22`;
        border = `1px solid ${accent}66`;
        label = 'G';
      } else if (isGate && isSolved) {
        bg = 'rgba(16,185,129,0.12)';
        label = '✓';
      }
      if (isE && !isP) {
        bg = `${LIME}18`;
        border = `1px solid ${LIME}55`;
        label = 'E';
      }
      if (isP) {
        bg = `${accent}44`;
        border = `2px solid ${accent}`;
      }

      cells.push(
        <div
          key={`${r}-${c}`}
          style={{
            aspectRatio: '1',
            background: bg,
            border,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 800,
            color: 'rgba(235,235,235,0.75)',
            fontFamily: "'JetBrains Mono',monospace",
          }}
        >
          {isP ? '🧭' : label}
        </div>
      );
    }
  }

  return (
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", color: '#fff', maxWidth: 520, margin: '0 auto' }}>
      <p style={{ fontSize: 12, opacity: 0.55, textAlign: 'center', marginBottom: 8 }}>Math Maze Open • Steps {steps}</p>
      <p style={{ fontSize: 13, color: accent, textAlign: 'center', marginBottom: 12 }}>{hint}</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: 3,
          padding: 12,
          borderRadius: 16,
          border: `1px solid ${accent}33`,
          background: 'rgba(0,0,0,0.35)',
        }}
      >
        {cells}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
        {[
          ['↑', () => tryMove(-1, 0)],
          ['←', () => tryMove(0, -1)],
          ['↓', () => tryMove(1, 0)],
          ['→', () => tryMove(0, 1)],
        ].map(([lab, fn]) => (
          <button
            key={lab}
            type="button"
            onClick={() => fn()}
            disabled={!!challenge}
            style={{
              width: 52,
              height: 44,
              borderRadius: 10,
              border: `1px solid ${accent}44`,
              background: `${accent}18`,
              color: '#fff',
              fontWeight: 800,
              cursor: challenge ? 'not-allowed' : 'pointer',
            }}
          >
            {lab}
          </button>
        ))}
      </div>

      {challenge && (
        <div
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 14,
            border: `1px solid ${accent}55`,
            background: 'rgba(15,15,20,0.95)',
          }}
        >
          <div style={{ fontSize: 13, marginBottom: 10, color: accent }}>Gate challenge</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>{challenge.q} = ?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value.replace(/[^\d-]/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && submitGate()}
              placeholder="Answer"
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                border: `2px solid ${accent}`,
                background: '#09090b',
                color: '#fff',
                fontSize: 16,
              }}
            />
            <button
              type="button"
              onClick={submitGate}
              style={{
                padding: '0 18px',
                borderRadius: 10,
                border: 'none',
                background: accent,
                color: '#0c0c14',
                fontWeight: 800,
              }}
            >
              Unlock
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathMazeGame;
