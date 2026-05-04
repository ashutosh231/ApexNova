/**
 * Full tournament data — browse grid + Bloom filters for search.
 */

export const ALL_TOURNAMENTS = [
  /* ── Original 5 ── */
  {
    id: 'snake-championship',
    emoji: '🐍',
    name: 'Snake Championship',
    game: 'Snake',
    category: 'Arcade',
    difficulty: 'Medium',
    players: '2,048 / 4,096',
    prize: '$5,000',
    tagLabel: 'LIVE',
    isLive: true,
    timeLeft: '2h 14m',
    gradStart: 'rgba(204,255,0,0.22)',
    coverImage:
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=70',
  },
  {
    id: 'tictactoe-masters',
    emoji: '❌',
    name: 'Tic Tac Toe Masters',
    game: 'Tic Tac Toe',
    category: 'Strategy',
    difficulty: 'Easy',
    players: '512 / 512',
    prize: '$2,000',
    tagLabel: 'FINALS',
    isLive: false,
    timeLeft: '48m',
    gradStart: 'rgba(16,185,129,0.18)',
    coverImage:
      'https://images.unsplash.com/photo-1523875194681-bedd468c58bf?auto=format&fit=crop&w=800&q=70',
  },
  {
    id: 'reaction-speed-cup',
    emoji: '⚡',
    name: 'Reaction Speed Cup',
    game: 'Reaction Test',
    category: 'Reflex',
    difficulty: 'Hard',
    players: '1,234 / 2,000',
    prize: '$3,500',
    tagLabel: 'REGISTERING',
    isLive: false,
    timeLeft: 'Starts in 3h',
    gradStart: 'rgba(56,189,248,0.18)',
    coverImage:
      'https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=800&q=70',
  },
  {
    id: 'memory-grand-prix',
    emoji: '🧠',
    name: 'Memory Grand Prix',
    game: 'Memory Match',
    category: 'Puzzle',
    difficulty: 'Medium',
    players: '800 / 1,024',
    prize: '$4,200',
    tagLabel: 'OPEN',
    isLive: false,
    timeLeft: 'Starts in 1d',
    gradStart: 'rgba(167,139,250,0.2)',
    coverImage:
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=75',
  },
  {
    id: 'number-guessing-open',
    emoji: '🔢',
    name: 'Number Guessing Open',
    game: 'Number Guessing',
    category: 'Puzzle',
    difficulty: 'Easy',
    players: '640 / 1,000',
    prize: '$1,500',
    tagLabel: 'OPEN',
    isLive: false,
    timeLeft: 'Starts in 2d',
    gradStart: 'rgba(245,158,11,0.18)',
    coverImage:
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=70',
  },

  /* ── 5 New Games ── */
  {
    id: 'word-blitz-invitational',
    emoji: '📝',
    name: 'Word Blitz Invitational',
    game: 'Word Blitz',
    category: 'Word',
    difficulty: 'Medium',
    players: '1,100 / 2,048',
    prize: '$3,000',
    tagLabel: 'LIVE',
    isLive: true,
    timeLeft: '1h 05m',
    gradStart: 'rgba(251,113,133,0.2)',
    coverImage:
      'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=70',
  },
  {
    id: 'chess-blitz-open',
    emoji: '♟️',
    name: 'Chess Blitz Open',
    game: 'Chess Blitz',
    category: 'Strategy',
    difficulty: 'Hard',
    players: '2,000 / 2,048',
    prize: '$10,000',
    tagLabel: 'FINALS',
    isLive: false,
    timeLeft: '30m',
    gradStart: 'rgba(255,255,255,0.14)',
    coverImage:
      'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=70',
  },
  {
    id: 'pixel-memory-ultra',
    emoji: '🧩',
    name: 'Pixel Memory Ultra',
    game: 'Memory Match',
    category: 'Puzzle',
    difficulty: 'Medium',
    players: '900 / 2,000',
    prize: '$6,000',
    tagLabel: 'REGISTERING',
    isLive: false,
    timeLeft: 'Starts in 5h',
    gradStart: 'rgba(255,0,255,0.18)',
    coverImage:
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=70',
  },
  {
    id: 'color-surge-weekly',
    emoji: '🎨',
    name: 'Color Surge Weekly',
    game: 'Color Surge',
    category: 'Reflex',
    difficulty: 'Easy',
    players: '400 / 1,024',
    prize: '$800',
    tagLabel: 'OPEN',
    isLive: false,
    timeLeft: 'Starts in 3d',
    gradStart: 'rgba(204,255,0,0.14)',
    coverImage:
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=70',
  },
  {
    id: 'math-rush-championship',
    emoji: '➕',
    name: 'Math Rush Championship',
    game: 'Math Rush',
    category: 'Puzzle',
    difficulty: 'Hard',
    players: '750 / 1,500',
    prize: '$5,500',
    tagLabel: 'LIVE',
    isLive: true,
    timeLeft: '45m',
    gradStart: 'rgba(56,189,248,0.14)',
    coverImage:
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=70',
  },
  {
    id: 'math-maze-open',
    emoji: '🧭',
    name: 'Math Maze Open',
    game: 'Math Maze',
    category: 'Puzzle',
    difficulty: 'Medium',
    players: '620 / 900',
    prize: '$3,200',
    tagLabel: 'OPEN',
    isLive: false,
    timeLeft: 'Starts in 18h',
    gradStart: 'rgba(129,140,248,0.22)',
    coverImage:
      'https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=800&q=75',
  },
  {
    id: 'ability-duels-cup',
    emoji: '⚔️',
    name: 'Ability Duels Cup',
    game: 'Ability Duels',
    category: 'Strategy',
    difficulty: 'Medium',
    players: '1,420 / 2,048',
    prize: '$4,800',
    tagLabel: 'REGISTERING',
    isLive: false,
    timeLeft: 'Starts in 6h',
    gradStart: 'rgba(204,255,0,0.18)',
    coverImage:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=70',
  },
];

