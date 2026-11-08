import { DurableObject } from 'cloudflare:workers';
import HTML from './page.html';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const randomCode = () =>
  Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return Response.redirect(`${url.origin}/${randomCode()}`, 302);
    if (parts[0] === 'ws' && parts[1]) {
      if (req.headers.get('Upgrade') !== 'websocket') return new Response('expected websocket', { status: 426 });
      const room = parts[1].toUpperCase().slice(0, 16);
      return env.SH_ROOM.get(env.SH_ROOM.idFromName(room)).fetch(req);
    }
    if (parts.length === 1 && /^[A-Za-z0-9]{1,16}$/.test(parts[0])) {
      if (parts[0] !== parts[0].toUpperCase()) return Response.redirect(`${url.origin}/${parts[0].toUpperCase()}`, 302);
      return new Response(HTML, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    }
    return new Response('not found', { status: 404 });
  },
};

export class SH_Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
    ctx.blockConcurrencyWhile(async () => {
      this.s = (await ctx.storage.get('s')) ?? { players: {}, order: [], revealed: false, round: 1 };
    });
  }

  async fetch() {
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  maybeReveal() {
    const s = this.s;
    const alive = s.order.filter((id) => !s.players[id].dead);
    if (!s.revealed && alive.length > 0 && alive.every((id) => s.players[id].vote)) s.revealed = true;
  }

  async webSocketMessage(ws, raw) {
    let m;
    try {
      m = JSON.parse(raw);
    } catch {
      return;
    }
    const s = this.s;
    const me = ws.deserializeAttachment()?.id;
    const target = typeof m.id === 'string' ? s.players[m.id] : undefined;

    switch (m.t) {
      case 'join': {
        const id = String(m.id ?? '').slice(0, 64);
        if (!id) return;
        const name = String(m.name ?? '').trim().slice(0, 24) || 'Anon';
        ws.serializeAttachment({ id });
        if (!s.players[id]) {
          s.players[id] = { name, vote: null, dead: false };
          s.order.push(id);
        } else s.players[id].name = name;
        break;
      }
      case 'vote': {
        const p = s.players[me];
        if (!p || p.dead || s.revealed) return;
        p.vote = m.v === 'ja' || m.v === 'nein' ? m.v : null;
        this.maybeReveal();
        break;
      }
      case 'reveal':
        if (s.revealed) return;
        s.revealed = true;
        break;
      case 'reset':
        for (const id of s.order) s.players[id].vote = null;
        s.revealed = false;
        s.round++;
        break;
      case 'dead':
        if (!target) return;
        target.dead = !target.dead;
        if (target.dead && !s.revealed) target.vote = null;
        this.maybeReveal();
        break;
      case 'kick':
        if (!target) return;
        delete s.players[m.id];
        s.order = s.order.filter((id) => id !== m.id);
        for (const w of this.ctx.getWebSockets()) {
          if (w.deserializeAttachment()?.id === m.id) {
            w.serializeAttachment(null);
            try {
              w.send(JSON.stringify({ t: 'kicked' }));
            } catch {}
          }
        }
        this.maybeReveal();
        break;
      default:
        return;
    }
    await this.ctx.storage.put('s', s);
    this.broadcast();
  }

  webSocketClose(ws) {
    try {
      ws.close();
    } catch {}
    this.broadcast(ws);
  }

  webSocketError(ws) {
    this.broadcast(ws);
  }

  broadcast(exclude) {
    const s = this.s;
    const sockets = this.ctx.getWebSockets().filter((w) => w !== exclude && w.readyState === WebSocket.OPEN);
    const online = new Set(sockets.map((w) => w.deserializeAttachment()?.id).filter(Boolean));
    const count = (v) => s.order.filter((id) => s.players[id].vote === v).length;
    const tally = s.revealed ? { ja: count('ja'), nein: count('nein') } : null;
    for (const w of sockets) {
      const viewer = w.deserializeAttachment()?.id;
      const players = s.order.map((id) => {
        const p = s.players[id];
        return {
          id,
          name: p.name,
          dead: p.dead,
          online: online.has(id),
          voted: !!p.vote,
          vote: id === viewer ? p.vote : null,
        };
      });
      try {
        w.send(JSON.stringify({ t: 'state', revealed: s.revealed, round: s.round, tally, players }));
      } catch {}
    }
  }
}
