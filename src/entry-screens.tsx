import { useState } from 'react';
import type { RoomView } from '../shared/protocol.ts';
import { generateRoomCode } from '../shared/room-code.ts';
import { Icon } from './icons.tsx';
import { NameField } from './manage.tsx';
import { navigate } from './navigation.ts';
import { joinAsProse } from './room-text.ts';

const bigTitle = 'font-display text-[56px] font-black uppercase leading-[0.92] tracking-[0.01em]';

/** What you land on from a QR code or link: sign the register to take a seat. */
export const JoinScreen = ({
  code,
  room,
  savedName,
  onJoin,
}: {
  code: string;
  room: RoomView;
  savedName: string;
  onJoin: (name: string) => void;
}) => {
  const [name, setName] = useState(savedName);
  const trimmed = name.trim();
  const seated = room.players.map(p => (
    <b key={p.id} className="font-bold text-text">
      {p.name}
    </b>
  ));
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={event => {
        event.preventDefault();
        if (trimmed) onJoin(trimmed);
      }}
    >
      <header className="flex min-h-11 items-center">
        <button
          type="button"
          className="icon-btn w-11 p-0"
          aria-label="Back"
          onClick={() => navigate('/')}
        >
          <Icon name="back" />
        </button>
      </header>
      <h1 className={bigTitle}>
        Room <span className="tracking-[0.14em]">{code}</span>
      </h1>
      <NameField
        label="Sign the register"
        hint="The name the table knows you by. You can change it later."
        value={name}
        onChange={setName}
        autoFocus={!savedName}
      />
      <button type="submit" className="btn btn-primary" disabled={!trimmed}>
        Take a seat
      </button>
      <p className="font-typed text-sm text-muted" aria-live="polite">
        {seated.length > 0 ? (
          <>Already seated: {joinAsProse(seated)}</>
        ) : (
          'Nobody is seated yet. You’re first.'
        )}
      </p>
    </form>
  );
};

/** Someone removed you. One tap takes your seat back. */
export const RemovedScreen = ({
  code,
  savedName,
  onRejoin,
}: {
  code: string;
  savedName: string;
  onRejoin: (name: string) => void;
}) => {
  const [name, setName] = useState(savedName);
  const trimmed = name.trim();
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={event => {
        event.preventDefault();
        if (trimmed) onRejoin(trimmed);
      }}
    >
      <div className="mt-10">
        <h1 className={`${bigTitle} struck-title`}>Struck off.</h1>
        <p className="mt-3.5 text-muted">
          Someone at table <b className="text-text">{code}</b> removed you. It happens. If it was a
          mistake, take your seat back.
        </p>
      </div>
      <NameField label="Rejoin as" value={name} onChange={setName} />
      <button type="submit" className="btn btn-primary" disabled={!trimmed}>
        Rejoin the table
      </button>
      <button
        type="button"
        className="text-link -mt-1.5 self-center"
        onClick={() => navigate(`/${generateRoomCode()}`)}
      >
        Open a new room instead
      </button>
    </form>
  );
};

/** Before the first state arrives. */
export const ConnectingScreen = ({ code, label }: { code: string; label: string }) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center" role="status">
    <span className="spinner" />
    <p className="font-typed text-sm text-muted">
      {label} <b className="text-text tracking-[0.1em]">{code}</b>…
    </p>
  </div>
);
