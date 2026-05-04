import React, { useState, useEffect, useRef } from 'react';

const ROUND_SEC = 50;

function makeQuestion(diff) {
  const a = 2 + Math.floor(Math.random() * 22);
  const b = 2 + Math.floor(Math.random() * 16);
  if (diff === 1) {
    return { q: `${a} + ${b}`, ans: String(a + b) };
  }
  const c = 2 + Math.floor(Math.random() * 12);
  return { q: `${a} + ${b} × ${c}`, ans: String(a + b * c) };
}

const MathRushGame = ({ onGameOver, accent = '#818cf8' }) => {
  const [ticks, setTicks] = useState(ROUND_SEC);
  const [current, setCurrent] = useState(() => makeQuestion(0));
  const [guess, setGuess] = useState('');
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  scoreRef.current = score;
  const nRef = useRef(0);

  useEffect(() => {
    const iv = window.setInterval(() => {
      setTicks((t) => {
        if (t <= 1) {
          window.clearInterval(iv);
          window.setTimeout(() => onGameOver?.(scoreRef.current >>> 0), 350);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(iv);
  }, [onGameOver]);

  const submit = () => {
    if (ticks <= 0) return;
    const ok = guess.trim() === current.ans;
    if (ok) {
      const add = score >= 220 ? 115 : 75;
      setScore((s) => {
        const next = s + add;
        setCurrent(makeQuestion(next >= 220 ? 1 : 0));
        return next;
      });
    } else {
      setCurrent(makeQuestion(score >= 220 ? 1 : 0));
    }
    nRef.current += 1;
    setGuess('');
  };

  return (
    <div style={{ fontFamily: "'JetBrains Mono',monospace", color: '#fff', maxWidth: 420 }}>
      <div style={{ textAlign: 'center', fontSize: 12, opacity: 0.55, marginBottom: 14 }}>
        Math Rush Championship • {ticks}s • score {score}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          textAlign: 'center',
          color: accent,
          marginBottom: 18,
          letterSpacing: '-0.04em',
        }}
      >
        {current.q} = ?
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          value={guess}
          onChange={(e) => setGuess(e.target.value.replace(/[^\d-]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Answer"
          style={{
            flex: 1,
            padding: '12px 14px',
            borderRadius: 12,
            border: `2px solid ${accent}`,
            background: '#09090b',
            color: '#fff',
            fontSize: 18,
          }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={ticks <= 0}
          style={{
            padding: '0 22px',
            borderRadius: 12,
            border: 'none',
            background: accent,
            fontWeight: 800,
            color: '#0c0c12',
            cursor: ticks <= 0 ? 'not-allowed' : 'pointer',
          }}
        >
          OK
        </button>
      </div>
      <div style={{ marginTop: 10, fontSize: 11, opacity: 0.4 }}>Order of operations counts (multiply before add).</div>
    </div>
  );
};

export default MathRushGame;
