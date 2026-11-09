import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import type { Result, Vote } from '../shared/protocol.ts';
import { HoldToCheck } from './hold-to-check.tsx';
import { countedAt, type RevealTimeline, revealTimeline, strokeDelay } from './reveal.ts';
import { resultSubline, verdict } from './room-text.ts';

const buzz = () => navigator.vibrate?.([60, 40, 60]);
const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * `t` is seconds since the reveal started, or `null` once it's over (or was never played). The
 * phone buzzes once: when the stamp lands, or on skip if that comes first. `onDone` runs at the end.
 */
const useRevealClock = (animate: boolean, timeline: RevealTimeline, onDone: () => void) => {
  const [t, setT] = useState<number | null>(() => (animate && !prefersReducedMotion() ? 0 : null));
  const buzzed = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (!animate) return;
    if (prefersReducedMotion()) {
      buzz();
      doneRef.current();
      return;
    }
    let start: number | null = null;
    const tick = (now: number) => {
      start ??= now;
      const elapsed = (now - start) / 1000;
      if (!buzzed.current && elapsed >= timeline.slam) {
        buzzed.current = true;
        buzz();
      }
      if (elapsed >= timeline.end) {
        setT(null);
        doneRef.current();
        return;
      }
      setT(elapsed);
      frame = requestAnimationFrame(tick);
    };
    let frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, timeline.slam, timeline.end]);

  const skip = () => {
    if (!buzzed.current) {
      buzzed.current = true;
      buzz();
    }
    setT(null);
    doneRef.current();
  };
  return { t, skip };
};

/** Tally strokes in groups of five, the fifth struck diagonally through the four. */
const TallyMarks = ({ count, step }: { count: number; step: number }) => {
  const lines: ReactNode[] = [];
  let x = 6;
  for (let i = 0; i < count; i++) {
    const style = { animationDelay: `${strokeDelay(i, step).toFixed(2)}s` };
    if (i % 5 === 4) {
      lines.push(
        <line key={i} pathLength={1} x1={x - 34} y1={26} x2={x - 2} y2={8} style={style} />,
      );
      x += 10;
    } else {
      lines.push(<line key={i} pathLength={1} x1={x} y1={5} x2={x} y2={29} style={style} />);
      x += 9;
    }
  }
  const width = Math.max(x, 20);
  return (
    <svg
      className="tally-marks"
      viewBox={`0 0 ${width} 34`}
      style={{ width: Math.min(width * 1.5, 120) }}
      aria-hidden="true"
    >
      {lines}
    </svg>
  );
};

export const ResultScreen = ({
  round,
  result,
  myVote,
  animate,
  onRevealed,
  header,
  footer,
  stale,
  onNewVote,
}: {
  round: number;
  result: Result;
  myVote: Vote | null;
  /** Play the reveal: only when the result arrived live, never on a reload. */
  animate: boolean;
  onRevealed: () => void;
  header: ReactNode;
  footer: ReactNode;
  /** Grey out and freeze everything under the header while the connection is down. */
  stale: boolean;
  onNewVote: () => void;
}) => {
  const timeline = revealTimeline(result.ja, result.nein);
  const { t, skip } = useRevealClock(animate, timeline, onRevealed);
  const playing = t !== null;

  // While the reveal plays, a tap anywhere (or any key) skips it and does nothing else: the
  // controls don't take pointer events yet, and the click that follows the tap is swallowed.
  const skipRef = useRef(skip);
  skipRef.current = skip;
  useEffect(() => {
    if (!playing) return;
    const swallowClick = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const onPointerDown = (event: PointerEvent) => {
      event.preventDefault();
      window.addEventListener('click', swallowClick, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', swallowClick, { capture: true }), 600);
      skipRef.current();
    };
    // The key only skips: it mustn't also press a focused button such as "New vote".
    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      skipRef.current();
    };
    window.addEventListener('pointerdown', onPointerDown, { capture: true });
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, { capture: true });
      window.removeEventListener('keydown', onKeyDown, { capture: true });
    };
  }, [playing]);

  const shown = (n: number) => (playing ? countedAt(t, n, timeline.step) : n);
  const { lead, rest } = verdict(result);
  const timing = {
    '--slam': `${timeline.slam.toFixed(2)}s`,
    '--thud': `${timeline.thud.toFixed(2)}s`,
    '--after': `${timeline.after.toFixed(2)}s`,
  } as CSSProperties;

  return (
    <div className={playing ? 'playing flex flex-col gap-4' : 'flex flex-col gap-4'} style={timing}>
      {playing && (
        <div className="curtain" aria-hidden="true">
          {result.missing === 0 ? 'ALL BALLOTS IN' : 'SHOWN EARLY'}
        </div>
      )}
      <div
        className={playing ? 'pointer-events-none flex flex-col gap-4' : 'flex flex-col gap-4'}
        inert={playing}
      >
        {header}
        <div
          className={
            stale ? 'pointer-events-none flex flex-col gap-4 opacity-45 saturate-[0.6]' : 'contents'
          }
          inert={stale}
        >
          <div className="res-head">
            <h1 className="font-display text-[44px] font-black uppercase leading-none tracking-[0.02em]">
              Vote {round}
            </h1>
            <p className="mt-0.5 text-[15px] text-muted">{resultSubline(result)}</p>
          </div>
          <section
            className="tally-sheet"
            aria-label={`${result.ja} JA!, ${result.nein} NEIN: ${result.passed ? 'passed' : 'failed'}`}
          >
            {(['ja', 'nein'] as const).map(side => (
              <div key={side} className="tally-col" aria-hidden="true">
                <span className="tally-label block font-display text-[26px] font-black tracking-[0.06em]">
                  {side === 'ja' ? 'JA!' : 'NEIN'}
                </span>
                <span className="mt-1 mb-1.5 block font-display text-[112px] font-black tabular-nums leading-[0.9]">
                  {shown(result[side])}
                </span>
                <TallyMarks count={result[side]} step={timeline.step} />
              </div>
            ))}
            <div
              className={result.passed ? 'stamp text-verdigris' : 'stamp text-oxblood'}
              aria-hidden="true"
            >
              {result.passed ? 'PASSED' : 'FAILED'}
            </div>
          </section>
          <div className="after-reveal flex flex-col gap-3.5">
            <p className="mt-[34px] text-center">
              <b className="font-bold">{lead}</b> {rest}
            </p>
            {myVote !== null && <HoldToCheck vote={myVote} />}
            <button type="button" className="btn btn-primary" onClick={onNewVote}>
              New vote
            </button>
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
};
