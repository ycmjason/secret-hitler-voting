import { describe, expect, it } from 'vitest';
import { joinAsProse, ledgerNote, previousEntries, resultSubline, verdict } from './room-text.ts';

const result = (ja: number, nein: number, missing = 0) => ({
  ja,
  nein,
  missing,
  passed: ja > nein,
});

describe('joinAsProse', () => {
  it('joins with commas and a final "and"', () => {
    expect(joinAsProse(['Tom']).join('')).toBe('Tom');
    expect(joinAsProse(['Tom', 'Hannah']).join('')).toBe('Tom and Hannah');
    expect(joinAsProse(['you', 'Tom', 'Hannah']).join('')).toBe('you, Tom and Hannah');
  });
});

describe('result copy', () => {
  it('says everyone voted, or that it was shown early', () => {
    expect(resultSubline(result(4, 2))).toBe('All 6 living players voted.');
    expect(resultSubline(result(1, 0))).toBe('The only living player voted.');
    expect(resultSubline(result(2, 1, 2))).toBe('Shown early. 2 of 5 living players hadn’t voted.');
  });

  it('says why a vote failed', () => {
    expect(verdict(result(4, 2))).toEqual({ lead: '4 to 2.', rest: 'The government is elected.' });
    expect(verdict(result(3, 3)).lead).toBe('3 to 3. A tie fails.');
    expect(verdict(result(2, 4)).rest).toMatch(/not elected/);
  });
});

describe('ledger', () => {
  it('flags ties and early results', () => {
    expect(ledgerNote(result(4, 3))).toBe('');
    expect(ledgerNote(result(3, 3))).toBe('tie');
    expect(ledgerNote(result(2, 3, 1))).toBe('shown early · 1 missing');
    expect(ledgerNote(result(2, 2, 1))).toBe('tie · shown early · 1 missing');
  });

  it('lists the two rounds before this one, newest first', () => {
    const history = [1, 2, 3, 4, 5].map(round => ({ round, ...result(1, 0) }));
    expect(previousEntries(history, 5).map(e => e.round)).toEqual([4, 3]);
    expect(previousEntries(history, 1)).toEqual([]);
  });
});