/* ─────────────────────────────────────────────────────────
   Bloom Filter  — Probabilistic membership check for search.
   Uses k=3 independent hash functions over a Uint8Array bit-array.
   Ideal for fast "definitely NOT a match" short-circuit.
──────────────────────────────────────────────────────────── */
export class BloomFilter {
  /**
   * @param {number} size   – bit-array size (number of bits). Default 2048.
   * @param {number} k      – number of hash functions. Default 3.
   */
  constructor(size = 2048, k = 3) {
    this.size = size;
    this.k = k;
    this.bits = new Uint8Array(Math.ceil(size / 8));
  }

  /** FNV-1a inspired — produces different hashes by seeding with `seed`. */
  _hash(str, seed) {
    let h = 0x811c9dc5 ^ seed;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0) % this.size;
  }

  _setBit(pos) {
    this.bits[pos >> 3] |= 1 << (pos & 7);
  }

  _getBit(pos) {
    return (this.bits[pos >> 3] >> (pos & 7)) & 1;
  }

  /** Add a token to the filter. */
  add(token) {
    const t = token.toLowerCase();
    for (let i = 0; i < this.k; i++) this._setBit(this._hash(t, i * 0x5bd1e995));
  }

  /** Returns false → definitely NOT in set. Returns true → probably in set. */
  mightContain(token) {
    const t = token.toLowerCase();
    for (let i = 0; i < this.k; i++) {
      if (!this._getBit(this._hash(t, i * 0x5bd1e995))) return false;
    }
    return true;
  }
}

/**
 * Pre-builds one BloomFilter per tournament containing
 * all searchable tokens: name words, game name, category, difficulty, tag.
 */
export function buildFilters(tournaments) {
  return tournaments.map(t => {
    const bf = new BloomFilter();
    const tokens = [
      ...t.name.split(/\s+/),
      ...t.game.split(/\s+/),
      t.category,
      t.difficulty,
      t.tagLabel,
      t.emoji,
    ];
    tokens.forEach(tok => bf.add(tok));
    return bf;
  });
}
