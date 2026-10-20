import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzerHarness } from './helpers/analyzer-harness.js';
import { resultAsSavedRow } from '../src/lorcana/duels-results.js';

const row=()=>resultAsSavedRow({user_id:'owner',game_id:'fixture-game',native:{game_id:'fixture-game',queue_id:'core-bo1',mode:'matchmaking',ranked:true,match_format:'bo1',started_at:'2026-10-19T10:00:00Z',your_user_id:'duels-owner',result:'win',your_lore:20,opp_lore:12,replay_id:'fixture-pov'}});
const replay=()=>({format:'duels-replay-v1',perspective:1,winner:1,baseSnapshot:{viewingAs:1,status:'playing',currentPlayer:1,turnNumber:1,myPlayer:{lore:20,hand:[],inkwell:[],field:[],inkDrops:0},opponent:{lore:12,handCount:7,inkwell:[],field:[],inkDrops:0}},frames:[],logs:[]});
function setup({failSave=false,changeAccount=false}={}){
  let api;const saves=[],opened=[];
  api=analyzerHarness({globals:{saveMatchAnalysis:async(payload,details,owner)=>{
    if(failSave)throw new Error('fixture-save-failed');
    saves.push({payload,details,owner});const saved={...payload,id:'saved-fixture',user_id:owner};api.state.savedMatches=[saved];return saved;
  }},hooks:{renderSavedHistory(){},ensureLocalCardsLoaded:async()=>{},downloadDuelinkReplayBuffer:async()=>{
    if(changeAccount){api.accountBoundary.change('other');api.state.currentUser={id:'other'};api.state.duelinkAnalysisPending=false;}
    return new ArrayBuffer(2);
  },replaySha256FromBuffer:async()=>'fixture-sha',readReplayBuffer:async()=>replay(),refreshSavedMatches:async()=>api.state.savedMatches,resolveAutoDeckProfile:async()=>({id:null,name:null}),loadSavedAnalysis:async row=>{opened.push(row);}}});
  api.accountBoundary.change('owner');api.state.currentUser={id:'owner'};api.state.savedMatches=[row()];api.els.historyStatus={};
  return {api,saves,opened};
}
test('on-demand analysis uses the real replay parser and saves only that game, retaining the current replay and bulk queue',async()=>{
  const {api,saves,opened}=setup();const previous={sentinel:'current-replay'},queue=[{sentinel:'unrelated-bulk'}];
  api.state.merged=previous;api.state.bulkQueue=queue;
  await Promise.all([api.analyzeDuelinkResult(row()),api.analyzeDuelinkResult(row())]);
  assert.equal(saves.length,1,api.els.historyStatus.textContent);assert.equal(saves[0].owner,'owner');
  assert.equal(saves[0].payload.duelink_match_id,'fixture-game');assert.equal(saves[0].payload.played_at,'2026-10-19T10:00:00.000Z');
  assert.equal(saves[0].details.games.length,1);assert.equal(opened.length,1);assert.equal(api.state.merged,previous);assert.equal(api.state.bulkQueue,queue);assert.equal(api.state.duelinkAnalysisPending,false);
});
test('a failed save leaves the result reachable and never clears another replay',async()=>{
  const {api,saves}=setup({failSave:true}),previous={sentinel:true};api.state.merged=previous;
  await api.analyzeDuelinkResult(row());assert.equal(saves.length,0);assert.equal(api.state.savedMatches[0]._metadataOnly,true);assert.equal(api.state.merged,previous);
  assert.equal(api.state.duelinkAnalysisPending,false);assert.match(api.els.historyStatus.textContent,/fixture-save-failed/);
});
test('switching accounts during a replay download cannot save or open that replay in the new account',async()=>{
  const {api,saves,opened}=setup({changeAccount:true});
  await api.analyzeDuelinkResult(row());assert.equal(saves.length,0);assert.equal(opened.length,0);
});
