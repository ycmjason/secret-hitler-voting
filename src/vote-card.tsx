import type { Vote } from '../shared/protocol.ts';
import { VOTE_GLOSS, VOTE_WORD } from './room-text.ts';

/**
 * A ballot card. JA! and NEIN must render identically apart from the word and its gloss, so a
 * neighbour glancing over sees only paper: same element, classes, size and frame for both.
 */
export const VoteCard = ({ vote, onVote }: { vote: Vote; onVote?: (vote: Vote) => void }) => {
  const face = (
    <span className="ballot-frame">
      <span className="ballot-lock">
        <span className="ballot-word">{VOTE_WORD[vote]}</span>
        <span className="ballot-gloss">({VOTE_GLOSS[vote]})</span>
      </span>
    </span>
  );
  return onVote ? (
    <button
      type="button"
      className="ballot"
      aria-label={`Vote ${VOTE_WORD[vote]}`}
      onClick={() => onVote(vote)}
    >
      {face}
    </button>
  ) : (
    <span className="ballot" aria-hidden="true">
      {face}
    </span>
  );
};

/** The two ballot cards, JA! always on the left. */
export const VoteCards = ({ onVote }: { onVote: (vote: Vote) => void }) => (
  <div className="grid grid-cols-[repeat(2,146px)] justify-center gap-4">
    <VoteCard vote="ja" onVote={onVote} />
    <VoteCard vote="nein" onVote={onVote} />
  </div>
);
