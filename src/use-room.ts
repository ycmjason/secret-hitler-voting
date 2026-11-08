import { useCallback, useEffect, useRef, useState } from 'react';
import { type ClientMessage, type RoomView, ServerMessageSchema } from '../shared/protocol.ts';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting';

const PING_INTERVAL_MS = 20_000;
const MAX_RETRY_DELAY_MS = 5_000;

/**
 * Keeps a live connection to a room. Reconnects with backoff (and immediately when the tab
 * becomes visible again), re-joining as the same player so their seat and vote are kept.
 * Pass `player: null` to stay disconnected, e.g. until the player has entered a name.
 */
export const useRoom = (code: string, player: { id: string; name: string } | null) => {
  const [room, setRoom] = useState<RoomView | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [removed, setRemoved] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const nameRef = useRef(player?.name ?? '');
  nameRef.current = player?.name ?? '';
  const playerId = player?.id ?? null;

  const send = useCallback((message: ClientMessage) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  }, []);

  useEffect(() => {
    if (playerId === null || removed) return;
    let disposed = false;
    let retries = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      clearTimeout(retryTimer);
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${protocol}//${location.host}/api/rooms/${code}/ws`);
      socketRef.current = socket;
      socket.onopen = () => {
        retries = 0;
        setStatus('connected');
        socket.send(
          JSON.stringify({ type: 'join', playerId, name: nameRef.current } satisfies ClientMessage),
        );
      };
      socket.onmessage = (event: MessageEvent<string>) => {
        if (event.data === 'pong') return;
        const parsed = ServerMessageSchema.safeParse(JSON.parse(event.data));
        if (!parsed.success) return;
        if (parsed.data.type === 'state') setRoom(parsed.data.room);
        else {
          disposed = true;
          setRemoved(true);
          setRoom(null);
          socket.close();
        }
      };
      socket.onclose = () => {
        if (disposed || socketRef.current !== socket) return;
        setStatus('reconnecting');
        retryTimer = setTimeout(connect, Math.min(500 * 2 ** retries++, MAX_RETRY_DELAY_MS));
      };
    };

    const pingTimer = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send('ping');
    }, PING_INTERVAL_MS);
    const onVisible = () => {
      const socket = socketRef.current;
      const isDown =
        socket === null ||
        socket.readyState === WebSocket.CLOSED ||
        socket.readyState === WebSocket.CLOSING;
      if (document.visibilityState === 'visible' && isDown) connect();
    };
    document.addEventListener('visibilitychange', onVisible);

    setStatus('connecting');
    connect();
    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      clearInterval(pingTimer);
      document.removeEventListener('visibilitychange', onVisible);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [code, playerId, removed]);

  // A name change on an open connection is a re-join under the same id.
  useEffect(() => {
    if (playerId !== null && player?.name) send({ type: 'join', playerId, name: player.name });
  }, [player?.name, playerId, send]);

  return { room, status, removed, send, rejoin: () => setRemoved(false) };
};
