import { describe, expect, it } from 'vitest';
import { generateRoomCode, RoomCodeSchema } from './room-code.ts';

describe('room codes', () => {
  it('generates valid codes', () => {
    for (let i = 0; i < 200; i++)
      expect(RoomCodeSchema.safeParse(generateRoomCode()).success).toBe(true);
  });

  it('normalises case and whitespace, and rejects ambiguous letters', () => {
    expect(RoomCodeSchema.parse(' abcd ')).toBe('ABCD');
    expect(RoomCodeSchema.safeParse('ABCO').success).toBe(false);
    expect(RoomCodeSchema.safeParse('ABC').success).toBe(false);
  });
});
