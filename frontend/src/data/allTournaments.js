/**
 * Tournament data — 6 featured games.
 * Bloom filters for instant search.
 */

export const ALL_TOURNAMENTS = [
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
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=75',
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
    gradStart: 'rgba(249,115,22,0.20)',
    coverImage:
      'https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=800&q=75',
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
    tagLabel: 'LIVE',
    isLive: true,
    timeLeft: '1h 30m',
    gradStart: 'rgba(167,139,250,0.2)',
    coverImage:
      'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?auto=format&fit=crop&w=800&q=75',
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
    gradStart: 'rgba(250,204,21,0.20)',
    coverImage:
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=75',
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
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=75',
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
    gradStart: 'rgba(96,165,250,0.20)',
    coverImage:
      'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=75',
  },
];

/* ─────────────────────────────────────────────────────────
   Bloom Filter — Probabilistic membership check for search.
──────────────────────────────────────────────────────────── */
export class BloomFilter {
  constructor(size = 2048, k = 3) {
    this.size = size;
    this.k = k;
    this.bits = new Uint8Array(Math.ceil(size / 8));
  }

  _hash(str, seed) {
    let h = 0x811c9dc5 ^ seed;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0) % this.size;
  }

  _setBit(pos) { this.bits[pos >> 3] |= 1 << (pos & 7); }
  _getBit(pos) { return (this.bits[pos >> 3] >> (pos & 7)) & 1; }

  add(token) {
    const t = token.toLowerCase();
    for (let i = 0; i < this.k; i++) this._setBit(this._hash(t, i * 0x5bd1e995));
  }

  mightContain(token) {
    const t = token.toLowerCase();
    for (let i = 0; i < this.k; i++) {
      if (!this._getBit(this._hash(t, i * 0x5bd1e995))) return false;
    }
    return true;
  }
}

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
