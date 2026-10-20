import test from 'node:test';
import assert from 'node:assert/strict';
import { reconstructReplayTimeline } from '../src/lorcana/replay-timeline.js';

const fixture = () => ({
  format: 'duels-replay-v1', perspective: 1,
  baseSnapshot: { viewingAs: 1, turnNumber: 1, currentPlayer: 1,
    myPlayer: { lore: 0, hand: [{ id: '9-21', name: 'Pluto', instanceId: 'private-a' }], field: [], items: [], inkwell: [], inkDrops: 1 },
    opponent: { lore: 0, handCount: 7, field: [], items: [], inkwell: [], inkDrops: 1 } },
  frames: [
    { seq: 2, player: 1, actionType: 'END_TURN', patch: [{ op: 'replace', path: '/currentPlayer', value: 2 }] },
    { seq: 1, player: 1, actionType: 'QUEST', patch: [{ op: 'replace', path: '/myPlayer/lore', value: 2 }] }
  ]
});
test('reconstructs each frame in seq order without mutating input', () => {
  const replay = fixture(), before = JSON.stringify(replay);
  const result = reconstructReplayTimeline(replay);
  assert.deepEqual(result.steps.map(s => s.mine.lore), [0, 2, 2]);
  assert.deepEqual(result.steps.map(s => s.currentPlayer), [1, 1, 2]);
  assert.equal(result.steps[1].actionType, 'QUEST');
  assert.equal(result.steps[1].actor, 'mine');
  assert.equal(JSON.stringify(replay), before);
});
test('opponent private cards are never included or inferred', () => {
  const replay = fixture();
  replay.baseSnapshot.opponent.hand = [{id:'secret-card',name:'Secret'}];
  const result = reconstructReplayTimeline(replay);
  assert.equal(result.steps[0].opponent.handCount, 1);
  assert.equal(Object.hasOwn(result.steps[0].opponent, 'hand'), false);
  assert.equal(JSON.stringify(result).includes('secret-card'), false);
  assert.equal(result.steps[0].mine.hand[0].name, 'Pluto');
});
test('rejects unsafe patches', () => {
  const replay = fixture();
  replay.frames[0].patch = [{ op: 'add', path: '/__proto__/polluted', value: true }];
  assert.throws(() => reconstructReplayTimeline(replay), /non autorisé/);
});
test('missing fields remain unknown, not zero', () => {
  const replay = fixture();
  delete replay.baseSnapshot.opponent.handCount;
  assert.equal(reconstructReplayTimeline(replay).steps[0].opponent.handCount, null);
});
test('marks undone decisions and applies rollback patch to restore board', () => {
  const replay = fixture();
  replay.frames.push(
    {seq:3,player:1,actionType:'PLAY_CARD',patch:[{op:'add',path:'/myPlayer/field/0',value:{id:'9-21',fullName:'Pluto - Friendly Pooch',instanceId:'x',exerted:false}}]},
    {seq:4,player:1,actionType:'FREE_UNDO:3',patch:[{op:'remove',path:'/myPlayer/field/0'}]}
  );
  const result = reconstructReplayTimeline(replay);
  assert.equal(result.steps[3].mine.fieldCount,1);
  assert.equal(result.steps[3].undone,true);
  assert.equal(result.steps[4].mine.fieldCount,0);
  assert.equal(result.steps[4].isUndo,true);
  assert.deepEqual(result.undoneSeqs,[3]);
});
test('tracks board cards and ink availability without leaking deck order', () => {
  const replay=fixture();
  replay.baseSnapshot.myPlayer.inkwell=[{exerted:false},{exerted:true}];
  replay.baseSnapshot.myPlayer.deckOrder=['hidden-a','hidden-b'];
  replay.frames.push({seq:3,player:2,actionType:'PLAY_CARD',patch:[{op:'add',path:'/opponent/field/0',value:{id:'12-11',fullName:'Hamm - Piggy Bank',instanceId:'board-1',exerted:true}}]});
  const result=reconstructReplayTimeline(replay);
  assert.equal(result.steps[0].mine.readyInkCount,1);
  assert.equal(result.steps[3].opponent.field[0].name,'Hamm - Piggy Bank');
  assert.equal(result.steps[3].actor,'opponent');
  assert.equal(JSON.stringify(result).includes('hidden-a'),false);
});

test('uses exact replay card art and keeps action identity for visible quest',()=>{
 const replay=fixture();
 replay.baseSnapshot.myPlayer.field=[{id:'9-21',instanceId:'public-1',fullName:'Pluto - Friendly Pooch',imageSmallUrl:'https://cards.duels.ink/lorcana/en/thumbnail/9-21.webp?v=1',damage:1,exerted:false}];
 replay.frames[1].takenAction={type:'QUEST',player:1,cardId:'9-21',cardName:'Pluto - Friendly Pooch',cardInstanceId:'public-1',loreGained:2};
 const step=reconstructReplayTimeline(replay).steps[1];
 assert.equal(step.action.cardInstanceId,'public-1');
 assert.equal(step.action.loreGained,2);
 assert.match(step.mine.field[0].imageSmall,/cards\.duels\.ink/);
 assert.equal(step.mine.field[0].damage,1);
});
test('prevents hidden opponent ink card names and untrusted art from leaking',()=>{
 const replay=fixture();
 replay.baseSnapshot.opponent.field=[{id:'safe',fullName:'Public',imageUrl:'javascript:alert(1)'}];
 replay.frames[1].actionType='ADD_TO_INK';
 replay.frames[1].player=2;
 replay.frames[1].takenAction={cardName:'Secret Ink',cardId:'secret-ink',cardInstanceId:'private-id',source:'hand'};
 const timeline=reconstructReplayTimeline(replay);
 assert.deepEqual(timeline.steps[2].action,{hidden:true});
 assert.equal(timeline.steps[0].opponent.field[0].image,null);
 assert.equal(JSON.stringify(timeline).includes('Secret Ink'),false);
 assert.equal(JSON.stringify(timeline).includes('private-id'),false);
});
test('exposes challenge participants and damage without guessing extra information',()=>{
 const replay=fixture();
 replay.frames[1].actionType='ATTACK';
 replay.frames[1].takenAction={attackerName:'Pluto',attackerInstanceId:'a',defenderName:'Hamm',defenderInstanceId:'b',damageToDefender:2,defenderBanished:true};
 const action=reconstructReplayTimeline(replay).steps[1].action;
 assert.equal(action.attackerInstanceId,'a');
 assert.equal(action.defenderInstanceId,'b');
 assert.equal(action.damageToDefender,2);
 assert.equal(action.defenderBanished,true);
});
