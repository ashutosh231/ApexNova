import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { peekSessionGameKey, getTournamentFromBackendGame, DEFAULT_TOURNAMENT_ID, getTournamentConfig } from '../data/tournamentConfig.js';

/**
 * Legacy /lobby route — redirects to the unified per-game lobby
 * /lobby/:slug, picking the active tournament from session storage
 * (set by Tournaments page) or falling back to the default snake lobby.
 */
const LobbyPage = () => {
  const sessionGame = peekSessionGameKey();
  const tournament = sessionGame
    ? getTournamentFromBackendGame(sessionGame)
    : getTournamentConfig(DEFAULT_TOURNAMENT_ID);

  useEffect(() => { /* no-op, redirect immediately */ }, []);
  return <Navigate to={`/lobby/${tournament.slug}`} replace />;
};

export default LobbyPage;
