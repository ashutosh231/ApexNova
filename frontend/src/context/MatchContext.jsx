import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

/**
 * MatchContext — Global state machine for the multiplayer flow.
 * 
 * States: IDLE → SEARCHING → MATCH_FOUND → IN_ROOM → PLAYING → POST_MATCH → IDLE
 * 
 * Uses simulated delays to emulate WebSocket matchmaking.
 */

const MatchContext = createContext(null);

/* ── Mock opponent data ── */
const MOCK_OPPONENTS = [
  { id: 101, name: 'NeonBlade',  rank: 1, score: 0, ready: false, color: '#10b981', status: 'online' },
  { id: 102, name: 'PixelKing',  rank: 2, score: 0, ready: false, color: '#3b82f6', status: 'online' },
  { id: 103, name: 'SwiftAce',   rank: 3, score: 0, ready: false, color: '#f59e0b', status: 'online' },
  { id: 104, name: 'GridMaster', rank: 5, score: 0, ready: false, color: '#a855f7', status: 'online' },
];

const MOCK_FRIENDS = [
  { id: 201, name: 'CyberWolf',  avatar: null, status: 'online',  rank: 12, color: '#ec4899' },
  { id: 202, name: 'BlazeFury',  avatar: null, status: 'playing', rank: 8,  color: '#f97316', currentGame: 'Snake' },
  { id: 203, name: 'IronClad',   avatar: null, status: 'online',  rank: 15, color: '#06b6d4' },
  { id: 204, name: 'QuantumX',   avatar: null, status: 'offline', rank: 22, color: '#8b5cf6' },
  { id: 205, name: 'StormRider', avatar: null, status: 'online',  rank: 6,  color: '#14b8a6' },
  { id: 206, name: 'VoidWalker', avatar: null, status: 'playing', rank: 3,  color: '#e11d48', currentGame: 'Reaction Test' },
  { id: 207, name: 'ArcLight',   avatar: null, status: 'offline', rank: 45, color: '#64748b' },
  { id: 208, name: 'NovaStar',   avatar: null, status: 'online',  rank: 11, color: '#22c55e' },
];

/* ── Match types ── */
const MATCH_TYPES = {
  solo:   { label: 'Solo vs AI',       players: 1, icon: '🎯' },
  friend: { label: 'Play with Friend', players: 2, icon: '👫' },
  global: { label: 'Global Match',     players: 4, icon: '🌍' },
  custom: { label: 'Custom Match',     players: 4, icon: '⚙️' },
};

