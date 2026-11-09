// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VoteCards } from './vote-card.tsx';

afterEach(cleanup);

describe('the ballot cards', () => {
  it('render identical markup apart from the word and its gloss, JA! on the left', () => {
    render(<VoteCards onVote={() => {}} />);
    const [left, right] = screen.getAllByRole('button');
    expect(left).toHaveProperty('textContent', 'JA!(YES)');
    expect(right).toHaveProperty('textContent', 'NEIN(NO)');
    const neutral = (html: string | undefined) =>
      html?.replaceAll(/JA!|NEIN/g, 'WORD').replaceAll(/\((YES|NO)\)/g, '(GLOSS)');
    expect(neutral(left?.outerHTML)).toBe(neutral(right?.outerHTML));
  });

  it('cast the vote they show', () => {
    const onVote = vi.fn();
    render(<VoteCards onVote={onVote} />);
    fireEvent.click(screen.getByRole('button', { name: 'Vote NEIN' }));
    expect(onVote).toHaveBeenCalledWith('nein');
  });
});
