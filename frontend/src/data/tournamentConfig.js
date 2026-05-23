/**
 * Maps each tournament listing to a playable game backend key + UI theme +
 * lobby visual identity (icon, hero art, mood, tagline).
 *
 * Routes:
 *   /lobby/:slug   — unique themed lobby per tournament
 *   `usesMemoryShell` → /memory-match-room (retro chrome) for the actual play.
 */
import { ALL_TOURNAMENTS } from './allTournaments.js';

export const DEFAULT_TOURNAMENT_ID = 'snake-championship';
export const SESSION_TOURNAMENT_KEY = 'apexnova_active_tournament';
export const SESSION_GAME_KEY = 'apexnova_active_game';

/* ── Per-tournament configuration ─────────────────────── */
const RAW = {
  'snake-championship': {
    backendGame: 'snake', gameKey: 'snake',
    accent: '#ccff00', secondary: '#10b981',
    usesMemoryShell: false,
    slug: 'snake',
    icon: 'mdi:snake',
    iconAlt: 'tabler:zoom-in-area',
    tagline: 'Coil. Strike. Survive.',
    description: 'Snake the canvas, devour every dot, climb the global ladder. One wrong turn and the run is over.',
    pattern: 'serpentine',
    lobbyHeroImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80',
  },
  'tictactoe-masters': {
    backendGame: 'tic_tac_toe', gameKey: 'tic_tac_toe',
    accent: '#f97316', secondary: '#ef4444',
    usesMemoryShell: false,
    slug: 'tictactoe',
    icon: 'tabler:grid-3x3',
    iconAlt: 'tabler:circle-letter-x',
    tagline: 'Three in a row, every time.',
    description: 'Classic 3×3 mind game versus an adaptive bot. Best of three, instant rematch, instant glory.',
    pattern: 'grid',
    lobbyHeroImage: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=1920&q=80',
  },
  'memory-grand-prix': {
    backendGame: 'memory', gameKey: 'memory',
    accent: '#a78bfa', secondary: '#7c3aed',
    usesMemoryShell: true,
    slug: 'memory',
    icon: 'tabler:brain',
    iconAlt: 'tabler:cards',
    tagline: 'Train your recall. Race the clock.',
    description: 'Match every pair before time runs out. Fewer moves, faster clock, higher score.',
    pattern: 'cards',
    lobbyHeroImage: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?auto=format&fit=crop&w=1920&q=80',
  },
  'number-guessing-open': {
    backendGame: 'number', gameKey: 'number',
    accent: '#facc15', secondary: '#f59e0b',
    usesMemoryShell: false,
    slug: 'number',
    icon: 'tabler:numbers',
    iconAlt: 'tabler:target-arrow',
    tagline: 'One number. Ten guesses.',
    description: 'Pure deduction. Higher or lower? Your hint dial counts down. Lock it in fast or burn out.',
    pattern: 'numeric',
    lobbyHeroImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1920&q=80',
  },
  'pixel-memory-ultra': {
    backendGame: 'memory', gameKey: 'memory',
    accent: '#00ffff', secondary: '#ff00ff',
    usesMemoryShell: true,
    slug: 'pixel-memory',
    icon: 'tabler:device-gamepad-2',
    iconAlt: 'tabler:puzzle',
    tagline: 'Retro recall. Neon stakes.',
    description: 'Pixel-perfect match-up. Scanlines, CRT glow, every frame a flex. Pair up, pixel out.',
    pattern: 'scanlines',
    lobbyHeroImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1920&q=80',
  },
  'chess-blitz-open': {
    backendGame: 'chess', gameKey: 'chess',
    accent: '#60a5fa', secondary: '#6366f1',
    usesMemoryShell: false,
    slug: 'chess',
    icon: 'tabler:chess',
    iconAlt: 'tabler:crown',
    tagline: 'Calculated brutality.',
    description: 'Five minutes on the clock, every piece a vector. Outthink the engine, claim checkmate.',
    pattern: 'checkered',
    lobbyHeroImage: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=1920&q=80',
  },
};

/* ── Lookup helpers ───────────────────────────────────── */
const SLUG_TO_ID = Object.fromEntries(
  Object.entries(RAW).map(([id, cfg]) => [cfg.slug, id])
);

export function getTournamentBySlug(slug) {
  const id = SLUG_TO_ID[slug] || DEFAULT_TOURNAMENT_ID;
  return getTournamentConfig(id);
}

export function getTournamentConfig(tournamentId) {
  const id = RAW[tournamentId] ? tournamentId : DEFAULT_TOURNAMENT_ID;
  const meta = ALL_TOURNAMENTS.find((t) => t.id === id);
  const raw = RAW[id];
  return {
    id,
    label: meta?.name ?? 'Tournament',
    emoji: meta?.emoji ?? '🎮', // kept for legacy callsites; UI prefers `icon`
    coverImage: meta?.coverImage,
    prize: meta?.prize,
    players: meta?.players,
    difficulty: meta?.difficulty,
    timeLeft: meta?.timeLeft,
    tagLabel: meta?.tagLabel,
    isLive: meta?.isLive,
    ...raw,
  };
}

export function syncSessionFromTournament(tournamentId) {
  const c = getTournamentConfig(tournamentId);
  try {
    sessionStorage.setItem(SESSION_TOURNAMENT_KEY, c.id);
    sessionStorage.setItem(SESSION_GAME_KEY, c.backendGame);
  } catch {
    /* private mode */
  }
}

export function peekSessionGameKey() {
  try {
    return sessionStorage.getItem(SESSION_GAME_KEY);
  } catch {
    return null;
  }
}

export function peekSessionTournamentId() {
  try {
    return sessionStorage.getItem(SESSION_TOURNAMENT_KEY);
  } catch {
    return null;
  }
}

/** When only API `game` slug is known (e.g. friend invite), pick a default tournament id. */
export const BACKEND_GAME_DEFAULT_TOURNAMENT = {
  snake: 'snake-championship',
  tic_tac_toe: 'tictactoe-masters',
  memory: 'memory-grand-prix',
  number: 'number-guessing-open',
  chess: 'chess-blitz-open',
};

export function getTournamentFromBackendGame(backendGame) {
  const tid = BACKEND_GAME_DEFAULT_TOURNAMENT[backendGame] || DEFAULT_TOURNAMENT_ID;
  return getTournamentConfig(tid);
}

/** All tournaments in display order — useful for nav / picker. */
export const ALL_TOURNAMENT_CONFIGS = Object.keys(RAW).map((id) => getTournamentConfig(id));