export const MatchProvider = ({ children }) => {
  /* ── Core state ── */
  const [phase, setPhase] = useState('IDLE');          // IDLE | SEARCHING | MATCH_FOUND | IN_ROOM | PLAYING | POST_MATCH
  const [matchType, setMatchType] = useState(null);    // solo | friend | global | custom
  const [gameType, setGameType] = useState('snake');   // snake | tictactoe | reaction
  const [opponents, setOpponents] = useState([]);
  const [playerReady, setPlayerReady] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [friends] = useState(MOCK_FRIENDS);
  const [chatMessages, setChatMessages] = useState([]);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [customSettings, setCustomSettings] = useState({ timeLimit: 300, maxPlayers: 4, game: 'snake' });

  const timersRef = useRef([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const addTimer = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  /* ── Actions ── */

  /** Start matchmaking — transitions IDLE → SEARCHING → MATCH_FOUND */
  const startMatchmaking = useCallback((type, game = 'snake') => {
    clearAllTimers();
    setMatchType(type);
    setGameType(game);
    setPhase('SEARCHING');
    setPlayerReady(false);
    setCountdown(null);
    setMatchResult(null);
    setChatMessages([]);

    const searchTime = type === 'solo' ? 1200 : type === 'friend' ? 2000 : 3000;

    addTimer(() => {
      // Pick random opponents based on match type
      const count = type === 'solo' ? 1 : type === 'friend' ? 1 : 3;
      const shuffled = [...MOCK_OPPONENTS].sort(() => Math.random() - 0.5);
      setOpponents(shuffled.slice(0, count).map(o => ({ ...o, score: 0, ready: false })));
      setPhase('MATCH_FOUND');

      // Auto-transition to room after "Match Found!" display
      addTimer(() => {
        setPhase('IN_ROOM');

        // Simulate opponents going ready one by one
        const readyDelay = type === 'solo' ? 800 : 2000;
        shuffled.slice(0, count).forEach((_, i) => {
          addTimer(() => {
            setOpponents(prev => prev.map((o, j) => j === i ? { ...o, ready: true } : o));
          }, readyDelay + i * 1200);
        });

        // Add some mock chat
        addTimer(() => setChatMessages(p => [...p, { id: Date.now(), user: shuffled[0].name, msg: 'gl hf! 🔥', time: 'now' }]), 2500);
        addTimer(() => setChatMessages(p => [...p, { id: Date.now(), user: 'System', msg: 'Match starting soon...', time: 'now', isSystem: true }]), 4000);
      }, 2000);
    }, searchTime);
  }, [addTimer, clearAllTimers]);

  /** Player clicks Ready — triggers countdown if all ready */
  const setReady = useCallback(() => {
    setPlayerReady(true);

    // Check if all opponents are ready; if not, wait, then start anyway
    addTimer(() => {
      setCountdown(5);
      let c = 5;
      const iv = setInterval(() => {
        c -= 1;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(iv);
          setPhase('PLAYING');
          setCountdown(null);

          // Simulate game ending after some time
          addTimer(() => {
            const playerScore = Math.floor(Math.random() * 5000) + 8000;
            const results = opponents.map(o => ({
              ...o,
              score: Math.floor(Math.random() * 5000) + 5000,
            }));
            results.push({ id: 0, name: 'You', score: playerScore, color: '#ccff00', isPlayer: true });
            results.sort((a, b) => b.score - a.score);
            results.forEach((r, i) => { r.rank = i + 1; r.pointsDelta = r.rank === 1 ? '+25' : r.rank === 2 ? '+10' : '-5'; });
            setMatchResult({ players: results, winner: results[0] });
            setPhase('POST_MATCH');
          }, 8000);
        }
      }, 1000);
      timersRef.current.push(iv);
    }, 1500);
  }, [addTimer, opponents]);

  /** Send invite to a friend */
  const inviteFriend = useCallback((friendId) => {
    const friend = friends.find(f => f.id === friendId);
    if (!friend) return;
    setPendingInvite(friend);
    // Simulate friend accepting after delay
    addTimer(() => {
      setPendingInvite(null);
      startMatchmaking('friend', gameType);
    }, 3000);
  }, [friends, addTimer, startMatchmaking, gameType]);

  /** Leave / cancel everything → back to IDLE */
  const leaveMatch = useCallback(() => {
    clearAllTimers();
    setPhase('IDLE');
    setMatchType(null);
    setOpponents([]);
    setPlayerReady(false);
    setCountdown(null);
    setMatchResult(null);
    setChatMessages([]);
    setPendingInvite(null);
  }, [clearAllTimers]);

  /** Play Again → restart matchmaking with same settings */
  const playAgain = useCallback(() => {
    startMatchmaking(matchType || 'global', gameType);
  }, [startMatchmaking, matchType, gameType]);

  /** Return to lobby */
  const returnToLobby = useCallback(() => {
    leaveMatch();
  }, [leaveMatch]);

  const value = {
    // State
    phase, matchType, gameType, opponents, playerReady, countdown,
    matchResult, friends, chatMessages, pendingInvite, customSettings,
    // Actions
    startMatchmaking, setReady, inviteFriend, leaveMatch, playAgain,
    returnToLobby, setGameType, setCustomSettings,
    // Constants
    MATCH_TYPES,
  };

  return <MatchContext.Provider value={value}>{children}</MatchContext.Provider>;
};

export const useMatch = () => {
  const ctx = useContext(MatchContext);
  if (!ctx) throw new Error('useMatch must be used within MatchProvider');
  return ctx;
};

export default MatchContext;
