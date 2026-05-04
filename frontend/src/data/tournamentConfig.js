/**
 * Maps each tournament listing to a playable game backend key + UI theme.
 * `usesMemoryShell` → /memory-match-room (Pixel Memory–style chrome).
 */
import { ALL_TOURNAMENTS } from './allTournaments.js';

export const DEFAULT_TOURNAMENT_ID = 'snake-championship';
export const SESSION_TOURNAMENT_KEY = 'apexnova_active_tournament';
export const SESSION_GAME_KEY = 'apexnova_active_game';

const RAW = {
  'snake-championship': { backendGame: 'snake', gameKey: 'snake', accent: '#ccff00', secondary: '#10b981', usesMemoryShell: false },
  'tictactoe-masters': { backendGame: 'tic_tac_toe', gameKey: 'tic_tac_toe', accent: '#34d399', secondary: '#059669', usesMemoryShell: false },
  'reaction-speed-cup': { backendGame: 'reaction', gameKey: 'reaction', accent: '#38bdf8', secondary: '#0ea5e9', usesMemoryShell: false },
  'memory-grand-prix': { backendGame: 'memory', gameKey: 'memory', accent: '#a78bfa', secondary: '#7c3aed', usesMemoryShell: true },
  'number-guessing-open': { backendGame: 'number', gameKey: 'number', accent: '#f59e0b', secondary: '#d97706', usesMemoryShell: false },
  'word-blitz-invitational': { backendGame: 'word_blitz', gameKey: 'word_blitz', accent: '#fb7185', secondary: '#f43f5e', usesMemoryShell: false },
  'chess-blitz-open': { backendGame: 'chess', gameKey: 'chess', accent: '#e5e5e5', secondary: '#737373', usesMemoryShell: false },
  'pixel-memory-ultra': { backendGame: 'memory', gameKey: 'memory', accent: '#00ffff', secondary: '#ff00ff', usesMemoryShell: true },
  'color-surge-weekly': { backendGame: 'color_surge', gameKey: 'color_surge', accent: '#ccff00', secondary: '#f97316', usesMemoryShell: false },
  'math-rush-championship': { backendGame: 'math_rush', gameKey: 'math_rush', accent: '#38bdf8', secondary: '#818cf8', usesMemoryShell: false },
  'math-maze-open': { backendGame: 'math_maze', gameKey: 'math_maze', accent: '#a5b4fc', secondary: '#6366f1', usesMemoryShell: false },
  'ability-duels-cup': { backendGame: 'ability_duels', gameKey: 'ability_duels', accent: '#ccff00', secondary: '#f97316', usesMemoryShell: false },
};

export function getTournamentConfig(tournamentId) {
  const id = RAW[tournamentId] ? tournamentId : DEFAULT_TOURNAMENT_ID;
  const meta = ALL_TOURNAMENTS.find((t) => t.id === id);
  const raw = RAW[id];
  return {
    id,
    label: meta?.name ?? 'Tournament',
    emoji: meta?.emoji ?? '🎮',
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

/** When only API `game` slug is known (e.g. friend invite), pick a default tournament id for labels + mechanics. */
export const BACKEND_GAME_DEFAULT_TOURNAMENT = {
  snake: 'snake-championship',
  tic_tac_toe: 'tictactoe-masters',
  reaction: 'reaction-speed-cup',
  memory: 'memory-grand-prix',
  number: 'number-guessing-open',
  word_blitz: 'word-blitz-invitational',
  chess: 'chess-blitz-open',
  color_surge: 'color-surge-weekly',
  math_rush: 'math-rush-championship',
  math_maze: 'math-maze-open',
  ability_duels: 'ability-duels-cup',
};

export function getTournamentFromBackendGame(backendGame) {
  const tid = BACKEND_GAME_DEFAULT_TOURNAMENT[backendGame] || DEFAULT_TOURNAMENT_ID;
  return getTournamentConfig(tid);
}
