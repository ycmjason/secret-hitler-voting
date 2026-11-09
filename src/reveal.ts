import type { RoomSnapshot } from './use-room.ts';

/**
 * Whether `next` brings a result that arrived while we watched, so it should be revealed with the
 * animation. The first view after a (re)connect is only a baseline: a phone that slept through
 * the end of a round, or a reload, shows the result straight away.
 */
export const isLiveReveal = (previous: RoomSnapshot | null, next: RoomSnapshot): boolean =>
  previous !== null &&
  previous.connection === next.connection &&
  previous.room.round === next.room.round &&
  previous.room.result === null &&
  next.room.result !== null;

/**
 * The reveal's clock, in seconds from the moment the result arrives (see the reveal table in
 * design/sketches/opus/NOTES.md). The count always fits in COUNT_SPAN, whatever the table size.
 */
const COUNT_START = 0.3;
const COUNT_SPAN = 0.5;
const MAX_STEP = 0.13;

export type RevealTimeline = {
  /** Seconds between one counted vote and the next. */
  step: number;
  /** When the stamp starts to come down (and the phone buzzes). */
  slam: number;
  /** When the sheet takes its thud. */
  thud: number;
  /** When the verdict and controls start to rise in. */
  after: number;
  /** When everything has settled. */
  end: number;
};

export const revealTimeline = (ja: number, nein: number): RevealTimeline => {
  const most = Math.max(ja, nein);
  const step = Math.min(MAX_STEP, COUNT_SPAN / Math.max(most, 1));
  const slam = COUNT_START + most * step + 0.1;
  return { step, slam, thud: slam + 0.15, after: slam + 0.12, end: slam + 0.12 + 0.35 };
};

/** How far a column of `total` votes has counted up `t` seconds into the reveal. */
export const countedAt = (t: number, total: number, step: number): number =>
  Math.max(0, Math.min(total, Math.floor((t - COUNT_START + 1e-9) / step)));

/** When the `i`th (0-based) tally stroke is drawn: just before its number ticks over. */
export const strokeDelay = (i: number, step: number): number => COUNT_START + (i + 1) * step - 0.05;
