import test from 'node:test';
import assert from 'node:assert/strict';
import { reconstructReplayTimeline } from '../src/lorcana/replay-timeline.js';

const fixture = () => ({
  format: 'duels-replay-v1', perspective: 1,
  baseSnapshot: { viewingAs: 1, turnNumber: 1, currentPlayer: 1,
    myPlayer: { lore: 0, hand: [{ instanceId: 'private-a' }], field: [], inkwell: [], inkDrops: 1 },
    opponent: { lore: 0, handCount: 7, field: [], inkwell: [], inkDrops: 1 } },
  frames: [
    { seq: 2, actionType: 'END_TURN', patch: [{ op: 'replace', path: '/currentPlayer', value: 2 }] },
    { seq: 1, actionType: 'QUEST', patch: [{ op: 'replace', path: '/myPlayer/lore', value: 2 }] }
  ]
});
test('reconstructs every replay frame in sequence, without mutating the replay', () => {
  const replay = fixture(), before = JSON.stringify(replay);
  const result = reconstructReplayTimeline(replay);
  assert.deepEqual(result.steps.map(s => s.mine.lore), [0, 2, 2]);
  assert.deepEqual(result.steps.map(s => s.currentPlayer), [1, 1, 2]);
  assert.equal(result.steps[1].actionType, 'QUEST');
  assert.equal(JSON.stringify(replay), before);
});
test('never guesses hidden opponent cards', () => {
  const result = reconstructReplayTimeline(fixture());
  assert.equal(result.steps[0].opponent.handCount, 7);
  assert.equal(Object.hasOwn(result.steps[0].opponent, 'hand'), false);
  assert.equal(result.steps[0].opponent.fieldInstanceIds.length, 0);
});
test('invalid or unsafe patches are rejected', () => {
  const replay = fixture();
  replay.frames[0].patch = [{ op: 'add', path: '/__proto__/polluted', value: true }];
  assert.throws(() => reconstructReplayTimeline(replay), /non autorisé/);
});
test('missing facts remain unknown rather than becoming zero', () => {
  const replay = fixture();
  delete replay.baseSnapshot.opponent.handCount;
  assert.equal(reconstructReplayTimeline(replay).steps[0].opponent.handCount, null);
});
