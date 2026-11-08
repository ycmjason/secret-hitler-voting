# AGENTS.md

Read [README.md](README.md) first for what this is, the stack and the commands.

- Run commands from the repo root with pnpm. Before calling work done: `pnpm check`, `pnpm typecheck`, `pnpm test run`, `pnpm build`.
- `shared/protocol.ts` is the contract between the app and the Worker. Change it there, and validate with its Zod schemas at both ends.
- Keep room rules in `worker/room-state.ts` as pure functions with tests; `worker/room.ts` only does storage, sockets and broadcasting.
- Votes are anonymous: never send a player anyone else's vote. `toRoomView` is the only place that decides what a player sees.
- `design/` holds the design reference and sketches; it's not part of the build.
- Code style: Biome defaults (2 spaces, single quotes, 100 columns), kebab-case file names, named exports, `type` over `interface`, tests next to the code they test.
