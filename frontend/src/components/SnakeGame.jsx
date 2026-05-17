import React, { useEffect, useRef, useCallback, useState } from 'react';

const CELL = 20;
const COLS = 25;
const ROWS = 20;
const W    = CELL * COLS;
const H    = CELL * ROWS;

/** Convert hex (#rrggbb) → "r,g,b" so we can build rgba() */
function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return '204,255,0';
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `${r},${g},${b}`;
}

const rand = (max) => Math.floor(Math.random() * max);
const newFood = (snake) => {
  let pos;
  do {
    pos = { x: rand(COLS), y: rand(ROWS) };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
};

const DIR = {
  ArrowUp:    { x: 0, y: -1 }, w: { x: 0, y: -1 },
  ArrowDown:  { x: 0, y:  1 }, s: { x: 0, y:  1 },
  ArrowLeft:  { x: -1, y: 0 }, a: { x: -1, y: 0 },
  ArrowRight: { x:  1, y: 0 }, d: { x:  1, y: 0 },
};

const SnakeGame = ({ onGameOver, playerName = 'You', autoStart = false, allowRestart = true, accent = '#ccff00', secondary = '#10b981' }) => {
  const ACCENT = accent;
  const SEC = secondary;
  const ACCENT_RGB = hexToRgb(accent);
  const SEC_RGB = hexToRgb(secondary);
  const canvasRef  = useRef(null);
  const stateRef   = useRef({
    snake: [{ x: 12, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 10 }],
    dir:   { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food:  { x: 20, y: 10 },
    score: 0,
    alive: false,
    started: false,
    speed: 140,
  });
  const rafRef     = useRef(null);
  const lastTickRef = useRef(0);
  const [score, setScore]     = useState(0);
  const [status, setStatus]   = useState('idle'); // idle | playing | dead
  const [countdown, setCountdown] = useState(null);

  /* ── Draw ─────────────────────────────────────────────── */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const st  = stateRef.current;

    // Background
    ctx.fillStyle = '#060608';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, H); ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(W, r * CELL); ctx.stroke();
    }

    // Food — pulsing circle, contrast color (red-orange) so it stays distinct from snake
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200);
    const grd = ctx.createRadialGradient(
      (st.food.x + 0.5) * CELL, (st.food.y + 0.5) * CELL, 0,
      (st.food.x + 0.5) * CELL, (st.food.y + 0.5) * CELL, CELL * 0.6
    );
    grd.addColorStop(0, `rgba(255,${50 + pulse * 80},0,1)`);
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc((st.food.x + 0.5) * CELL, (st.food.y + 0.5) * CELL, CELL * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Snake
    st.snake.forEach((seg, i) => {
      const ratio = 1 - (i / st.snake.length) * 0.6;
      ctx.fillStyle = i === 0
        ? ACCENT
        : `rgba(${SEC_RGB},${ratio})`;
      const pad = i === 0 ? 1 : 2;
      const r   = i === 0 ? 5 : 3;
      const x   = seg.x * CELL + pad;
      const y   = seg.y * CELL + pad;
      const sz  = CELL - pad * 2;
      ctx.beginPath();
      ctx.roundRect(x, y, sz, sz, r);
      ctx.fill();

      // Head glow
      if (i === 0) {
        ctx.shadowColor = ACCENT;
        ctx.shadowBlur  = 12;
        ctx.fill();
        ctx.shadowBlur  = 0;
      }
    });
  }, [ACCENT, SEC_RGB]);

  /* ── Game loop ────────────────────────────────────────── */
  const tick = useCallback((ts) => {
    const st = stateRef.current;
    if (!st.alive) return;

    draw();

    if (ts - lastTickRef.current >= st.speed) {
      lastTickRef.current = ts;
      st.dir = st.nextDir;

      const head = { x: st.snake[0].x + st.dir.x, y: st.snake[0].y + st.dir.y };

      // Wall collision
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        st.alive = false;
        setStatus('dead');
        onGameOver?.(st.score);
        return;
      }
      // Self collision
      if (st.snake.some(s => s.x === head.x && s.y === head.y)) {
        st.alive = false;
        setStatus('dead');
        onGameOver?.(st.score);
        return;
      }

      const ateFood = head.x === st.food.x && head.y === st.food.y;
      st.snake = [head, ...st.snake];
      if (ateFood) {
        st.score += 10;
        st.food   = newFood(st.snake);
        // Speed up slightly every 5 foods
        if (st.score % 50 === 0) st.speed = Math.max(60, st.speed - 5);
        setScore(st.score);
      } else {
        st.snake.pop();
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [draw, onGameOver]);

  /* ── Start ────────────────────────────────────────────── */
  const startGame = useCallback(() => {
    const st = stateRef.current;
    st.snake   = [{ x: 12, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 10 }];
    st.dir     = { x: 1, y: 0 };
    st.nextDir = { x: 1, y: 0 };
    st.food    = newFood(st.snake);
    st.score   = 0;
    st.alive   = true;
    st.started = true;
    st.speed   = 140;
    setScore(0);
    setStatus('playing');
    lastTickRef.current = 0;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  /* ── Countdown → start ───────────────────────────────── */
  const runCountdown = useCallback(() => {
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
  }, [startGame]);

  useEffect(() => {
    if (autoStart) runCountdown();
  }, [autoStart, runCountdown]);

  /* ── Key controls ─────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e) => {
      const st = stateRef.current;
      if (!st.alive) return;
      const d = DIR[e.key] || DIR[e.key.toLowerCase()];
      if (!d) return;
      // Prevent reversing
      if (d.x === -st.dir.x && d.y === -st.dir.y) return;
      e.preventDefault();
      st.nextDir = d;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ── Draw idle frame ──────────────────────────────────── */
  useEffect(() => {
    const id = requestAnimationFrame(() => draw());
    return () => cancelAnimationFrame(id);
  }, [draw]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* HUD */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: W,
        padding: '10px 16px', borderRadius: 14,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `${ACCENT}15`, border: `1px solid ${ACCENT}35`,
            display: 'grid', placeItems: 'center', fontSize: 16,
          }}>🐍</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em' }}>{playerName}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {status === 'playing' ? 'In game' : status === 'dead' ? 'Game over' : 'Ready'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.14em', textTransform: 'uppercase' }}>Score</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 900, color: ACCENT, lineHeight: 1, textShadow: `0 0 20px ${ACCENT}44` }}>{score.toLocaleString()}</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: status === 'playing' ? `${ACCENT}15` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${status === 'playing' ? `${ACCENT}40` : 'rgba(255,255,255,0.08)'}`,
            display: 'grid', placeItems: 'center',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: status === 'playing' ? ACCENT : 'rgba(255,255,255,0.3)',
              boxShadow: status === 'playing' ? `0 0 10px ${ACCENT}` : 'none',
              animation: status === 'playing' ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }} />
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div style={{
        position: 'relative', borderRadius: 18, overflow: 'hidden',
        border: `1px solid ${status === 'playing' ? `${ACCENT}30` : 'rgba(255,255,255,0.08)'}`,
        boxShadow: status === 'playing' ? `0 0 50px ${ACCENT}15, inset 0 0 30px rgba(0,0,0,0.3)` : 'inset 0 0 30px rgba(0,0,0,0.3)',
        transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
      }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ display: 'block' }} />

        {/* Countdown overlay */}
        {countdown !== null && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,6,8,0.88)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ fontSize: 12, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.2em', fontFamily: "'JetBrains Mono', monospace" }}>Get Ready</div>
            <div style={{ fontSize: 100, fontWeight: 900, color: ACCENT, lineHeight: 1, textShadow: `0 0 60px ${ACCENT}80, 0 0 120px ${ACCENT}40` }}>{countdown}</div>
          </div>
        )}

        {/* Idle overlay */}
        {status === 'idle' && countdown === null && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,6,8,0.8)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
            <div style={{ fontSize: 56, filter: `drop-shadow(0 0 20px ${ACCENT}66)` }}>🐍</div>
            <button onClick={runCountdown}
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${SEC})`, color: '#000',
                border: 'none', borderRadius: 14, padding: '14px 36px',
                fontSize: 16, fontWeight: 800, cursor: 'pointer',
                boxShadow: `0 8px 30px -8px ${ACCENT}, 0 0 0 1px rgba(255,255,255,0.1) inset`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 14px 40px -8px ${ACCENT}`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 30px -8px ${ACCENT}`; }}
            >
              ▶ Start Game
            </button>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}>Arrow keys or WASD to move</div>
          </div>
        )}

        {/* Dead overlay */}
        {status === 'dead' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,6,8,0.88)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div style={{ fontSize: 40, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>💀</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Game Over</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 36, fontWeight: 900, color: ACCENT, textShadow: `0 0 30px ${ACCENT}66` }}>{score.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', textTransform: 'uppercase' }}>Final score</div>
            {allowRestart ? (
              <button onClick={runCountdown}
                style={{
                  background: 'rgba(255,255,255,0.06)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
                  padding: '10px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 6,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${ACCENT}15`; e.currentTarget.style.borderColor = `${ACCENT}40`; e.currentTarget.style.color = ACCENT; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
              >
                ↻ Play Again
              </button>
            ) : (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em' }}>
                Waiting for match to conclude...
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}>
        Arrow keys or WASD · Eat food to grow · Avoid walls
      </div>
    </div>
  );
};

export default SnakeGame;
