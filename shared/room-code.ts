import { z } from 'zod';

/** Letters only, without I and O, so a code read across the table can't be misheard as 1 or 0. */
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const ROOM_CODE_LENGTH = 4;

export const RoomCodeSchema = z
  .string()
  .transform(code => code.trim().toUpperCase())
  .pipe(z.string().regex(new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`)));

export type RoomCode = z.output<typeof RoomCodeSchema>;

export const generateRoomCode = (): RoomCode =>
  Array.from(
    crypto.getRandomValues(new Uint32Array(ROOM_CODE_LENGTH)),
    n => ROOM_CODE_ALPHABET[n % ROOM_CODE_ALPHABET.length],
  ).join('');
