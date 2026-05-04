import React, { useEffect, useRef, useCallback, useState } from 'react';

const CELL = 20;
const COLS = 25;
const ROWS = 20;
const W    = CELL * COLS;
const H    = CELL * ROWS;
const LIME = '#ccff00';
const GREEN = '#10b981';

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

const SnakeGame = ({ onGameOver, playerName = 'You', autoStart = false, allowRestart = true }) => {
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

    // Food — pulsing circle
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
        ? LIME
        : `rgba(${16 + i * 2},${185 - i * 3},${129 - i * 2},${ratio})`;
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
        ctx.shadowColor = LIME;
        ctx.shadowBlur  = 12;
        ctx.fill();
        ctx.shadowBlur  = 0;
      }
    });
  }, []);

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* HUD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: W, padding: '0 4px' }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{playerName}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Score</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 800, color: LIME }}>{score.toLocaleString()}</span>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: status === 'playing' ? `0 0 40px rgba(204,255,0,0.15)` : 'none' }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ display: 'block' }} />

        {/* Countdown overlay */}
        {countdown !== null && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,6,8,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ fontSize: 13, color: LIME, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Get Ready</div>
            <div style={{ fontSize: 96, fontWeight: 900, color: LIME, lineHeight: 1, textShadow: `0 0 60px ${LIME}80` }}>{countdown}</div>
          </div>
        )}

        {/* Idle overlay */}
        {status === 'idle' && countdown === null && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,6,8,0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ fontSize: 48 }}>🐍</div>
            <button onClick={runCountdown}
              style={{ background: LIME, color: '#000', border: 'none', borderRadius: 12, padding: '12px 32px', fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: `0 0 30px rgba(204,255,0,0.35)` }}>
              Start Game
            </button>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Arrow keys or WASD to move</div>
          </div>
        )}

        {/* Dead overlay */}
        {status === 'dead' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,6,8,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ fontSize: 32 }}>💀</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Game Over</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: LIME, fontFamily: "'JetBrains Mono', monospace" }}>{score.toLocaleString()}</div>
            {allowRestart ? (
              <button onClick={runCountdown}
                style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
                Play Again
              </button>
            ) : (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
                Waiting for match to conclude...
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Arrow keys or WASD · Eat food to grow · Avoid walls</div>
    </div>
  );
};

export default SnakeGame;
