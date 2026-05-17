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
  'tictactoe-masters': { backendGame: 'tic_tac_toe', gameKey: 'tic_tac_toe', accent: '#f97316', secondary: '#ef4444', usesMemoryShell: false },
  'memory-grand-prix': { backendGame: 'memory', gameKey: 'memory', accent: '#a78bfa', secondary: '#7c3aed', usesMemoryShell: true },
  'number-guessing-open': { backendGame: 'number', gameKey: 'number', accent: '#facc15', secondary: '#f59e0b', usesMemoryShell: false },
  'pixel-memory-ultra': { backendGame: 'memory', gameKey: 'memory', accent: '#00ffff', secondary: '#ff00ff', usesMemoryShell: true },
  'chess-blitz-open': { backendGame: 'chess', gameKey: 'chess', accent: '#60a5fa', secondary: '#6366f1', usesMemoryShell: false },
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
  memory: 'memory-grand-prix',
  number: 'number-guessing-open',
  chess: 'chess-blitz-open',
};

export function getTournamentFromBackendGame(backendGame) {
  const tid = BACKEND_GAME_DEFAULT_TOURNAMENT[backendGame] || DEFAULT_TOURNAMENT_ID;
  return getTournamentConfig(tid);
}
