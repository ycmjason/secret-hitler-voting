import type { Vote } from '../shared/protocol.ts';
import { HoldToCheck } from './hold-to-check.tsx';
import { VOTE_GLOSS, VOTE_WORD } from './room-text.ts';

/** The sealed envelope. It looks the same whatever is inside, until you hold the bar. */
const Envelope = ({ vote, round, held }: { vote: Vote; round: number; held: boolean }) => (
  <div className="env" aria-hidden="true">
    <div className="env-back" />
    <div className="env-slip">
      {held && (
        <div className="env-slip-frame">
          <div className="env-slip-word">{VOTE_WORD[vote]}</div>
          <div className="env-slip-gloss">({VOTE_GLOSS[vote]})</div>
        </div>
      )}
    </div>
    <div className="env-front">
      <span>VOTE {round} · SEALED</span>
    </div>
    <div className="env-flap" />
    <div className="env-seal" />
  </div>
);

export const SealedVote = ({ vote, round }: { vote: Vote; round: number }) => (
  <section>
    <h2 className="mb-1 font-display text-[40px] font-black uppercase leading-none tracking-[0.02em]">
      Vote cast.
    </h2>
    <p className="mb-3.5 text-[15px] text-muted">
      Sealed. Nobody sees it, you included, unless you hold the bar.
    </p>
    <HoldToCheck vote={vote}>
      {held => <Envelope vote={vote} round={round} held={held} />}
    </HoldToCheck>
  </section>
);
