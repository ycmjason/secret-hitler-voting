import { useCallback, useEffect, useRef, useState } from 'react';
import { type ClientMessage, type RoomView, ServerMessageSchema } from '../shared/protocol.ts';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting';

/**
 * The latest room view, and which connection delivered it. `connection` goes up by one with the
 * first state on every new socket, so the first view after a (re)connect can be told apart.
 */
export type RoomSnapshot = { room: RoomView; connection: number };

const PING_INTERVAL_MS = 20_000;
const MAX_RETRY_DELAY_MS = 5_000;

/**
 * Keeps a live connection to a room. Reconnects with backoff (and immediately when the tab
 * becomes visible again), re-joining as the same player so their seat and vote are kept.
 * With `name: null` it only watches: it receives the room's state without taking a seat.
 */
export const useRoom = (code: string, player: { id: string; name: string | null }) => {
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const connectionRef = useRef(0);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [removed, setRemoved] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const nameRef = useRef(player.name);
  nameRef.current = player.name;
  const { id: playerId, name } = player;

  const send = useCallback((message: ClientMessage) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  }, []);

  useEffect(() => {
    if (removed) return;
    let disposed = false;
    let retries = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      clearTimeout(retryTimer);
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${protocol}//${location.host}/api/rooms/${code}/ws`);
      socketRef.current = socket;
      let gotState = false;
      socket.onopen = () => {
        retries = 0;
        const name = nameRef.current;
        const hello: ClientMessage =
          name === null ? { type: 'watch' } : { type: 'join', playerId, name };
        socket.send(JSON.stringify(hello));
      };
      socket.onmessage = (event: MessageEvent<string>) => {
        if (disposed || event.data === 'pong') return;
        const parsed = ServerMessageSchema.safeParse(JSON.parse(event.data));
        if (!parsed.success) return;
        if (parsed.data.type === 'state') {
          // Connected only once the room is current again, so a stale screen stays frozen until then.
          if (!gotState) {
            gotState = true;
            connectionRef.current += 1;
            setStatus('connected');
          }
          setSnapshot({ room: parsed.data.room, connection: connectionRef.current });
        } else {
          disposed = true;
          setRemoved(true);
          setSnapshot(null);
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

  // Taking a seat, or changing name, on an open connection is a (re-)join under the same id.
  useEffect(() => {
    if (name !== null) send({ type: 'join', playerId, name });
  }, [name, playerId, send]);

  return {
    room: snapshot?.room ?? null,
    snapshot,
    status,
    removed,
    send,
    rejoin: () => setRemoved(false),
  };
};
