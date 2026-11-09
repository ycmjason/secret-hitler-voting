import { useState } from 'react';
import type { RoomView, Vote } from '../shared/protocol.ts';
import { ConnectingScreen, JoinScreen, RemovedScreen } from './entry-screens.tsx';
import { getPlayerId, getSavedPlayerName, savePlayerName } from './identity.ts';
import { AloneCard, InviteDialog, ShareLinkButton } from './invite.tsx';
import { LedgerSheet, LedgerStrip } from './ledger.tsx';
import {
  ConfirmRemoveSheet,
  ConfirmResultSheet,
  ManageBar,
  ManageScreen,
  RenameSheet,
} from './manage.tsx';
import { ResultScreen } from './result-screen.tsx';
import {
  ManageLink,
  type Player,
  ReconnectingBanner,
  RoomHeader,
  Roster,
  Stale,
} from './room-parts.tsx';
import { useRoom } from './use-room.ts';
import { DeadScreen, VotingScreen } from './voting-screen.tsx';

type Overlay =
  | { kind: 'ledger' }
  | { kind: 'invite' }
  | { kind: 'confirm-result' }
  | { kind: 'confirm-remove'; player: Player }
  | { kind: 'rename' }
  | null;

export const RoomPage = ({ code }: { code: string }) => {
  const [playerId] = useState(getPlayerId);
  const [savedName, setSavedName] = useState(getSavedPlayerName);
  /** The name we're seated under, or `null` while only watching (before taking a seat). */
  const [seatedName, setSeatedName] = useState<string | null>(null);
  const { room, status, removed, send, rejoin } = useRoom(code, {
    id: playerId,
    name: seatedName,
  });

  const me = room?.players.find(p => p.id === playerId) ?? null;
  // Back in a room you already sit in (a reload, a second tab): take the seat without asking.
  if (seatedName === null && me) setSeatedName(savedName || me.name);

  const takeSeat = (name: string) => {
    savePlayerName(name);
    setSavedName(name);
    setSeatedName(name);
  };

  if (removed) {
    return (
      <RemovedScreen
        code={code}
        savedName={seatedName ?? savedName}
        onRejoin={name => {
          takeSeat(name);
          rejoin();
        }}
      />
    );
  }
  if (room === null) return <ConnectingScreen code={code} label="Finding table" />;
  if (seatedName === null) {
    return <JoinScreen code={code} room={room} savedName={savedName} onJoin={takeSeat} />;
  }
  if (me === null) return <ConnectingScreen code={code} label="Taking your seat at" />;
  return (
    <SeatedRoom room={room} me={me} status={status} send={send} onRename={name => takeSeat(name)} />
  );
};

/** Tracks whether this round's result arrived while we watched, so only then is it animated. */
const useLiveReveal = (room: RoomView) => {
  const [previous, setPrevious] = useState(room);
  const [liveRound, setLiveRound] = useState<number | null>(null);
  if (room !== previous) {
    setPrevious(room);
    if (previous.result === null && room.result !== null && previous.round === room.round) {
      setLiveRound(room.round);
    }
  }
  return {
    animate: room.result !== null && liveRound === room.round,
    onRevealed: () => setLiveRound(null),
  };
};

const SeatedRoom = ({
  room,
  me,
  status,
  send,
  onRename,
}: {
  room: RoomView;
  me: Player;
  status: ReturnType<typeof useRoom>['status'];
  send: ReturnType<typeof useRoom>['send'];
  onRename: (name: string) => void;
}) => {
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [managing, setManaging] = useState(false);
  /** The round in which "Change vote" was tapped; the cards come back until a new vote lands. */
  const [changingRound, setChangingRound] = useState<number | null>(null);
  const reveal = useLiveReveal(room);
  const stale = status !== 'connected';
  const close = () => setOverlay(null);

  const vote = (vote: Vote) => {
    navigator.vibrate?.(15);
    send({ type: 'vote', vote });
    setChangingRound(null);
  };

  const header = (
    <RoomHeader
      code={room.code}
      status={status}
      onLedger={() => setOverlay({ kind: 'ledger' })}
      onInvite={() => setOverlay({ kind: 'invite' })}
    />
  );

  const body = () => {
    if (managing) {
      return (
        <>
          <ManageBar onDone={() => setManaging(false)} />
          {stale && <ReconnectingBanner />}
          <Stale stale={stale}>
            <ManageScreen
              room={room}
              me={me}
              onToggleDead={p => send({ type: 'set-dead', playerId: p.id, dead: !p.dead })}
              onRemove={p => setOverlay({ kind: 'confirm-remove', player: p })}
              onShowResult={() => setOverlay({ kind: 'confirm-result' })}
              onClearVotes={() => send({ type: 'reset' })}
              onRename={() => setOverlay({ kind: 'rename' })}
            />
          </Stale>
        </>
      );
    }
    if (room.result !== null) {
      return (
        <ResultScreen
          key={room.round}
          round={room.round}
          result={room.result}
          myVote={room.myVote}
          animate={reveal.animate}
          onRevealed={reveal.onRevealed}
          header={
            <>
              {header}
              {stale && <ReconnectingBanner />}
            </>
          }
          stale={stale}
          onNewVote={() => send({ type: 'reset' })}
          footer={
            <>
              <LedgerStrip room={room} onOpen={() => setOverlay({ kind: 'ledger' })} />
              <ManageLink onClick={() => setManaging(true)} />
            </>
          }
        />
      );
    }
    const content = () => {
      if (room.players.length === 1) {
        return (
          <>
            <div>
              <h1 className="font-display text-5xl font-black uppercase leading-[0.92] tracking-[0.01em]">
                Just you so far.
              </h1>
              <p className="mt-2 text-[15px] text-muted">
                Votes need voters. Pass the code round the table.
              </p>
            </div>
            <AloneCard code={room.code} />
            <ShareLinkButton code={room.code} />
            <Roster players={room.players} meId={me.id} />
          </>
        );
      }
      if (me.dead) return <DeadScreen room={room} me={me} />;
      return (
        <VotingScreen
          room={room}
          me={me}
          changing={changingRound === room.round}
          onVote={vote}
          onChange={() => setChangingRound(room.round)}
          onKeep={() => setChangingRound(null)}
          onWithdraw={() => send({ type: 'vote', vote: null })}
        />
      );
    };
    return (
      <>
        {header}
        {stale && <ReconnectingBanner />}
        <Stale stale={stale}>
          {content()}
          <ManageLink onClick={() => setManaging(true)} />
        </Stale>
      </>
    );
  };

  return (
    <>
      {body()}
      {overlay?.kind === 'ledger' && <LedgerSheet room={room} onClose={close} />}
      {overlay?.kind === 'invite' && <InviteDialog code={room.code} onClose={close} />}
      {overlay?.kind === 'confirm-result' && (
        <ConfirmResultSheet
          room={room}
          meId={me.id}
          onClose={close}
          onConfirm={() => {
            send({ type: 'reveal' });
            close();
            setManaging(false);
          }}
        />
      )}
      {overlay?.kind === 'confirm-remove' && (
        <ConfirmRemoveSheet
          player={overlay.player}
          isMe={overlay.player.id === me.id}
          onClose={close}
          onConfirm={() => {
            send({ type: 'remove', playerId: overlay.player.id });
            close();
          }}
        />
      )}
      {overlay?.kind === 'rename' && (
        <RenameSheet
          name={me.name}
          onClose={close}
          onSave={name => {
            onRename(name);
            close();
          }}
        />
      )}
    </>
  );
};
