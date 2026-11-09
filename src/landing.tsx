import { useRef, useState } from 'react';
import { generateRoomCode, ROOM_CODE_LENGTH } from '../shared/room-code.ts';
import { navigate } from './navigation.ts';
import {
  fillBoxes,
  type LetterInput,
  parsePastedText,
  parseTypedLetters,
} from './room-code-input.ts';
import { VoteCard } from './vote-card.tsx';

const EMPTY = Array.from({ length: ROOM_CODE_LENGTH }, () => '');
const REJECT_MS = 1800;

/** Four letter boxes that fill in like dealing cards. See "Room-code entry" in the design notes. */
const CodeBoxes = ({ onComplete }: { onComplete: (code: string) => void }) => {
  const [boxes, setBoxes] = useState<string[]>(EMPTY);
  const [rejected, setRejected] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const rejectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const complete = boxes.every(Boolean);

  const focus = (i: number) => inputs.current[i]?.focus();
  const reject = () => {
    // A new key restarts the shake animation.
    setRejected(n => n + 1);
    clearTimeout(rejectTimer.current);
    rejectTimer.current = setTimeout(() => setRejected(0), REJECT_MS);
  };
  const apply = (input: LetterInput, at: number) => {
    if (input.kind === 'rejected') return reject();
    if (input.kind === 'empty') return;
    // A whole code (pasted or autofilled) fills every box; anything less deals from this box.
    const from = input.letters.length === ROOM_CODE_LENGTH ? 0 : at;
    const next = fillBoxes(boxes, input.letters, from);
    setBoxes(next.boxes);
    focus(next.focus);
  };
  const setBox = (i: number, letter: string) =>
    setBoxes(b => b.map((x, k) => (k === i ? letter : x)));

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={event => {
        event.preventDefault();
        if (complete) onComplete(boxes.join(''));
      }}
    >
      <div className="-mb-2 flex items-baseline justify-between">
        <label htmlFor="code-0" className="text-[15px] font-semibold">
          Room code
        </label>
        <span
          className={`text-[13px] font-semibold text-oxblood-lit transition-opacity ${rejected ? 'opacity-100' : 'opacity-0'}`}
          aria-live="polite"
        >
          {rejected ? 'Codes never use I or O.' : ''}
        </span>
      </div>
      <div
        className={`grid grid-cols-4 gap-2.5 ${rejected ? `code-bad code-bad-${rejected % 2}` : ''}`}
      >
        {boxes.map((letter, i) => (
          <input
            // biome-ignore lint/suspicious/noArrayIndexKey: the boxes are fixed positions
            key={i}
            id={`code-${i}`}
            ref={el => {
              inputs.current[i] = el;
            }}
            className="code-box"
            value={letter}
            placeholder=" "
            maxLength={ROOM_CODE_LENGTH}
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint={i === ROOM_CODE_LENGTH - 1 ? 'go' : 'next'}
            aria-label={`Letter ${i + 1} of ${ROOM_CODE_LENGTH}`}
            aria-invalid={rejected ? true : undefined}
            onFocus={event => event.currentTarget.select()}
            onChange={event => {
              const raw = event.currentTarget.value;
              if (!raw) return setBox(i, '');
              // Typed after the box's letter rather than over it: keep only the new letters.
              apply(
                parseTypedLetters(raw.length > letter.length ? raw.replace(letter, '') : raw),
                i,
              );
            }}
            onPaste={event => {
              event.preventDefault();
              apply(parsePastedText(event.clipboardData.getData('text')), i);
            }}
            onKeyDown={event => {
              if (event.key === 'Backspace' && !letter && i > 0) {
                event.preventDefault();
                setBox(i - 1, '');
                focus(i - 1);
              } else if (event.key === 'ArrowLeft' && i > 0) {
                event.preventDefault();
                focus(i - 1);
              } else if (event.key === 'ArrowRight' && i < ROOM_CODE_LENGTH - 1) {
                event.preventDefault();
                focus(i + 1);
              }
            }}
          />
        ))}
      </div>
      <button type="submit" className="btn btn-primary" disabled={!complete}>
        Join room
      </button>
    </form>
  );
};

export const Landing = () => (
  <>
    <div className="pt-[18px] text-center">
      <div className="rules mb-3" />
      <h1 className="font-display text-[50px] font-black uppercase leading-[0.92] tracking-[0.01em]">
        Secret Hitler
        <br />
        Voting
      </h1>
      <div className="mt-1.5 flex justify-between font-typed text-xs uppercase tracking-[0.14em] text-muted">
        <span>Est. at your table</span>
        <span>No. 1</span>
      </div>
      <div className="rules rules-flip mt-3" />
    </div>
    <div className="relative mx-auto h-[172px] w-full max-w-[350px]" aria-hidden="true">
      <div className="absolute top-2 left-[62px] w-[112px] -rotate-7">
        <VoteCard vote="ja" />
      </div>
      <div className="absolute top-1 right-[62px] w-[112px] rotate-6">
        <VoteCard vote="nein" />
      </div>
    </div>
    <p className="mx-2 text-center text-[17px]">
      One phone each. Vote in secret. Everyone sees the result at the same moment.
    </p>
    <button
      type="button"
      className="btn btn-primary"
      onClick={() => navigate(`/${generateRoomCode()}`)}
    >
      Open a new room
    </button>
    <div className="or-rule">or join one</div>
    <CodeBoxes onComplete={code => navigate(`/${code}`)} />
    <p className="mt-auto text-center font-typed text-[13px] text-muted">
      Free. No accounts. No cards to pass round.
    </p>
  </>
);
