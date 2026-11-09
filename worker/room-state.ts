import {
  type ClientMessage,
  type HistoryEntry,
  PLAYER_NAME_MAX_LENGTH,
  type Result,
  type RoomView,
  type Vote,
} from '../shared/protocol.ts';

const HISTORY_LIMIT = 50;

type Player = { id: string; name: string; vote: Vote | null; dead: boolean };

export type RoomState = {
  code: string;
  round: number;
  /** In seat order: the order players first joined. */
  players: Player[];
  result: Result | null;
  history: HistoryEntry[];
};

export const createRoomState = (code: string): RoomState => ({
  code,
  round: 1,
  players: [],
  result: null,
  history: [],
});

const tally = (players: Player[]): Result => {
  const ja = players.filter(p => p.vote === 'ja').length;
  const nein = players.filter(p => p.vote === 'nein').length;
  const missing = players.filter(p => !p.dead && p.vote === null).length;
  return { ja, nein, passed: ja > nein, missing };
};

const reveal = (state: RoomState): RoomState => {
  const result = tally(state.players);
  return {
    ...state,
    result,
    history: [...state.history, { round: state.round, ...result }].slice(-HISTORY_LIMIT),
  };
};

/** Shows the result once every living player has voted. */
const revealIfComplete = (state: RoomState): RoomState => {
  const alive = state.players.filter(p => !p.dead);
  return state.result === null && alive.length > 0 && alive.every(p => p.vote !== null)
    ? reveal(state)
    : state;
};

const updatePlayer = (state: RoomState, id: string, update: (p: Player) => Player): RoomState => ({
  ...state,
  players: state.players.map(p => (p.id === id ? update(p) : p)),
});

export const normalizePlayerName = (name: string): string =>
  name.trim().replace(/\s+/g, ' ').slice(0, PLAYER_NAME_MAX_LENGTH) || 'Anonymous';

/**
 * Applies one client message. `senderId` is the player the connection joined as, or `null`
 * before it has joined. Returns the same object when the message changes nothing.
 */
export const applyMessage = (
  state: RoomState,
  senderId: string | null,
  message: ClientMessage,
): RoomState => {
  const isMember = (id: string | null) => state.players.some(p => p.id === id);
  switch (message.type) {
    case 'watch':
      return state;
    case 'join': {
      const name = normalizePlayerName(message.name);
      return isMember(message.playerId)
        ? updatePlayer(state, message.playerId, p => ({ ...p, name }))
        : {
            ...state,
            players: [...state.players, { id: message.playerId, name, vote: null, dead: false }],
          };
    }
    case 'vote': {
      const sender = state.players.find(p => p.id === senderId);
      if (!sender || sender.dead || state.result) return state;
      return revealIfComplete(updatePlayer(state, sender.id, p => ({ ...p, vote: message.vote })));
    }
    case 'reveal':
      return !isMember(senderId) || state.result ? state : reveal(state);
    case 'reset':
      return !isMember(senderId)
        ? state
        : {
            ...state,
            round: state.result ? state.round + 1 : state.round,
            result: null,
            players: state.players.map(p => ({ ...p, vote: null })),
          };
    case 'set-dead':
      if (!isMember(senderId) || !isMember(message.playerId)) return state;
      return revealIfComplete(
        updatePlayer(state, message.playerId, p => ({
          ...p,
          dead: message.dead,
          vote: message.dead && !state.result ? null : p.vote,
        })),
      );
    case 'remove':
      if (!isMember(senderId) || !isMember(message.playerId)) return state;
      return revealIfComplete({
        ...state,
        players: state.players.filter(p => p.id !== message.playerId),
      });
  }
};

export const toRoomView = (
  state: RoomState,
  { viewerId, onlineIds }: { viewerId: string | null; onlineIds: ReadonlySet<string> },
): RoomView => ({
  code: state.code,
  round: state.round,
  players: state.players.map(({ id, name, dead, vote }) => ({
    id,
    name,
    dead,
    online: onlineIds.has(id),
    voted: vote !== null,
  })),
  myVote: state.players.find(p => p.id === viewerId)?.vote ?? null,
  result: state.result,
  history: state.history,
});
