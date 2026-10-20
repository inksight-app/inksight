import test from 'node:test';
import assert from 'node:assert/strict';
import { nativeHistoryRow,resultAsSavedRow,mergeDuelinkResults,gameFromResultRow,nativeMmrDelta } from '../src/lorcana/duels-results.js';
import { contextFields,resultSummary } from '../src/lorcana/seasons.js';
import { analyzerHarness } from './helpers/analyzer-harness.js';

export const native=(patch={})=>({game_id:'game-a',your_user_id:'duels-owner',mode:'matchmaking',queue_id:'core-bo1',match_format:null,ranked:true,started_at:'2026-10-19T10:00:00.000Z',ended_at:'2026-10-19T10:15:00.000Z',result:'win',your_lore:20,opp_lore:12,your_deck_colors:'amber/steel',opp_deck_colors:'ruby/amethyst',your_deck_id:'deck-a',your_decklist:[{cardId:'14-1',count:4}],opp_display_name:'Synthetic <opponent>',went_first:false,replay_id:'replay-a',mmr_delta:12,is_placement:false,...patch});
const record=(patch={})=>({game_id:'game-a',user_id:'owner',source_updated_at:'2026-10-20T10:00:00Z',native:native(patch)});

test('native results whitelist fields and real string colors; malformed own lists are rejected',()=>{
  const clean=nativeHistoryRow(native({opp_decklist:[{cardId:'private',count:4}],uncontracted:{secret:1},placement_number:2,opp_guest:false}));
  assert(!('opp_decklist' in clean));assert(!('uncontracted' in clean));assert.equal(clean.placement_number,2);assert.equal(clean.opp_guest,false);
  assert.equal(nativeHistoryRow(native({your_decklist:{cards:[]}})),null);
  assert.equal(nativeHistoryRow(native({your_decklist:[{cardId:'14-1',count:-1}]})),null);
  assert.equal(nativeHistoryRow(native({opp_display_name:{private:1}})),null);
  assert.equal(nativeHistoryRow(native({result:'mystery'})),null);
  const row=resultAsSavedRow(record(),[{id:'profile-a',external_deck_id:'deck-a',name:'My deck'}]);
  assert.deepEqual(row.mine_colors,['amber','steel']);assert.deepEqual(row.opponent_colors,['ruby','amethyst']);
  assert.equal(row.deck_profile_id,'profile-a');assert.equal(row.format,'BO1');assert.equal(row._metadataOnly,true);
  assert.equal(gameFromResultRow(row).startedAt,'2026-10-19T10:00:00.000Z');
});
test('native draws and unknown results replace stale projections without erasing replay analyses',()=>{
  const parsed={id:'saved-a',duelink_match_id:'game-a',context_result:'loss',context_queue_id:'core-bo1',result:'loss',deck_profile_id:'custom-profile',analysis_json:{narrative:{title:'Kept'}},team_visible:true};
  const merged=mergeDuelinkResults([parsed],[record({result:'draw'}),{...record(),game_id:'game-b',native:native({game_id:'game-b',result:null,replay_id:null})}]);
  assert.equal(merged.length,2);
  const row=merged.find(row=>row.id==='saved-a');assert.equal(row.result,'draw');assert.equal(contextFields(row).result,'draw');
  assert.equal(row.deck_profile_id,'custom-profile');assert.equal(row.team_visible,true);assert.deepEqual(row.analysis_json,parsed.analysis_json);assert.equal(row._metadataOnly,undefined);
  assert.deepEqual(resultSummary(merged).games,{wins:0,losses:0,draws:1,unknown:1,n:1,rate:0});
  assert.equal(nativeMmrDelta(resultAsSavedRow(record({mmr_delta:null}))),null);
  assert.equal(nativeMmrDelta(resultAsSavedRow(record({mmr_delta:0}))),0);
  assert.equal(nativeMmrDelta(resultAsSavedRow(record({is_placement:true,mmr_delta:12}))),null);
  assert.equal(mergeDuelinkResults([],[{...record(),hidden_at:'2026-10-20'}]).length,0);
});
test('metadata results never become UUID analysis requests, fake zero metrics or saved replay duplicates',()=>{
  const api=analyzerHarness(),row=resultAsSavedRow(record());
  api.state.savedMatches=[row];
  assert.equal(api.uniqueSavedMatchIds([row]).length,0);assert.equal(api.collectSavedDuelinkRefs().gameIds.size,0);
  assert.equal(api.findDuplicateSavedMatchForData({first:{sourceType:'duelink_api',duelinkGameId:'game-a'}}),null);
  const analytics=api.computePerformanceAnalytics([row]);assert.equal(analytics.games.length,0);assert.equal(analytics.cards.length,0);assert.equal(analytics.turnRows.length,0);
  assert.match(api.savedAnalysisButtonHtml(row),/>Analyser</);
  assert.match(api.savedAnalysisButtonHtml(resultAsSavedRow(record({replay_id:null}))),/disabled>Replay indisponible/);
  const html=api.savedMatchRowHtml(row);assert.match(html,/\+12 MMR/);assert.match(html,/Synthetic &lt;opponent&gt;/);assert.doesNotMatch(html,/data-team-visible/);
});
test('every unanalysed BO3 game stays reachable and confirmed series count once',()=>{
  const api=analyzerHarness();
  const rows=['win','loss','win'].map((result,i)=>resultAsSavedRow({game_id:'game-'+i,native:native({game_id:'game-'+i,queue_id:'core-bo3',match_format:'bo3',match_id:'series-a',match_game_number:i+1,result})}));
  assert.equal(api.collapseSeriesForHistory(rows).length,3);
  assert.equal(resultSummary(rows).matches.wins,1);
  const analyses=rows.map((row,i)=>({...row,id:'saved-'+i,_metadataOnly:false}));
  assert.equal(api.collapseSeriesForHistory(analyses).length,1);
});
test('history win rate keeps the same per-game unit before and after BO3 replay analysis',()=>{
  const api=analyzerHarness();api.state.currentUser={id:'owner'};api.state.savedMatchesLoaded=true;api.els.historyList={};
  const rows=['win','loss','win'].map((result,i)=>resultAsSavedRow({game_id:'game-'+i,native:native({game_id:'game-'+i,queue_id:'core-bo3',match_format:'bo3',match_id:'series-a',match_game_number:i+1,result})}));
  api.state.savedMatches=rows;api.renderSavedHistory();
  assert.match(api.els.historyList.innerHTML,/Victoires par manche<\/span><strong>67%/);
  api.state.savedMatches=rows.map((row,i)=>({...row,id:'saved-'+i,_metadataOnly:false}));api.renderSavedHistory();
  assert.match(api.els.historyList.innerHTML,/Victoires par manche<\/span><strong>67%/);
});
