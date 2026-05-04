import React, { useState, useEffect, useMemo, useRef } from 'react';

/** Basic lexicon fragments for validation (solo-friendly). */
const LEX = new Set(
  [
    'APEX',
    'NOVA',
    'GAME',
    'PLAY',
    'WIN',
    'BLITZ',
    'WORD',
    'TEAM',
    'LANE',
    'RANK',
    'COIN',
    'ZONE',
    'MOVE',
    'FAST',
    'CORE',
    'MODE',
    'PVP',
    'CPU',
    'GOAL',
    'HERO',
    'MAP',
    'ONE',
    'TWO',
    'RED',
    'RUN',
    'TOP',
    'NEW',
    'OLD',
    'BIG',
    'BOX',
    'KEY',
    'NET',
    'WEB',
    'SKY',
    'SEA',
    'SUN',
    'ICE',
    'ORE',
    'ARE',
    'EAR',
    'ERA',
    'ART',
    'ARM',
    'ASH',
    'ASK',
    'BAD',
    'BAG',
    'BAR',
    'BAT',
    'BAY',
    'BED',
    'BOX',
    'BOY',
    'BUG',
    'BUS',
    'CAB',
    'CAN',
    'CAP',
    'CAR',
    'CAT',
    'COG',
    'COW',
    'CRY',
    'CUB',
    'CUT',
    'DAD',
    'DAM',
    'DAY',
    'DEN',
    'DOT',
    'DRY',
    'DUG',
    'ELF',
    'ELK',
    'EMU',
    'END',
    'ERA',
    'EVE',
    'EYE',
    'FAN',
    'FAR',
    'FAT',
    'FAX',
    'FIR',
    'FIT',
    'FIX',
    'FLY',
    'FOG',
    'FOR',
    'FOX',
    'FUN',
    'FRY',
    'GAP',
    'GAS',
    'GNU',
    'GOT',
    'GUM',
    'GUN',
    'GYM',
    'HAT',
    'HAY',
    'HIP',
    'HIT',
    'HOG',
    'HOW',
    'HUB',
    'HUH',
    'HUG',
    'IMP',
    'INK',
    'ION',
    'JAM',
    'JAR',
    'JOG',
    'JOY',
    'JUG',
    'KEY',
    'KID',
    'KIT',
    'LAB',
    'LAG',
    'LAP',
    'LAW',
    'LAY',
    'LEG',
    'LET',
    'LOG',
    'LOT',
    'LOW',
    'MAD',
    'MAN',
    'MAP',
    'MAT',
    'MAY',
    'MID',
    'MIX',
    'MOG',
    'MOM',
    'MUD',
    'NAP',
    'NEL',
    'NET',
    'NEW',
    'NIL',
    'NOD',
    'NOT',
    'NOW',
    'NUN',
    'OAK',
    'ODD',
    'OFF',
    'OLD',
    'ONE',
    'OPT',
    'ORB',
    'ORE',
    'OUR',
    'OUT',
    'OWL',
    'OWN',
    'PAD',
    'PAN',
    'PAT',
    'PAW',
    'PEG',
    'PEN',
    'PET',
    'PIE',
    'PIG',
    'PIN',
    'PIP',
    'PIT',
    'POP',
    'POT',
    'PUT',
    'RAG',
    'RAN',
    'RAP',
    'RAT',
    'RAW',
    'RAY',
    'RED',
    'REM',
    'REV',
    'RIB',
    'RID',
    'RIP',
    'ROB',
    'ROD',
    'ROT',
    'ROW',
    'RUG',
    'RUN',
    'RUT',
    'RYE',
    'SAP',
    'SAT',
    'SAW',
    'SAX',
    'SEA',
    'SET',
    'SEW',
    'SIX',
    'SKI',
    'SKY',
    'SLY',
    'SOY',
    'SPA',
    'SPY',
    'STY',
    'SUB',
    'SUM',
    'SUN',
    'TAB',
    'TAG',
    'TAN',
    'TAP',
    'TEA',
    'TEN',
    'THE',
    'TIK',
    'TIL',
    'TIN',
    'TIP',
    'TOO',
    'TOP',
    'TOW',
    'TOY',
    'TRY',
    'TUB',
    'TUG',
    'TWO',
    'URN',
    'USE',
    'VAN',
    'VAT',
    'VIA',
    'VIE',
    'WAR',
    'WAS',
    'WAX',
    'WAY',
    'WHO',
    'WHY',
    'WOK',
    'WON',
    'WOW',
    'YAK',
    'YAM',
    'YAP',
    'YEA',
    'YES',
    'YET',
    'YIN',
    'YOU',
    'ZAP',
    'ZIP',
    'ZONE',
    'ROSE',
    'TONE',
    'NOTE',
    'TUNE',
    'STUN',
    'POST',
    'MOST',
    'NEST',
    'REST',
    'TEST',
    'BEST',
    'FAST',
    'LAST',
    'CAST',
    'VAST',
    'RATE',
    'GATE',
    'MATE',
    'SAFE',
    'CAFE',
  ].map((w) => w.toUpperCase())
);

