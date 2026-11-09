import { useState } from 'react';
import { PLAYER_NAME_MAX_LENGTH, type RoomView } from '../shared/protocol.ts';
import { Icon } from './icons.tsx';
import { type Player, Roster } from './room-parts.tsx';
import { joinAsProse } from './room-text.ts';
import { Sheet } from './sheet.tsx';

export const ManageBar = ({ onDone }: { onDone: () => void }) => (
  <div className="flex items-center justify-between gap-3 rounded-[14px] bg-brass py-2.5 pr-2.5 pl-4 text-brass-ink">
    <span>
      <b className="block font-display text-[22px] font-black uppercase leading-none tracking-[0.04em]">
        Managing the table
      </b>
      <small className="text-[13px] font-medium">Anyone can do this. Be nice.</small>
    </span>
    <button
      type="button"
      className="min-h-11 rounded-[10px] bg-brass-ink px-4 font-bold text-brass"
      onClick={onDone}
    >
      Done
    </button>
  </div>
);

const toolClass = 'btn btn-ghost justify-start';
const toolNote = 'ml-auto text-[13px] font-normal text-muted';

export const ManageScreen = ({
  room,
  me,
  onToggleDead,
  onRemove,
  onShowResult,
  onClearVotes,
  onRename,
}: {
  room: RoomView;
  me: Player;
  onToggleDead: (player: Player) => void;
  onRemove: (player: Player) => void;
  onShowResult: () => void;
  onClearVotes: () => void;
  onRename: () => void;
}) => {
  const alive = room.players.filter(p => !p.dead);
  const notVoted = alive.filter(p => !p.voted).length;
  const anyVoted = room.players.some(p => p.voted);
  return (
    <>
      <Roster players={room.players} meId={me.id} actions={{ onToggleDead, onRemove }} />
      <div className="mt-auto flex flex-col gap-2.5">
        {room.result === null && (
          <>
            <button type="button" className={toolClass} onClick={onShowResult}>
              <Icon name="flag" />
              Show result now
              <small className={toolNote}>{notVoted} not voted</small>
            </button>
            <button type="button" className={toolClass} onClick={onClearVotes} disabled={!anyVoted}>
              <Icon name="erase" />
              Clear votes
              {!anyVoted && <small className={toolNote}>No votes yet</small>}
            </button>
          </>
        )}
        <button type="button" className={toolClass} onClick={onRename}>
          <Icon name="pen" />
          Change my name
          <small className={`${toolNote} truncate`}>{me.name}</small>
        </button>
      </div>
    </>
  );
};

const Name = ({ children }: { children: string }) => <b className="text-text">{children}</b>;

export const ConfirmResultSheet = ({
  room,
  meId,
  onConfirm,
  onClose,
}: {
  room: RoomView;
  meId: string;
  onConfirm: () => void;
  onClose: () => void;
}) => {
  const missing = room.players.filter(p => !p.dead && !p.voted);
  const names = missing.map(p => <Name key={p.id}>{p.id === meId ? 'You' : p.name}</Name>);
  const one = missing.length === 1;
  return (
    <Sheet title="Show the result now?" onClose={onClose}>
      <p className="mb-[18px] text-[15px] text-muted">
        {missing.length === 0 ? (
          'Everyone has voted.'
        ) : (
          <>
            {joinAsProse(names)} {one && missing[0]?.id !== meId ? 'hasn’t' : 'haven’t'} voted.{' '}
            {one ? 'That ballot won’t count' : 'Their ballots won’t count'}, and a tie still fails.
          </>
        )}
      </p>
      <div className="flex flex-col gap-2.5">
        <button type="button" className="btn btn-primary" onClick={onConfirm}>
          Show result now
        </button>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Keep waiting
        </button>
      </div>
    </Sheet>
  );
};

export const ConfirmRemoveSheet = ({
  player,
  isMe,
  onConfirm,
  onClose,
}: {
  player: Player;
  isMe: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) => (
  <Sheet title={isMe ? 'Remove yourself?' : `Remove ${player.name}?`} onClose={onClose}>
    <p className="mb-[18px] text-[15px] text-muted">
      {isMe
        ? 'You leave the table and your vote goes with you. You can take your seat back afterwards.'
        : 'Their seat and their vote go. They can rejoin from their phone with one tap.'}
    </p>
    <div className="flex flex-col gap-2.5">
      <button type="button" className="btn btn-danger" onClick={onConfirm}>
        {isMe ? 'Remove me' : `Remove ${player.name}`}
      </button>
      <button type="button" className="btn btn-ghost" onClick={onClose}>
        {isMe ? 'Stay' : 'Keep them'}
      </button>
    </div>
  </Sheet>
);

export const RenameSheet = ({
  name,
  onSave,
  onClose,
}: {
  name: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) => {
  const [value, setValue] = useState(name);
  const trimmed = value.trim();
  return (
    <Sheet title="Change my name" onClose={onClose}>
      <form
        className="mt-4 flex flex-col gap-2.5"
        onSubmit={event => {
          event.preventDefault();
          if (trimmed) onSave(trimmed);
        }}
      >
        <NameField label="The name the table knows you by" value={value} onChange={setValue} />
        <button type="submit" className="btn btn-primary mt-2" disabled={!trimmed}>
          Save
        </button>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
      </form>
    </Sheet>
  );
};

/** A name field on buff paper, like signing a register. */
export const NameField = ({
  label,
  hint,
  value,
  onChange,
  autoFocus = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) => (
  <label className="block">
    <span className="mb-2 block font-semibold">{label}</span>
    <input
      className="h-[60px] w-full rounded-xl bg-paper px-4 font-typed text-[22px] font-bold text-paper-ink caret-paper-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brass"
      value={value}
      onChange={event => onChange(event.target.value)}
      maxLength={PLAYER_NAME_MAX_LENGTH}
      autoComplete="nickname"
      autoCapitalize="words"
      spellCheck={false}
      enterKeyHint="go"
      // biome-ignore lint/a11y/noAutofocus: the only field on a screen you came to fill in
      autoFocus={autoFocus}
    />
    {hint && <small className="mt-2 block text-[13px] text-muted">{hint}</small>}
  </label>
);
