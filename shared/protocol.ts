import { z } from 'zod';

export const PLAYER_NAME_MAX_LENGTH = 24;

export const VoteSchema = z.enum(['ja', 'nein']);
export type Vote = z.infer<typeof VoteSchema>;

const PlayerIdSchema = z.string().min(1).max(64);

/** Messages a client sends over the room's WebSocket. Send `join` first on every connection. */
export const ClientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('join'), playerId: PlayerIdSchema, name: z.string() }),
  /** `null` withdraws the vote. Ignored once the result is shown, or if the sender is dead. */
  z.object({ type: z.literal('vote'), vote: VoteSchema.nullable() }),
  /** Show the result now, even if not everyone has voted. */
  z.object({ type: z.literal('reveal') }),
  /** Start a new vote: clears every vote and hides the result. */
  z.object({ type: z.literal('reset') }),
  z.object({ type: z.literal('set-dead'), playerId: PlayerIdSchema, dead: z.boolean() }),
  z.object({ type: z.literal('remove'), playerId: PlayerIdSchema }),
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

export const ResultSchema = z.object({
  ja: z.number().int().nonnegative(),
  nein: z.number().int().nonnegative(),
  /** A vote passes only on a strict majority of JA!; a tie fails. */
  passed: z.boolean(),
});
export type Result = z.infer<typeof ResultSchema>;

export const HistoryEntrySchema = ResultSchema.extend({ round: z.number().int().positive() });
export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

/** What one player is allowed to see. Never contains anyone else's vote. */
export const RoomViewSchema = z.object({
  code: z.string(),
  /** 1-based number of the current vote in this room. */
  round: z.number().int().positive(),
  players: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      dead: z.boolean(),
      online: z.boolean(),
      voted: z.boolean(),
    }),
  ),
  /** The viewer's own vote this round. */
  myVote: VoteSchema.nullable(),
  /** Set once the result is shown; `null` while voting is open. */
  result: ResultSchema.nullable(),
  /** Past results in this room, oldest first. Includes the current one once shown. */
  history: z.array(HistoryEntrySchema),
});
export type RoomView = z.infer<typeof RoomViewSchema>;

export const ServerMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('state'), room: RoomViewSchema }),
  /** Someone removed this player; the client should stop reconnecting and offer to rejoin. */
  z.object({ type: z.literal('removed') }),
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;
