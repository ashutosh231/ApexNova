import React, { useState, useEffect, useRef, useCallback } from 'react';

const PALETTE = ['#ccff00', '#f97316', '#38bdf8', '#a855f7'];
const FLASH_MS = 420;
const TOTAL_LEVELS = 7;

const ColorSurgeGame = ({ onGameOver }) => {
  const [phase, setPhase] = useState('watch'); // watch | replay | over
  const [seq, setSeq] = useState([]);
  const [lit, setLit] = useState(null);
  const [level, setLevel] = useState(1);
  const [replayIdx, setReplayIdx] = useState(0);
  const timeouts = useRef([]);

  useEffect(() => () => timeouts.current.forEach(window.clearTimeout), []);

  const playSeq = useCallback((fullSeq) => {
    setPhase('watch');
    setLit(null);
    let i = 0;
    const run = () => {
      if (i >= fullSeq.length) {
        setPhase('replay');
        setReplayIdx(0);
        return;
      }
      const ci = fullSeq[i];
      setLit(ci);
      timeouts.current.push(
        window.setTimeout(() => setLit(null), FLASH_MS),
        window.setTimeout(() => {
          i += 1;
          run();
        }, FLASH_MS + 180)
      );
    };
    run();
  }, []);

  useEffect(() => {
    const first = [Math.floor(Math.random() * PALETTE.length)];
    setSeq(first);
    playSeq(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial sequence only
  }, []);

  const tapColor = (ci) => {
    if (phase !== 'replay' || replayIdx >= seq.length) return;
    if (ci !== seq[replayIdx]) {
      const score = (level - 1) * 240;
      setPhase('over');
      window.setTimeout(() => onGameOver?.(Math.max(120, score) >>> 0), 380);
      return;
    }
    const nextReplay = replayIdx + 1;
    if (nextReplay === seq.length) {
      if (seq.length >= TOTAL_LEVELS) {
        const score = 900 + seq.length * 260;
        setPhase('over');
        window.setTimeout(() => onGameOver?.(score >>> 0), 380);
        return;
      }
      const nextSeq = [...seq, Math.floor(Math.random() * PALETTE.length)];
      setSeq(nextSeq);
      setReplayIdx(0);
      setLevel(nextSeq.length);
      timeouts.current.push(window.setTimeout(() => playSeq(nextSeq), 320));
      return;
    }
    setReplayIdx(nextReplay);
  };

  return (
    <div style={{ textAlign: 'center', fontFamily: "'Space Grotesk',sans-serif", color: '#fff', maxWidth: 400 }}>
      <p style={{ fontSize: 12, opacity: 0.55, marginBottom: 16 }}>
        Color Surge Weekly • Pattern {phase === 'replay' ? `${replayIdx + 1}/${seq.length}` : '—'} • Level {Math.min(level, TOTAL_LEVELS)}/{TOTAL_LEVELS}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, justifyContent: 'center' }}>
        {PALETTE.map((c, ci) => (
          <button
            key={c}
            type="button"
            disabled={phase !== 'replay'}
            onClick={() => tapColor(ci)}
            style={{
              height: 100,
              borderRadius: 16,
              border: 'none',
              cursor: phase === 'replay' ? 'pointer' : 'default',
              background: lit === ci ? `${c}` : `${c}33`,
              opacity: lit === ci ? 1 : phase === 'watch' ? 0.72 : 0.55,
              boxShadow: lit === ci ? `0 0 32px ${c}aa` : 'none',
            }}
          />
        ))}
      </div>
      <p style={{ marginTop: 14, fontSize: 13, color: PALETTE[0] }}>
        {phase === 'watch' ? 'Watch the surge…' : phase === 'replay' ? 'Repeat the pattern' : 'Finished'}
      </p>
    </div>
  );
};

export default ColorSurgeGame;
