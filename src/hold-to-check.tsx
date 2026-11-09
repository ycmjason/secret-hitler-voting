import { type ReactNode, useEffect, useState } from 'react';
import type { Vote } from '../shared/protocol.ts';
import { Icon } from './icons.tsx';
import { VOTE_WORD } from './room-text.ts';

const isHoldKey = (key: string) => key === ' ' || key === 'Enter';

/**
 * A bar you hold (pointer, or Space / Enter from the keyboard) to see your own vote. The vote is
 * only in the DOM while it's held. `children` renders anything else that opens while held, like
 * the envelope.
 */
export const HoldToCheck = ({
  vote,
  children,
}: {
  vote: Vote;
  children?: (held: boolean) => ReactNode;
}) => {
  const [held, setHeld] = useState(false);

  // Let go anywhere, or lose the window, and it reseals.
  useEffect(() => {
    if (!held) return;
    const release = () => setHeld(false);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
    };
  }, [held]);

  const hold = () => {
    setHeld(true);
    navigator.vibrate?.(15);
  };

  return (
    <div className={held ? 'held flex flex-col gap-3.5' : 'flex flex-col gap-3.5'}>
      {children?.(held)}
      <button
        type="button"
        className="hold"
        onPointerDown={event => {
          event.preventDefault();
          hold();
        }}
        onKeyDown={event => {
          if (!isHoldKey(event.key)) return;
          event.preventDefault();
          if (!event.repeat) hold();
        }}
        onKeyUp={event => {
          if (isHoldKey(event.key)) setHeld(false);
        }}
        onBlur={() => setHeld(false)}
        onContextMenu={event => event.preventDefault()}
      >
        {held ? (
          <span className="inline-flex items-baseline gap-1.5">
            You voted{' '}
            <b className="font-display text-2xl font-black tracking-[0.04em]">{VOTE_WORD[vote]}</b>
          </span>
        ) : (
          <span className="inline-flex items-center gap-2.5">
            <Icon name="eye" />
            Hold to check your vote
          </span>
        )}
      </button>
      <span className="sr-only" aria-live="assertive">
        {held ? `You voted ${VOTE_WORD[vote]}` : ''}
      </span>
    </div>
  );
};
