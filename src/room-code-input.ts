import { ROOM_CODE_LENGTH } from '../shared/room-code.ts';

/** Room codes never use I or O; anything else outside A–Z is just dropped. */
const AMBIGUOUS = /[IO]/;

export type LetterInput =
  | { kind: 'letters'; letters: string[] }
  | { kind: 'rejected' }
  | { kind: 'empty' };

/** What typing (or an autofill of several characters) into one code box means. */
export const parseTypedLetters = (raw: string): LetterInput => {
  const letters = raw.toUpperCase().replace(/[^A-Z]/g, '');
  if (!letters) return { kind: 'empty' };
  if (AMBIGUOUS.test(letters)) return { kind: 'rejected' };
  return { kind: 'letters', letters: [...letters] };
};

/**
 * What pasting into a code box means. A bare code (`mbzr`) or a whole room link
 * (`https://…/MBZR`) gives the code: the last four letters. Anything shorter is treated as typed.
 */
export const parsePastedText = (text: string): LetterInput => {
  const upper = text.trim().toUpperCase();
  const code = upper.match(new RegExp(`([A-Z]{${ROOM_CODE_LENGTH}})[^A-Z]*$`))?.[1];
  if (!code) return parseTypedLetters(upper);
  if (AMBIGUOUS.test(code)) return { kind: 'rejected' };
  return { kind: 'letters', letters: [...code] };
};

/**
 * Writes `letters` into the boxes starting at `from`, and returns the new boxes and the box to
 * focus next (the one after the last letter written, or the last box).
 */
export const fillBoxes = (
  boxes: readonly string[],
  letters: readonly string[],
  from: number,
): { boxes: string[]; focus: number } => {
  const next = [...boxes];
  const written = letters.slice(0, boxes.length - from);
  written.forEach((letter, k) => {
    next[from + k] = letter;
  });
  return { boxes: next, focus: Math.min(from + written.length, boxes.length - 1) };
};
