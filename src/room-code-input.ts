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

const L = ROOM_CODE_LENGTH;
/** A room link's path segment: `/MBZR`, then a `/`, `?`, `#`, or only punctuation to the end. */
const PATH_CODE = new RegExp(`/([A-Z]{${L}})(?:[/?#]|[^A-Z0-9]*$)`);
/** A word of exactly four letters on its own, like a code typed into a message. */
const STANDALONE_CODES = new RegExp(`(?<![A-Z])[A-Z]{${L}}(?![A-Z])`, 'g');
/** The last four letters of the text. */
const TRAILING_CODE = new RegExp(`([A-Z]{${L}})[^A-Z]*$`);

/**
 * What pasting into a code box means. A room link gives its path's code, even with a query
 * after it (`https://…/MBZR?utm_source=share`); otherwise a four-letter word (`mbzr`, the last
 * if there are several); otherwise the last four letters. Anything shorter is treated as typed.
 */
export const parsePastedText = (text: string): LetterInput => {
  const upper = text.trim().toUpperCase();
  const code =
    upper.match(PATH_CODE)?.[1] ??
    upper.match(STANDALONE_CODES)?.at(-1) ??
    upper.match(TRAILING_CODE)?.[1];
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
