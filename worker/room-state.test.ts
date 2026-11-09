import { describe, expect, it } from 'vitest';
import type { ClientMessage } from '../shared/protocol.ts';
import { applyMessage, createRoomState, type RoomState, toRoomView } from './room-state.ts';

const run = (steps: [senderId: string | null, message: ClientMessage][]): RoomState =>
  steps.reduce(
    (state, [senderId, message]) => applyMessage(state, senderId, message),
    createRoomState('ABCD'),
  );

const join = (id: string): [string | null, ClientMessage] => [
  null,
  { type: 'join', playerId: id, name: id },
];
const vote = (id: string, v: 'ja' | 'nein' | null): [string, ClientMessage] => [
  id,
  { type: 'vote', vote: v },
];
const view = (state: RoomState, viewerId: string) =>
  toRoomView(state, { viewerId, onlineIds: new Set([viewerId]) });

describe('voting', () => {
  it('stays open until every living player has voted', () => {
    const state = run([join('a'), join('b'), join('c'), vote('a', 'ja'), vote('b', 'nein')]);
    expect(state.result).toBeNull();
    expect(view(state, 'c').players.map(p => p.voted)).toEqual([true, true, false]);
  });

  it('shows the result once everyone has voted, and records it in history', () => {
    const state = run([
      join('a'),
      join('b'),
      join('c'),
      vote('a', 'ja'),
      vote('b', 'ja'),
      vote('c', 'nein'),
    ]);
    expect(state.result).toEqual({ ja: 2, nein: 1, passed: true, missing: 0 });
    expect(state.history).toEqual([{ round: 1, ja: 2, nein: 1, passed: true, missing: 0 }]);
  });

  it('fails on a tie', () => {
    const state = run([join('a'), join('b'), vote('a', 'ja'), vote('b', 'nein')]);
    expect(state.result).toEqual({ ja: 1, nein: 1, passed: false, missing: 0 });
  });

  it('lets a player change or withdraw a vote before the result', () => {
    const state = run([join('a'), join('b'), vote('a', 'ja'), vote('a', 'nein'), vote('a', null)]);
    expect(view(state, 'a').myVote).toBeNull();
    expect(view(state, 'b').players[0]?.voted).toBe(false);
  });

  it('ignores votes after the result is shown', () => {
    const state = run([join('a'), vote('a', 'ja'), vote('a', 'nein')]);
    expect(state.result).toEqual({ ja: 1, nein: 0, passed: true, missing: 0 });
  });

  it('ignores votes from connections that have not joined', () => {
    const state = run([join('a'), [null, { type: 'vote', vote: 'ja' }]]);
    expect(state.players[0]?.vote).toBeNull();
  });
});

describe('anonymity', () => {
  it('never shows a player anyone else’s vote, before or after the result', () => {
    const steps = [join('a'), join('b'), vote('a', 'ja')];
    const before = view(run(steps), 'b');
    const after = view(run([...steps, vote('b', 'nein')]), 'b');
    for (const v of [before, after]) {
      expect(JSON.stringify(v)).not.toMatch(/:"ja"/);
      expect(v.players.every(p => !('vote' in p))).toBe(true);
    }
    expect(after.myVote).toBe('nein');
  });
});

describe('watching', () => {
  it('changes nothing, and a watcher sees who is seated but no votes', () => {
    const state = run([join('a'), vote('a', 'ja')]);
    expect(applyMessage(state, null, { type: 'watch' })).toBe(state);
    const watcherView = toRoomView(state, { viewerId: null, onlineIds: new Set(['a']) });
    expect(watcherView.players.map(p => p.id)).toEqual(['a']);
    expect(watcherView.myVote).toBeNull();
    expect(JSON.stringify(watcherView)).not.toMatch(/:"ja"/);
  });
});

describe('dead players', () => {
  it('do not vote and are not waited for', () => {
    const state = run([
      join('a'),
      join('b'),
      vote('b', 'nein'),
      ['a', { type: 'set-dead', playerId: 'b', dead: true }],
      vote('b', 'ja'),
    ]);
    expect(state.players[1]?.vote).toBeNull();
    expect(state.result).toBeNull();
    expect(
      run([
        ...[join('a'), join('b')],
        ['a', { type: 'set-dead', playerId: 'b', dead: true }],
        vote('a', 'ja'),
      ]).result,
    ).toEqual({ ja: 1, nein: 0, passed: true, missing: 0 });
  });

  it('marking the last holdout dead shows the result', () => {
    const state = run([
      join('a'),
      join('b'),
      vote('a', 'ja'),
      ['a', { type: 'set-dead', playerId: 'b', dead: true }],
    ]);
    expect(state.result).toEqual({ ja: 1, nein: 0, passed: true, missing: 0 });
  });
});

describe('room controls', () => {
  it('reveal shows the result early, counting the living players who had not voted', () => {
    const state = run([
      join('a'),
      join('b'),
      join('c'),
      join('d'),
      ['a', { type: 'set-dead', playerId: 'd', dead: true }],
      vote('a', 'ja'),
      ['b', { type: 'reveal' }],
    ]);
    expect(state.result).toEqual({ ja: 1, nein: 0, passed: true, missing: 2 });
    expect(state.history).toEqual([{ round: 1, ja: 1, nein: 0, passed: true, missing: 2 }]);
  });

  it('reset after a result starts the next round', () => {
    const state = run([join('a'), vote('a', 'ja'), ['a', { type: 'reset' }]]);
    expect(state).toMatchObject({ round: 2, result: null });
    expect(state.players[0]?.vote).toBeNull();
    expect(state.history).toHaveLength(1);
  });

  it('reset mid-vote clears votes without starting a new round', () => {
    const state = run([join('a'), join('b'), vote('a', 'ja'), ['a', { type: 'reset' }]]);
    expect(state).toMatchObject({ round: 1, result: null });
    expect(state.players[0]?.vote).toBeNull();
  });

  it('removing the last holdout shows the result', () => {
    const state = run([
      join('a'),
      join('b'),
      vote('a', 'nein'),
      ['a', { type: 'remove', playerId: 'b' }],
    ]);
    expect(state.players.map(p => p.id)).toEqual(['a']);
    expect(state.result).toEqual({ ja: 0, nein: 1, passed: false, missing: 0 });
  });

  it('lets a player remove themselves', () => {
    const state = run([
      join('a'),
      join('b'),
      vote('b', 'ja'),
      ['a', { type: 'remove', playerId: 'a' }],
    ]);
    expect(state.players.map(p => p.id)).toEqual(['b']);
    expect(state.result).toEqual({ ja: 1, nein: 0, passed: true, missing: 0 });
  });

  it('ignores controls from connections that have not joined', () => {
    const state = run([join('a'), [null, { type: 'remove', playerId: 'a' }]]);
    expect(state.players).toHaveLength(1);
  });
});

describe('join', () => {
  it('keeps the seat and vote on rejoin, updating the name', () => {
    const state = run([
      join('a'),
      join('b'),
      vote('a', 'ja'),
      [null, { type: 'join', playerId: 'a', name: '  New   name ' }],
    ]);
    expect(state.players.map(p => p.name)).toEqual(['New name', 'b']);
    expect(state.players[0]?.vote).toBe('ja');
  });

  it('names a blank player Anonymous', () => {
    expect(run([[null, { type: 'join', playerId: 'a', name: '   ' }]]).players[0]?.name).toBe(
      'Anonymous',
    );
  });
});
