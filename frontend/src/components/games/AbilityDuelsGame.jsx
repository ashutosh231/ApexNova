import React, { useState, useCallback } from 'react';

const ABILITIES = [
  { id: 'strike', label: 'Strike', emoji: '⚡', blurb: 'Breaks Burst' },
  { id: 'guard', label: 'Guard', emoji: '🛡', blurb: 'Blocks Strike' },
  { id: 'burst', label: 'Burst', emoji: '💥', blurb: 'Overwhelms Guard' },
];

function outcome(player, cpu) {
  if (player === cpu) return 'draw';
  if (
    (player === 'strike' && cpu === 'burst') ||
    (player === 'burst' && cpu === 'guard') ||
    (player === 'guard' && cpu === 'strike')
  )
    return 'win';
  return 'loss';
}

const ROUNDS = 7;

const AbilityDuelsGame = ({ onGameOver, accent = '#ccff00', secondary = '#f97316' }) => {
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [lastYou, setLastYou] = useState(null);
  const [msg, setMsg] = useState('Pick an ability — best of 7');

  const finish = useCallback(
    (final) => {
      window.setTimeout(() => onGameOver?.(final >>> 0), 450);
    },
    [onGameOver]
  );

  const pick = (you) => {
    if (round > ROUNDS) return;
    let cpu = ABILITIES[Math.floor(Math.random() * 3)].id;
    if (lastYou && Math.random() < 0.38) {
      const beats = { strike: 'guard', guard: 'burst', burst: 'strike' };
      cpu = beats[lastYou] || cpu;
    }
    const res = outcome(you, cpu);
    const pts = res === 'win' ? 185 : res === 'draw' ? 62 : 18;
    const nextScore = score + pts;
    setScore(nextScore);
    setLastYou(you);
    const youLab = ABILITIES.find((a) => a.id === you)?.emoji;
    const cpuLab = ABILITIES.find((a) => a.id === cpu)?.emoji;
    setMsg(`${youLab} vs ${cpuLab} — ${res.toUpperCase()} (+${pts})`);

    if (round >= ROUNDS) {
      const streakBonus = nextScore > 900 ? 140 : 60;
      finish(nextScore + streakBonus);
      return;
    }
    setRound((r) => r + 1);
  };

  return (
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", color: '#fff', maxWidth: 460, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: 12, opacity: 0.55, marginBottom: 6 }}>Ability Duels Cup • Round {Math.min(round, ROUNDS)}/{ROUNDS}</div>
      <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 4, color: accent }}>{score}</div>
      <div style={{ fontSize: 12, opacity: 0.45, marginBottom: 16 }}>running duel score</div>
      <p style={{ fontSize: 14, color: secondary, minHeight: 44 }}>{msg}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 8 }}>
        {ABILITIES.map((a) => (
          <button
            key={a.id}
            type="button"
            disabled={round > ROUNDS}
            onClick={() => pick(a.id)}
            style={{
              padding: '18px 10px',
              borderRadius: 16,
              border: `2px solid ${accent}44`,
              background: `linear-gradient(160deg, ${accent}12, rgba(255,255,255,0.03))`,
              cursor: round > ROUNDS ? 'default' : 'pointer',
              color: '#fff',
            }}
          >
            <div style={{ fontSize: 34, marginBottom: 8 }}>{a.emoji}</div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{a.label}</div>
            <div style={{ fontSize: 10, opacity: 0.45, marginTop: 6 }}>{a.blurb}</div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 18, fontSize: 11, opacity: 0.38, lineHeight: 1.5 }}>
        ⚡ Strike beats 💥 Burst • 💥 Burst beats 🛡 Guard • 🛡 Guard beats ⚡ Strike
      </div>
    </div>
  );
};

export default AbilityDuelsGame;
