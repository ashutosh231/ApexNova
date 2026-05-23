import { useEffect, useRef, useState, useCallback } from 'react';
import getEcho from '../lib/echo';

/**
 * Subscribes to a private Reverb room channel.
 * Falls back gracefully if Echo/WS is not available.
 *
 * setRoom() does a FULL replace (not merge) so stale player
 * data never lingers after a poll or refresh.
 *
 * onGameMove (optional) — fired for every '.game.move' broadcast
 *   from another player. The handler receives the raw payload:
 *   { type, payload, from_user, sent_at }.
 *   Use this to relay chess/tic-tac-toe moves between clients.
 */
export function useRoomChannel(roomCode, initialRoom = null, onGameMove = null) {
  const [room, setRoomState]    = useState(initialRoom);
  const [messages, setMessages] = useState([]);
  const channelRef              = useRef(null);
  const moveHandlerRef          = useRef(onGameMove);

  useEffect(() => { moveHandlerRef.current = onGameMove; }, [onGameMove]);

  const setRoom = useCallback((data) => {
    if (!data) return;
    setRoomState(data);
  }, []);

  const mergeRoom = useCallback((data) => {
    setRoomState(prev => {
      if (!prev) return data;
      if (!data) return prev;
      return { ...prev, ...data };
    });
  }, []);

  useEffect(() => {
    if (!roomCode) return;

    const echo = getEcho();
    if (!echo) return; // WS not available — silent degradation

    let channel;
    try {
      channel = echo.private(`room.${roomCode}`);
      channelRef.current = channel;

      channel.listen('.room.updated',    (d) => setRoom(d));
      channel.listen('.match.started',   (d) => setRoom(d));
      channel.listen('.match.finished',  (d) => setRoom(d));
      channel.listen('.score.submitted', (d) => mergeRoom(d));
      channel.listen('.chat.message',    (msg) => setMessages(prev => [...prev, msg]));
      channel.listen('.game.move',       (data) => {
        const fn = moveHandlerRef.current;
        if (typeof fn === 'function') {
          try { fn(data); } catch (err) { console.warn('[useRoomChannel] onGameMove handler error:', err); }
        }
      });

      channel.error((err) => {
        console.warn('[useRoomChannel] channel error:', err);
      });
    } catch (e) {
      console.warn('[useRoomChannel] subscribe error:', e.message);
    }

    return () => {
      try {
        channel?.stopListening('.room.updated');
        channel?.stopListening('.match.started');
        channel?.stopListening('.match.finished');
        channel?.stopListening('.score.submitted');
        channel?.stopListening('.chat.message');
        channel?.stopListening('.game.move');
        echo.leave(`room.${roomCode}`);
      } catch {}
      channelRef.current = null;
    };
  }, [roomCode, setRoom, mergeRoom]);

  return { room, setRoom, messages, setMessages };
}
