import type { ReactNode } from 'react';
import type { RoomView } from '../shared/protocol.ts';
import { Icon } from './icons.tsx';
import { joinAsProse } from './room-text.ts';
import type { ConnectionStatus } from './use-room.ts';

export type Player = RoomView['players'][number];

export const RoomHeader = ({
  code,
  status,
  onLedger,
  onInvite,
}: {
  code: string;
  status: ConnectionStatus;
  onLedger: () => void;
  onInvite: () => void;
}) => {
  const live = status === 'connected';
  return (
    <header className="flex min-h-11 items-center justify-between">
      <div className="flex items-baseline gap-2">
        <span className="font-typed text-[13px] text-muted">Room</span>
        <b className="font-display text-[30px] font-extrabold leading-none tracking-[0.16em]">
          {code}
        </b>
        <span
          className={live ? 'dot' : 'dot dot-wait'}
          role="img"
          aria-label={live ? 'Connected' : 'Reconnecting'}
          title={live ? 'Connected' : 'Reconnecting'}
        />
      </div>
      <div className="flex gap-1.5">
        <button type="button" className="icon-btn w-11 p-0" aria-label="Ledger" onClick={onLedger}>
          <Icon name="ledger" />
        </button>
        <button type="button" className="icon-btn" onClick={onInvite}>
          <Icon name="invite" />
          Invite
        </button>
      </div>
    </header>
  );
};

export const ReconnectingBanner = () => (
  <div
    className="flex items-center gap-3 rounded-xl bg-[#2f2717] px-3.5 py-3 text-sm text-[#f1dca9]"
    role="status"
  >
    <span className="spinner" />
    <span>
      <b className="block text-[15px]">Reconnecting…</b>
      Your seat and your vote are kept.
    </span>
  </div>
);

/** Greys out and freezes what it wraps while the connection is down. */
export const Stale = ({ stale, children }: { stale: boolean; children: ReactNode }) => (
  <div
    className={
      stale
        ? 'pointer-events-none flex flex-1 flex-col gap-4 opacity-45 saturate-[0.6]'
        : 'flex flex-1 flex-col gap-4'
    }
    inert={stale}
  >
    {children}
  </div>
);

export const Progress = ({ players, meId }: { players: Player[]; meId: string }) => {
  const alive = players.filter(p => !p.dead);
  const voted = alive.filter(p => p.voted).length;
  const waiting = alive
    .filter(p => !p.voted)
    .map(p => (
      <b key={p.id} className="font-semibold text-text">
        {p.id === meId ? 'you' : p.name}
      </b>
    ));
  return (
    <section aria-label="Progress">
      <div className="flex items-baseline gap-2.5">
        <b className="font-display text-[58px] font-black tabular-nums leading-[0.9] tracking-[-0.01em]">
          {voted}
        </b>
        <span className="font-display text-2xl font-bold uppercase tracking-[0.06em] text-muted">
          of {alive.length} voted
        </span>
      </div>
      <div className="mt-2.5 mb-2 flex gap-[5px]" aria-hidden="true">
        {alive.map((p, i) => (
          <i
            key={p.id}
            className={
              i < voted
                ? 'h-1.5 flex-1 rounded-[2px] bg-text'
                : 'h-1.5 flex-1 rounded-[2px] bg-rule'
            }
          />
        ))}
      </div>
      <p className="text-[15px] text-muted" aria-live="polite">
        {waiting.length > 0 ? <>Waiting for {joinAsProse(waiting)}.</> : 'All in. Counting…'}
      </p>
    </section>
  );
};

type RosterActions = { onToggleDead: (player: Player) => void; onRemove: (player: Player) => void };

export const Roster = ({
  players,
  meId,
  actions,
}: {
  players: Player[];
  meId: string;
  /** Set in manage mode: each row's status is replaced by actions. */
  actions?: RosterActions;
}) => (
  <section aria-labelledby="roster-title">
    <h2
      id="roster-title"
      className="mb-1 flex justify-between font-display text-lg font-extrabold uppercase tracking-[0.08em] text-muted"
    >
      <span>At the table</span>
      <span>{players.length}</span>
    </h2>
    <ul>
      {players.map(p => (
        <li key={p.id} className="roster-row">
          <span
            className={`truncate font-typed text-base font-bold ${
              p.dead ? 'text-muted line-through decoration-2' : p.online ? '' : 'text-[#cfc5b1]'
            }`}
          >
            {p.name}
          </span>
          {p.id === meId && (
            <span className="rounded-[3px] bg-brass px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-brass-ink">
              you
            </span>
          )}
          {!p.online && (
            <span className="inline-flex items-center gap-1 text-[13px] text-muted">
              <Icon name="moon" small />
              asleep
            </span>
          )}
          {actions ? (
            <span className="ml-auto flex shrink-0 gap-1.5">
              <button type="button" className="mini-btn" onClick={() => actions.onToggleDead(p)}>
                {p.dead ? 'Revive' : 'Mark dead'}
                <span className="sr-only"> {p.name}</span>
              </button>
              <button
                type="button"
                className="mini-btn text-oxblood-lit"
                onClick={() => actions.onRemove(p)}
              >
                Remove<span className="sr-only"> {p.name}</span>
              </button>
            </span>
          ) : (
            <PlayerStatus player={p} />
          )}
        </li>
      ))}
    </ul>
  </section>
);

const PlayerStatus = ({ player }: { player: Player }) => {
  if (player.dead) return <span className="ml-auto text-sm font-medium text-muted">Dead</span>;
  if (player.voted)
    return (
      <span className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold">
        <Icon name="check" small />
        Voted
      </span>
    );
  return (
    <span className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-muted">
      Waiting
      <span className="wait-dash" />
    </span>
  );
};

export const ManageLink = ({ onClick }: { onClick: () => void }) => (
  <button type="button" className="text-link self-center" onClick={onClick}>
    <Icon name="sliders" small />
    Manage the table
  </button>
);
