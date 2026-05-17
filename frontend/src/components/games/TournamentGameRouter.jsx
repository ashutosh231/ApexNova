import React from 'react';
import SnakeGame from '../SnakeGame';
import PixelMemoryGame from '../PixelMemoryGame';
import TicTacToeGame from './TicTacToeGame';
import NumberGuessGame from './NumberGuessGame';
import ChessBlitzGame from './ChessBlitzGame';

/**
 * Renders the playable mini-game for a tournament `gameKey`.
 * All games call `onGameOver(totalScore)` once the run is complete.
 *
 * Active gameKeys: snake, tic_tac_toe, memory, number, chess
 */
export default function TournamentGameRouter({ gameKey, playerName, onGameOver, autoStart, allowRestart, themeAccent, themeSecondary }) {
  const sharedProps = { playerName, onGameOver, autoStart, allowRestart };

  switch (gameKey) {
    case 'snake':
      return (
        <SnakeGame
          {...sharedProps}
          accent={themeAccent || '#ccff00'}
          secondary={themeSecondary || '#10b981'}
        />
      );
    case 'memory':
      return (
        <PixelMemoryGame
          {...sharedProps}
          accent={themeAccent || '#a78bfa'}
          secondary={themeSecondary || '#7c3aed'}
        />
      );
    case 'tic_tac_toe':
      return (
        <TicTacToeGame
          onGameOver={onGameOver}
          playerName={playerName}
          accent={themeAccent || '#f97316'}
          secondary={themeSecondary || '#ef4444'}
        />
      );
    case 'number':
      return (
        <NumberGuessGame
          onGameOver={onGameOver}
          accent={themeAccent || '#facc15'}
          secondary={themeSecondary || '#f59e0b'}
        />
      );
    case 'chess':
      return (
        <ChessBlitzGame
          onGameOver={onGameOver}
          accent={themeAccent || '#60a5fa'}
          secondary={themeSecondary || '#6366f1'}
        />
      );
    default:
      return (
        <SnakeGame
          {...sharedProps}
          accent={themeAccent || '#ccff00'}
          secondary={themeSecondary || '#10b981'}
        />
      );
  }
}
