import { describe, expect, it } from 'vitest';
import { fillBoxes, parsePastedText, parseTypedLetters } from './room-code-input.ts';

describe('typing into a code box', () => {
  it('uppercases and drops anything that is not a letter', () => {
    expect(parseTypedLetters('k')).toEqual({ kind: 'letters', letters: ['K'] });
    expect(parseTypedLetters('3-')).toEqual({ kind: 'empty' });
  });

  it('rejects I and O', () => {
    expect(parseTypedLetters('i')).toEqual({ kind: 'rejected' });
    expect(parseTypedLetters('O')).toEqual({ kind: 'rejected' });
  });
});

describe('pasting into a code box', () => {
  it('takes a bare code', () => {
    expect(parsePastedText(' mbzr ')).toEqual({ kind: 'letters', letters: ['M', 'B', 'Z', 'R'] });
  });

  it('takes the code from the end of a room link', () => {
    for (const link of [
      'https://secret-hitler-voting.ycmjason.com/MBZR',
      'secret-hitler-voting.ycmjason.com/mbzr/',
      'Join us: https://secret-hitler-voting.ycmjason.com/MBZR.',
    ]) {
      expect(parsePastedText(link)).toEqual({ kind: 'letters', letters: ['M', 'B', 'Z', 'R'] });
    }
  });

  it('rejects a code with I or O', () => {
    expect(parsePastedText('https://secret-hitler-voting.ycmjason.com/MBZO')).toEqual({
      kind: 'rejected',
    });
    expect(parsePastedText('kiwi')).toEqual({ kind: 'rejected' });
  });

  it('treats fewer than four letters as typed', () => {
    expect(parsePastedText('kx')).toEqual({ kind: 'letters', letters: ['K', 'X'] });
    expect(parsePastedText('12')).toEqual({ kind: 'empty' });
  });
});

describe('filling the boxes', () => {
  it('deals letters from a box onwards and focuses the next empty one', () => {
    expect(fillBoxes(['K', '', '', ''], ['X'], 1)).toEqual({ boxes: ['K', 'X', '', ''], focus: 2 });
  });

  it('stops at the last box', () => {
    expect(fillBoxes(['', '', '', ''], ['M', 'B', 'Z', 'R'], 0)).toEqual({
      boxes: ['M', 'B', 'Z', 'R'],
      focus: 3,
    });
    expect(fillBoxes(['', '', '', ''], ['M', 'B', 'Z', 'R'], 2)).toEqual({
      boxes: ['', '', 'M', 'B'],
      focus: 3,
    });
  });
});
