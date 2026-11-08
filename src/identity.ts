const PLAYER_ID_KEY = 'shv:player-id';
const PLAYER_NAME_KEY = 'shv:player-name';

/** A stable per-browser id, so a player keeps their seat and vote across reloads and reconnects. */
export const getPlayerId = (): string => {
  const existing = localStorage.getItem(PLAYER_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(PLAYER_ID_KEY, id);
  return id;
};

export const getSavedPlayerName = (): string => localStorage.getItem(PLAYER_NAME_KEY) ?? '';

export const savePlayerName = (name: string): void => localStorage.setItem(PLAYER_NAME_KEY, name);
