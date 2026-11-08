# Secret Hitler Voting

Cast the election vote in [Secret Hitler](https://www.secrethitler.com) from your own phone instead of passing ballot cards around. Everyone joins a room, votes JA! or NEIN in secret, and every phone shows the result at the same moment once the last living player has voted.

**Live:** https://secret-hitler-voting.ycmjason.com

- **Anonymous.** Only the totals and PASSED / FAILED are ever shown. The server never sends anyone another player's vote.
- **Hard to peek at.** JA! and NEIN look identical, the screen only says "vote cast" after you vote, and you hold a button to check your own vote.
- **Built for the table.** Mark dead players so nobody waits for them; phones that sleep reconnect and keep their seat and vote.

## Stack

- React + Vite + Tailwind CSS v4 for the app ([src/](src/))
- A Cloudflare Worker with one Durable Object per room, talking to phones over WebSockets ([worker/](worker/))
- Zod schemas for the wire protocol shared by both ([shared/protocol.ts](shared/protocol.ts))

The room rules are pure functions in [worker/room-state.ts](worker/room-state.ts), unit-tested in [worker/room-state.test.ts](worker/room-state.test.ts). [worker/room.ts](worker/room.ts) wraps them in the Durable Object: it stores the state, tracks who is online, and sends each player their own view. Rooms nobody has connected to for 7 days are deleted.

## Develop

Requires Node 24+ and pnpm.

```bash
pnpm install
pnpm dev          # app + Worker + Durable Object locally, on one port
pnpm test         # vitest
pnpm check        # biome lint + format
pnpm typecheck    # tsc -b
pnpm cf-typegen   # regenerate worker env types after changing wrangler.jsonc
```

## Deploy

```bash
pnpm run deploy
```

Builds the app and deploys the Worker to the `secret-hitler-voting.ycmjason.com` custom domain (see [wrangler.jsonc](wrangler.jsonc)).

## Credits

Secret Hitler is designed by Mike Boxleiter, Tommy Maranges and Max Temkin, and published by Goat, Wolf, & Cabbage under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). This is an unofficial, free fan tool, not affiliated with or endorsed by them. It uses none of the game's art.

The code in this repository is [MIT licensed](LICENSE).
