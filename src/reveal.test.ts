import { describe, expect, it } from 'vitest';
import { countedAt, revealTimeline } from './reveal.ts';

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
