import { RoomCodeSchema } from '../shared/room-code.ts';

export { Room } from './room.ts';

/** Static assets (the React app) are served by Workers Assets; only `/api/*` reaches this. */
export default {
  async fetch(request, env) {
    const match = new URL(request.url).pathname.match(/^\/api\/rooms\/([^/]+)\/ws$/);
    const code = RoomCodeSchema.safeParse(match?.[1]);
    if (!code.success) return new Response('Not found', { status: 404 });
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected a WebSocket upgrade', { status: 426 });
    }
    const url = new URL(request.url);
    url.searchParams.set('code', code.data);
    return env.ROOM.get(env.ROOM.idFromName(code.data)).fetch(new Request(url, request));
  },
} satisfies ExportedHandler<Env>;
