import { useEffect, useRef, useState, useCallback } from 'react';
import getEcho from '../lib/echo';

/**
 * Subscribes to a private Reverb room channel.
 * Falls back gracefully if Echo/WS is not available.
 *
 * setRoom() does a FULL replace (not merge) so stale player
 * data never lingers after a poll or refresh.
 */
export function useRoomChannel(roomCode, initialRoom = null) {
  const [room, setRoomState]    = useState(initialRoom);
  const [messages, setMessages] = useState([]);
  const channelRef              = useRef(null);

  // Full replace — never merge, so removed players disappear immediately
  const setRoom = useCallback((data) => {
    if (!data) return;
    setRoomState(data);
  }, []);

  // Merge only specific fields from a WS event (status, players array, etc.)
  // This handles partial event payloads from Reverb without wiping everything
  const mergeRoom = useCallback((data) => {
    setRoomState(prev => {
      if (!prev) return data;           // first update — just set it
      if (!data) return prev;
      // If the event contains a full players array, replace it entirely
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
        echo.leave(`room.${roomCode}`);
      } catch {}
      channelRef.current = null;
    };
  }, [roomCode, setRoom, mergeRoom]);

  return { room, setRoom, messages, setMessages };
}
