import { DurableObject } from 'cloudflare:workers';
import { ClientMessageSchema, type ServerMessage } from '../shared/protocol.ts';
import { applyMessage, createRoomState, type RoomState, toRoomView } from './room-state.ts';

const STATE_KEY = 'state';
/** A room with nobody connected is deleted after this long. */
const IDLE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type SocketAttachment = { playerId: string | null };

/** One Durable Object per room code. Holds the room's state and its players' WebSockets. */
export class Room extends DurableObject<Env> {
  private state: RoomState | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
    void ctx.blockConcurrencyWhile(async () => {
      this.state = (await ctx.storage.get<RoomState>(STATE_KEY)) ?? null;
    });
  }

  override async fetch(request: Request): Promise<Response> {
    if (!this.state) {
      // Persist straight away: a watcher may sit on the join screen long enough for the object to
      // hibernate, and it must wake up with a room to join.
      this.state = createRoomState(new URL(request.url).searchParams.get('code') ?? '');
      await this.ctx.storage.put(STATE_KEY, this.state);
    }
    const [client, server] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ playerId: null } satisfies SocketAttachment);
    await this.ctx.storage.setAlarm(Date.now() + IDLE_TTL_MS);
    return new Response(null, { status: 101, webSocket: client });
  }

  override async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    if (!this.state || typeof raw !== 'string') return;
    const parsed = ClientMessageSchema.safeParse(safeJsonParse(raw));
    if (!parsed.success) return;
    const message = parsed.data;

    // Who sent it, before anything below changes the socket's attachment.
    const senderId = getPlayerId(ws);
    const next = applyMessage(this.state, senderId, message);
    const changed = next !== this.state;
    if (changed) {
      this.state = next;
      await this.ctx.storage.put(STATE_KEY, next);
    }

    if (message.type === 'join') ws.serializeAttachment({ playerId: message.playerId });
    // Only a remove the rules accepted detaches anyone: not one from a socket that hasn't joined.
    if (message.type === 'remove' && changed) {
      for (const socket of this.socketsOf(message.playerId)) {
        socket.serializeAttachment({ playerId: null } satisfies SocketAttachment);
        send(socket, { type: 'removed' });
      }
    }
    this.broadcast();
  }

  override webSocketClose(ws: WebSocket): void {
    ws.close();
    this.broadcast();
  }

  override webSocketError(): void {
    this.broadcast();
  }

  override async alarm(): Promise<void> {
    if (this.openSockets().length > 0) {
      await this.ctx.storage.setAlarm(Date.now() + IDLE_TTL_MS);
      return;
    }
    this.state = null;
    await this.ctx.storage.deleteAll();
  }

  private openSockets(): WebSocket[] {
    return this.ctx.getWebSockets().filter(ws => ws.readyState === WebSocket.OPEN);
  }

  private socketsOf(playerId: string): WebSocket[] {
    return this.openSockets().filter(ws => getPlayerId(ws) === playerId);
  }

  private broadcast(): void {
    const { state } = this;
    if (!state) return;
    const sockets = this.openSockets();
    const onlineIds = new Set(sockets.map(getPlayerId).filter(id => id !== null));
    for (const ws of sockets) {
      // Watchers (no player yet) get a view too: it holds no votes, only who's seated.
      const viewerId = getPlayerId(ws);
      send(ws, { type: 'state', room: toRoomView(state, { viewerId, onlineIds }) });
    }
  }
}

const getPlayerId = (ws: WebSocket): string | null =>
  (ws.deserializeAttachment() as SocketAttachment | null)?.playerId ?? null;

const send = (ws: WebSocket, message: ServerMessage): void => {
  try {
    ws.send(JSON.stringify(message));
  } catch {
    // The socket closed mid-broadcast; its close handler will rebroadcast.
  }
};

const safeJsonParse = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};
