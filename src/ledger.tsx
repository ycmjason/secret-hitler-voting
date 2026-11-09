import type { HistoryEntry, RoomView } from '../shared/protocol.ts';
import { ledgerNote, previousEntries, score } from './room-text.ts';
import { Sheet } from './sheet.tsx';

const MiniStamp = ({ passed }: { passed: boolean }) => (
  <span className={passed ? 'mini-stamp text-verdigris-lit' : 'mini-stamp text-oxblood-lit'}>
    {passed ? 'PASSED' : 'FAILED'}
  </span>
);

const rowClass =
  'grid min-h-[52px] grid-cols-[74px_1fr_auto] items-center gap-2 border-t border-rule font-typed text-[15px] last:border-b';

const LedgerRow = ({ entry }: { entry: HistoryEntry }) => {
  const note = ledgerNote(entry);
  return (
    <li className={rowClass}>
      <span>Vote {entry.round}</span>
      <span>
        <span className="font-display text-2xl font-extrabold tracking-[0.04em]">
          {score(entry)}
        </span>
        {note && <span className="block text-xs text-muted">{note}</span>}
      </span>
      <MiniStamp passed={entry.passed} />
    </li>
  );
};

/** Round history: totals and outcome only, newest first. */
export const LedgerSheet = ({ room, onClose }: { room: RoomView; onClose: () => void }) => {
  const alive = room.players.filter(p => !p.dead);
  const voted = alive.filter(p => p.voted).length;
  return (
    <Sheet title="Ledger" onClose={onClose}>
      <p className="mb-[18px] text-[15px] text-muted">
        Room {room.code}, this sitting. Totals only. Nobody’s vote is on record.
      </p>
      <ul className="mb-2">
        {room.result === null && (
          <li className={`${rowClass} text-muted`}>
            <span>Vote {room.round}</span>
            <span>
              in progress · {voted} of {alive.length}
            </span>
            <span />
          </li>
        )}
        {room.history.toReversed().map(entry => (
          <LedgerRow key={entry.round} entry={entry} />
        ))}
      </ul>
    </Sheet>
  );
};

/** The last two rounds before this one, under a result. */
export const LedgerStrip = ({ room, onOpen }: { room: RoomView; onOpen: () => void }) => (
  <div className="border-t border-rule pt-2">
    {previousEntries(room.history, room.round).map(entry => (
      <div key={entry.round} className="flex justify-between py-1 font-typed text-sm text-muted">
        <span>Vote {entry.round}</span>
        <span>
          <b className="font-bold text-text">{score(entry)}</b> ·{' '}
          {entry.passed ? 'Passed' : 'Failed'}
        </span>
      </div>
    ))}
    <button
      type="button"
      className="min-h-9 text-sm font-semibold text-text underline underline-offset-[3px]"
      onClick={onOpen}
    >
      Open the ledger
    </button>
  </div>
);
