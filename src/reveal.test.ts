import { describe, expect, it } from 'vitest';
import type { RoomView } from '../shared/protocol.ts';
import { countedAt, isLiveReveal, revealTimeline } from './reveal.ts';

describe('the reveal clock', () => {
  it('settles a 4–2 vote at about 1.37 s', () => {
    const t = revealTimeline(4, 2);
    expect(t.step).toBeCloseTo(0.125);
    expect(t.slam).toBeCloseTo(0.9);
    expect(t.end).toBeCloseTo(1.37);
  });

  it('fits any table size into the same count', () => {
    expect(revealTimeline(1, 0).step).toBeCloseTo(0.13);
    expect(revealTimeline(10, 0).slam).toBeCloseTo(0.9);
    expect(revealTimeline(0, 0).end).toBeLessThan(1.5);
  });

  it('counts both columns together, the smaller stopping first', () => {
    const { step } = revealTimeline(4, 2);
    expect([0.2, 0.43, 0.56, 0.8].map(t => [countedAt(t, 4, step), countedAt(t, 2, step)])).toEqual(
      [
        [0, 0],
        [1, 1],
        [2, 2],
        [4, 2],
      ],
    );
  });
});

describe('when to play the reveal', () => {
  const room = (round: number, shown: boolean): RoomView => ({
    code: 'ABCD',
    round,
    players: [],
    myVote: null,
    result: shown ? { ja: 1, nein: 0, passed: true, missing: 0 } : null,
    history: [],
  });
  const at = (connection: number, round: number, shown: boolean) => ({
    room: room(round, shown),
    connection,
  });

  it('plays when the result arrives on the connection that saw the vote open', () => {
    expect(isLiveReveal(at(1, 5, false), at(1, 5, true))).toBe(true);
  });

  it('treats the first view after a (re)connect as a baseline', () => {
    expect(isLiveReveal(null, at(1, 5, true))).toBe(false);
    // The phone slept mid-vote and wakes to the finished round.
    expect(isLiveReveal(at(1, 5, false), at(2, 5, true))).toBe(false);
  });

  it('does not play for a result already shown, or one from another round', () => {
    expect(isLiveReveal(at(1, 5, true), at(1, 5, true))).toBe(false);
    expect(isLiveReveal(at(1, 4, false), at(1, 5, true))).toBe(false);
  });
});
