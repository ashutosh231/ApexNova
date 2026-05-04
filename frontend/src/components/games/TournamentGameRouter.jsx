import React from 'react';
import SnakeGame from '../SnakeGame';
import PixelMemoryGame from '../PixelMemoryGame';
import TicTacToeGame from './TicTacToeGame';
import ReactionGame from './ReactionGame';
import NumberGuessGame from './NumberGuessGame';
import WordBlitzGame from './WordBlitzGame';
import ColorSurgeGame from './ColorSurgeGame';
import MathRushGame from './MathRushGame';
import ChessBlitzGame from './ChessBlitzGame';
import MathMazeGame from './MathMazeGame';
import AbilityDuelsGame from './AbilityDuelsGame';

/**
 * Renders the playable mini-game for a tournament `gameKey`.
 * All games call `onGameOver(totalScore)` once the run is complete.
 */
export default function TournamentGameRouter({ gameKey, playerName, onGameOver, autoStart, allowRestart, themeAccent, themeSecondary }) {
  const p = { playerName, onGameOver, autoStart, allowRestart };

  switch (gameKey) {
    case 'snake':
      return <SnakeGame {...p} />;
    case 'memory':
      return <PixelMemoryGame {...p} />;
    case 'tic_tac_toe':
      return <TicTacToeGame onGameOver={onGameOver} playerName={playerName} accent={themeAccent || '#34d399'} />;
    case 'reaction':
      return <ReactionGame onGameOver={onGameOver} accent={themeAccent || '#38bdf8'} />;
    case 'number':
      return <NumberGuessGame onGameOver={onGameOver} accent={themeAccent || '#f59e0b'} />;
    case 'word_blitz':
      return <WordBlitzGame onGameOver={onGameOver} accent={themeAccent || '#fb7185'} />;
    case 'color_surge':
      return <ColorSurgeGame onGameOver={onGameOver} />;
    case 'math_rush':
      return <MathRushGame onGameOver={onGameOver} accent={themeAccent || '#818cf8'} />;
    case 'chess':
      return <ChessBlitzGame onGameOver={onGameOver} />;
    case 'math_maze':
      return <MathMazeGame onGameOver={onGameOver} accent={themeAccent || '#a5b4fc'} />;
    case 'ability_duels':
      return (
        <AbilityDuelsGame onGameOver={onGameOver} accent={themeAccent || '#ccff00'} secondary={themeSecondary || '#f97316'} />
      );
    default:
      return <SnakeGame {...p} />;
  }
}
