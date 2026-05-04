import React, { useState, useEffect, useRef, useCallback } from 'react';

const ROUNDS = 5;

/** Score per round from reaction time ms (fast = high). */
function scoreFromMs(ms) {
  return Math.max(0, Math.round(2800 - ms));
}

const ReactionGame = ({ onGameOver, accent = '#38bdf8' }) => {
  const [ui, setUi] = useState({ label: 'Get ready…', flash: false, roundDisplay: 1 });
  const scoreRef = useRef(0);
  const [, bump] = useState(0);
  const roundRef = useRef(1);
  const phaseRef = useRef('arming'); // arming | green | over
  const greenAtRef = useRef(0);
  const timerRef = useRef(null);

  const finishIfDone = useCallback(() => {
    if (roundRef.current > ROUNDS)
      window.setTimeout(() => onGameOver?.(Math.max(0, scoreRef.current) >>> 0), 350);
  }, [onGameOver]);

  const armRound = useCallback(() => {
    phaseRef.current = 'arming';
    setUi({ label: 'Wait for green…', flash: false, roundDisplay: roundRef.current });
    if (timerRef.current) window.clearTimeout(timerRef.current);
    const delay = 700 + Math.random() * 2000;
    timerRef.current = window.setTimeout(() => {
      greenAtRef.current = performance.now();
      phaseRef.current = 'green';
      setUi((u) => ({ ...u, label: 'CLICK!', flash: true }));
    }, delay);
  }, []);

  useEffect(() => {
    armRound();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [armRound]);

  const tap = useCallback(() => {
    if (phaseRef.current === 'over') return;
    if (phaseRef.current === 'arming') {
      scoreRef.current = Math.max(0, scoreRef.current - 180);
      bump((n) => n + 1);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setUi((u) => ({ ...u, label: 'Too early — −180', flash: false }));
      window.setTimeout(armRound, 450);
      return;
    }
    if (phaseRef.current !== 'green') return;
    const ms = performance.now() - greenAtRef.current;
    scoreRef.current += scoreFromMs(ms);
    bump((n) => n + 1);
    phaseRef.current = 'armed_between';
    roundRef.current += 1;
    if (roundRef.current > ROUNDS) {
      phaseRef.current = 'over';
      setUi({ label: 'Finished', flash: false, roundDisplay: ROUNDS });
      finishIfDone();
      return;
    }
    armRound();
  }, [armRound, finishIfDone]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        tap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tap]);

  const flashColor = ui.flash ? accent : 'rgba(255,255,255,0.07)';

  return (
    <div style={{ textAlign: 'center', fontFamily: "'JetBrains Mono',monospace", color: '#fff', maxWidth: 420 }}>
      <p style={{ fontSize: 12, opacity: 0.55, marginBottom: 14 }}>
        Reaction Speed Cup • Round {Math.min(ui.roundDisplay, ROUNDS)}/{ROUNDS}
      </p>
      <button
        type="button"
        onClick={tap}
        style={{
          width: 'min(340px, 90vw)',
          height: 200,
          borderRadius: 20,
          border: `3px solid ${accent}`,
          background: flashColor,
          color: ui.flash ? '#030712' : '#fff',
          fontSize: ui.flash ? 30 : 16,
          fontWeight: 800,
          cursor: 'pointer',
        }}
      >
        {ui.label}
      </button>
      <div style={{ marginTop: 14, fontSize: 13, color: accent }}>Score: {Math.max(0, scoreRef.current)}</div>
      <div style={{ marginTop: 6, fontSize: 11, opacity: 0.38 }}>Tap or Space</div>
    </div>
  );
};

export default ReactionGame;
