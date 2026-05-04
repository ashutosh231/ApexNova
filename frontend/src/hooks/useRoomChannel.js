import { useEffect, useRef, useState, useCallback } from 'react';
import getEcho from '../lib/echo';

/**
 * Subscribes to a private Reverb room channel.
 * Falls back gracefully if Echo/WS is not available.
 */
export function useRoomChannel(roomCode, initialRoom = null) {
  const [room, setRoom]         = useState(initialRoom);
  const [messages, setMessages] = useState([]);
  const channelRef              = useRef(null);

  const mergeRoom = useCallback((data) => {
    setRoom(prev => ({ ...(prev ?? {}), ...data }));
  }, []);

  useEffect(() => {
    if (!roomCode) return;

    const echo = getEcho();
    if (!echo) return; // WS not available — silent degradation

    let channel;
    try {
      channel = echo.private(`room.${roomCode}`);
      channelRef.current = channel;

      channel.listen('.room.updated',   (d) => mergeRoom(d));
      channel.listen('.match.started',  (d) => mergeRoom(d));
      channel.listen('.match.finished', (d) => mergeRoom(d));
      channel.listen('.score.submitted',(d) => mergeRoom(d));
      channel.listen('.chat.message',   (msg) => setMessages(prev => [...prev, msg]));
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
  }, [roomCode, mergeRoom]);

  return { room, setRoom, messages, setMessages };
}
