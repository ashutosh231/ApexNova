import React, { useState, useMemo } from 'react';

const MAX_GUESSES = 10;
const RANGE = { min: 1, max: 250 };
const MONO = "'JetBrains Mono', monospace";

const NumberGuessGame = ({ onGameOver, accent = '#facc15', secondary = '#f59e0b' }) => {
  const target = useMemo(() => RANGE.min + Math.floor(Math.random() * (RANGE.max - RANGE.min + 1)), []);
  const [guess, setGuess] = useState('');
  const [log, setLog] = useState([]);
  const [tries, setTries] = useState(0);
  const [done, setDone] = useState(false);
  const [hint, setHint] = useState(null); // { dir: 'higher'|'lower', last: number }

  const finalize = (score) => {
    setDone(true);
    window.setTimeout(() => onGameOver?.(Math.max(0, Math.round(score))), 600);
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
      setLog((l) => [...l, { type: 'win', n, msg: `Nailed it in ${nt} ${nt === 1 ? 'guess' : 'guesses'}!` }]);
      setHint({ dir: 'win', last: n });
      finalize(base + bonus * 0.2);
      return;
    }
    const dir = n < target ? 'higher' : 'lower';
    setHint({ dir, last: n });
    setLog((l) => [...l, { type: 'guess', n, dir, tryNo: nt }]);
    setGuess('');
    if (nt >= MAX_GUESSES) {
      setLog((l) => [...l, { type: 'reveal', n: target }]);
      setHint({ dir: 'lose', last: n });
      finalize(80 + Math.max(0, 320 - Math.abs(target - n) * 3));
    }
  };

  const tries_left = Math.max(0, MAX_GUESSES - tries);
  const pct = (tries / MAX_GUESSES) * 100;

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#fff', maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header strip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderRadius: 14,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.5)' }}>Range</div>
          <div style={{ fontWeight: 900, fontSize: 16, color: '#fff', fontFamily: MONO }}>
            {RANGE.min} – {RANGE.max}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent }}>Tries left</div>
          <div style={{ fontWeight: 900, fontSize: 22, color: accent, fontFamily: MONO, textShadow: `0 0 16px ${accent}55` }}>{tries_left}</div>
        </div>
      </div>

      {/* Hint dial */}
      <div style={{
        position: 'relative',
        padding: '24px 20px',
        borderRadius: 20,
        background: `linear-gradient(135deg, ${accent}12, ${secondary}10)`,
        border: `1px solid ${accent}30`,
        textAlign: 'center',
        boxShadow: `0 14px 36px -16px rgba(0,0,0,0.6), 0 0 30px -12px ${accent}40`,
      }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.5)', marginBottom: 6 }}>
          Hint
        </div>
        {hint ? (
          <div>
            <div style={{ fontWeight: 900, fontSize: 32, color: '#fff', marginBottom: 4 }}>
              {hint.last}
            </div>
            <div style={{
              fontFamily: MONO, fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: hint.dir === 'win' ? '#10b981' : hint.dir === 'lose' ? '#fb7185' : accent,
            }}>
              {hint.dir === 'win' && '✓ EXACT'}
              {hint.dir === 'lose' && '✗ OUT OF GUESSES'}
              {hint.dir === 'higher' && '↑ TRY HIGHER'}
              {hint.dir === 'lower' && '↓ TRY LOWER'}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontWeight: 900, fontSize: 32, color: 'rgba(235,235,235,0.4)', marginBottom: 4 }}>?</div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: 'rgba(235,235,235,0.55)', letterSpacing: '0.12em' }}>
              Make your first guess
            </div>
          </div>
        )}

        {/* Progress ring */}
        <div style={{ marginTop: 14, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`, borderRadius: 999,
            background: `linear-gradient(90deg, ${accent}, ${secondary})`,
            boxShadow: `0 0 10px ${accent}66`,
            transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>
      </div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="number"
          min={RANGE.min}
          max={RANGE.max}
          value={guess}
          disabled={done}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Guess a number"
          style={{
            flex: 1,
            padding: '13px 16px',
            borderRadius: 12,
            border: `1px solid ${accent}40`,
            background: 'rgba(0,0,0,0.3)',
            color: '#fff',
            fontSize: 18,
            fontWeight: 800,
            fontFamily: MONO,
            outline: 'none',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => (e.target.style.borderColor = accent)}
          onBlur={(e) => (e.target.style.borderColor = `${accent}40`)}
        />
        <button
          type="button"
          disabled={done || !guess}
          onClick={submit}
          style={{
            padding: '0 24px',
            borderRadius: 12,
            border: 'none',
            background: `linear-gradient(135deg, ${accent}, ${secondary})`,
            color: '#0a0a0c',
            fontWeight: 900,
            fontSize: 14,
            cursor: done || !guess ? 'not-allowed' : 'pointer',
            opacity: done || !guess ? 0.5 : 1,
            boxShadow: `0 6px 20px -6px ${accent}`,
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => { if (!done && guess) e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          Guess
        </button>
      </div>

      {/* History */}
      {log.length > 0 && (
        <div style={{
          padding: '12px 14px', borderRadius: 12,
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
          maxHeight: 160, overflowY: 'auto',
        }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.4)', marginBottom: 8 }}>
            History
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {log.map((entry, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 10px', borderRadius: 8,
                background: entry.type === 'win' ? 'rgba(16,185,129,0.08)' : entry.type === 'reveal' ? 'rgba(251,113,133,0.08)' : 'rgba(255,255,255,0.025)',
                border: `1px solid ${entry.type === 'win' ? 'rgba(16,185,129,0.25)' : entry.type === 'reveal' ? 'rgba(251,113,133,0.25)' : 'rgba(255,255,255,0.04)'}`,
                fontFamily: MONO,
                fontSize: 12,
              }}>
                {entry.type === 'win' && <><span style={{ color: '#10b981', fontWeight: 800 }}>✓ {entry.n}</span><span style={{ color: 'rgba(235,235,235,0.6)' }}>{entry.msg}</span></>}
                {entry.type === 'guess' && <><span style={{ color: '#fff' }}>#{entry.tryNo} · {entry.n}</span><span style={{ color: entry.dir === 'higher' ? accent : '#a78bfa', letterSpacing: '0.1em', fontWeight: 700 }}>{entry.dir === 'higher' ? '↑ HIGHER' : '↓ LOWER'}</span></>}
                {entry.type === 'reveal' && <><span style={{ color: '#fb7185', fontWeight: 800 }}>Target: {entry.n}</span><span style={{ color: 'rgba(235,235,235,0.6)' }}>Out of tries</span></>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NumberGuessGame;
