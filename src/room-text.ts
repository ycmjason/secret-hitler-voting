import type { HistoryEntry, Result, Vote } from '../shared/protocol.ts';

export const VOTE_WORD: Record<Vote, string> = { ja: 'JA!', nein: 'NEIN' };
export const VOTE_GLOSS: Record<Vote, string> = { ja: 'YES', nein: 'NO' };

/** Joins items as prose: `a`, `a and b`, `a, b and c`. Works on React nodes as well as strings. */
export const joinAsProse = <T>(items: readonly T[]): (T | string)[] =>
  items.flatMap((item, i) => {
    if (i === 0) return [item];
    return [i === items.length - 1 ? ' and ' : ', ', item];
  });

export const score = ({ ja, nein }: Pick<Result, 'ja' | 'nein'>): string => `${ja}–${nein}`;

/** Living players when the result was shown: everyone who voted plus everyone who hadn't. */
const livingAt = (result: Result): number => result.ja + result.nein + result.missing;

/** The line under "Vote 5" on the result screen. */
export const resultSubline = (result: Result): string => {
  const living = livingAt(result);
  if (result.missing === 0) {
    return living === 1 ? 'The only living player voted.' : `All ${living} living players voted.`;
  }
  return `Shown early. ${result.missing} of ${living} living players hadn’t voted.`;
};

/** The verdict under the tally sheet: the score, why it failed, and what that means. */
export const verdict = (result: Result): { lead: string; rest: string } => {
  const to = `${result.ja} to ${result.nein}.`;
  if (result.passed) return { lead: to, rest: 'The government is elected.' };
  if (result.ja === result.nein)
    return { lead: `${to} A tie fails.`, rest: 'The election tracker moves.' };
  return { lead: to, rest: 'The government is not elected. The election tracker moves.' };
};

/** The small print under a ledger score: "tie", "shown early · 2 missing". */
export const ledgerNote = (entry: Result): string =>
  [
    entry.ja === entry.nein ? 'tie' : null,
    entry.missing > 0 ? `shown early · ${entry.missing} missing` : null,
  ]
    .filter(note => note !== null)
    .join(' · ');

/** The rounds before this one, newest first, for the strip under a result. */
export const previousEntries = (history: readonly HistoryEntry[], round: number, count = 2) =>
  history
    .filter(entry => entry.round < round)
    .slice(-count)
    .reverse();
