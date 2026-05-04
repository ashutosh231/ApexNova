import React, { useState, useMemo } from 'react';

const MAX_GUESSES = 10;
const RANGE = { min: 1, max: 250 };

const NumberGuessGame = ({ onGameOver, accent = '#f59e0b' }) => {
  const target = useMemo(() => RANGE.min + Math.floor(Math.random() * (RANGE.max - RANGE.min + 1)), []);
  const [guess, setGuess] = useState('');
  const [log, setLog] = useState([]);
  const [tries, setTries] = useState(0);
  const [done, setDone] = useState(false);

  const finalize = (score) => {
    setDone(true);
    window.setTimeout(() => onGameOver?.(Math.max(0, Math.round(score))), 450);
  };

  const submit = () => {
    if (done) return;
    const n = Number.parseInt(guess, 10);
    if (Number.isNaN(n) || n < RANGE.min || n > RANGE.max) return;
    const nt = tries + 1;
    setTries(nt);
    if (n === target) {
      const base = (MAX_GUESSES - nt + 1) * 110;
      const bonus = 500 - Math.min(250, Math.abs(n - RANGE.max / 2));
      setLog((l) => [...l, `${n} — nailed it in ${nt}`]);
      finalize(base + bonus * 0.2);
      return;
    }
    const hint = n < target ? 'higher ↑' : 'lower ↓';
    setLog((l) => [...l, `#${nt}: ${n} (${hint})`]);
    setGuess('');
    if (nt >= MAX_GUESSES) {
      setLog((l) => [...l, `Target was ${target}`]);
      finalize(80 + Math.max(0, 320 - Math.abs(target - n) * 3));
    }
  };

  return (
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", color: '#fff', maxWidth: 400, margin: '0 auto' }}>
      <p style={{ fontSize: 13, opacity: 0.55, textAlign: 'center' }}>Number Guessing Open • Pick {RANGE.min}–{RANGE.max}</p>
      <div style={{ marginTop: 16, padding: 18, borderRadius: 16, border: `1px solid ${accent}44`, background: 'rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="number"
            min={RANGE.min}
            max={RANGE.max}
            value={guess}
            disabled={done}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Guess"
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: 12,
              border: `2px solid ${accent}66`,
              background: '#09090b',
              color: '#fff',
              fontSize: 17,
              fontWeight: 700,
              outline: 'none',
            }}
          />
          <button
            type="button"
            disabled={done}
            onClick={submit}
            style={{
              padding: '0 22px',
              borderRadius: 12,
              border: 'none',
              background: accent,
              color: '#030712',
              fontWeight: 800,
              cursor: done ? 'default' : 'pointer',
            }}
          >
            Guess
          </button>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: accent, opacity: 0.9 }}>
          {Math.max(0, MAX_GUESSES - tries)} guesses left
        </div>
        <ul style={{ margin: '14px 0 0', paddingLeft: 18, fontSize: 13, lineHeight: 1.65, opacity: 0.85 }}>
          {log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NumberGuessGame;
