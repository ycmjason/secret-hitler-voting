import type { RoomView, Vote } from '../shared/protocol.ts';
import { SealedVote } from './envelope.tsx';
import { type Player, Progress, Roster } from './room-parts.tsx';
import { VoteCards } from './vote-card.tsx';

export const VotingScreen = ({
  room,
  me,
  changing,
  onVote,
  onChange,
  onKeep,
  onWithdraw,
}: {
  room: RoomView;
  me: Player;
  changing: boolean;
  onVote: (vote: Vote) => void;
  onChange: () => void;
  onKeep: () => void;
  onWithdraw: () => void;
}) => {
  const { myVote } = room;
  if (myVote !== null && !changing) {
    return (
      <>
        <Progress players={room.players} meId={me.id} />
        <SealedVote vote={myVote} round={room.round} />
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" className="btn btn-ghost" onClick={onChange}>
            Change vote
          </button>
          <button type="button" className="btn btn-ghost" onClick={onWithdraw}>
            Withdraw
          </button>
        </div>
      </>
    );
  }
  return (
    <>
      <Progress players={room.players} meId={me.id} />
      {changing && (
        <p className="-my-1.5 text-[15px]">Pick again. Your sealed vote stands until you do.</p>
      )}
      <VoteCards onVote={onVote} />
      {changing && (
        <p className="-mt-1.5 text-center text-[13px]">
          <button
            type="button"
            className="min-h-11 font-semibold text-text underline underline-offset-[3px]"
            onClick={onKeep}
          >
            Keep my sealed vote
          </button>
        </p>
      )}
      <Roster players={room.players} meId={me.id} />
    </>
  );
};

export const DeadScreen = ({ room, me }: { room: RoomView; me: Player }) => (
  <>
    <Progress players={room.players} meId={me.id} />
    <section className="notice">
      <h2 className="mb-2.5 font-display text-[46px] font-black uppercase leading-[0.95]">
        You’re dead.
      </h2>
      <p className="mb-2 text-[15px]">
        No vote for you this round, or any other. Nobody is waiting on you.
      </p>
      <p className="mb-2 text-[15px]">Try to look innocent anyway.</p>
      <p className="mt-3 font-typed text-[13px] text-paper-muted">
        Marked dead by mistake? Anyone can revive you under Manage the table.
      </p>
    </section>
    <Roster players={room.players} meId={me.id} />
  </>
);