function canSpellFromLetters(word, rack) {
  const counts = rack.split('').reduce((m, ch) => {
    m[ch] = (m[ch] || 0) + 1;
    return m;
  }, {});
  for (const ch of word) {
    if (!counts[ch]) return false;
    counts[ch] -= 1;
  }
  return true;
}

function randomRack() {
  const pool = 'APEXNOVAGAMINGTOURNPICK'.split('');
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 11).join('').toUpperCase();
}

const ROUND_SEC = 40;

const WordBlitzGame = ({ onGameOver, accent = '#fb7185' }) => {
  const rack = useMemo(() => randomRack(), []);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [secs, setSecs] = useState(ROUND_SEC);
  const [used, setUsed] = useState(new Set());
  const [msg, setMsg] = useState('');
  const scoreRef = useRef(0);
  scoreRef.current = score;

  useEffect(() => {
    const iv = window.setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          window.clearInterval(iv);
          window.setTimeout(() => onGameOver?.(Math.max(0, scoreRef.current) >>> 0), 380);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(iv);
  }, [onGameOver]);

  const submit = () => {
    const w = input.trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (w.length < 3 || secs <= 0) return;
    if (used.has(w)) {
      setMsg('Already used');
      return;
    }
    if (!LEX.has(w)) {
      setMsg('Not in blitz lexicon — try shorter words');
      return;
    }
    if (!canSpellFromLetters(w, rack)) {
      setMsg('Letters not available on rack');
      return;
    }
    const pts = 40 + w.length * 18;
    setScore((sc) => sc + pts);
    setUsed(new Set([...used, w]));
    setInput('');
    setMsg(`+${pts} — ${w}`);
  };

  return (
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", color: '#fff', maxWidth: 440, margin: '0 auto' }}>
      <p style={{ fontSize: 13, opacity: 0.55, textAlign: 'center' }}>Word Blitz Invitational • {secs}s • score {score}</p>
      <div
        style={{
          textAlign: 'center',
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: 10,
          color: accent,
          marginBottom: 16,
        }}
      >
        {rack.split('').join(' ')}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Type a word (3+ chars)"
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 12,
            border: `2px solid ${accent}66`,
            background: '#09090b',
            color: '#fff',
          }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={secs <= 0}
          style={{
            padding: '0 20px',
            borderRadius: 12,
            border: 'none',
            fontWeight: 800,
            background: accent,
            color: '#1a0508',
            cursor: secs <= 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Submit
        </button>
      </div>
      <div style={{ marginTop: 10, fontSize: 13, color: accent, minHeight: 20 }}>{msg}</div>
      <div style={{ marginTop: 12, fontSize: 11, opacity: 0.45 }}>
        Words must be in-game dictionary and use only rack letters (Scrabble-style counts).
      </div>
    </div>
  );
};

export default WordBlitzGame;
