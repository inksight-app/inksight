import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_ERAS, DEFAULT_STAT_SCOPE, classifyGameContext, contextFields, rowMatchesScope, resultSummary, eraCatalog, coherentDeckList, scopeEraStart } from '../src/lorcana/seasons.js';

const game=(id,overrides={})=>({id,duelink_match_id:id,format:'BO1',api_metadata:{api_row:{raw:{queue_id:'core-bo1',queue_name:'Core Set 14 BO1',ranked:true,mode:'matchmaking',season_name:'Core BO1 - Set 14',started_at:'2026-10-19T10:00:00Z',result:'win',match_format:'bo1',...overrides}}}});

test('current chapter never falls back to old games; archives retain them without mutation',()=>{
  const rows=[...Array.from({length:50},(_,i)=>game('old-'+i,{season_name:'Core BO1 - Set 13',started_at:'2026-08-01T10:00:00Z'})),...Array.from({length:25},(_,i)=>game('beta-'+i,{queue_id:'quick-play-core-set13',queue_name:'Quick Play: Core Set 13 BETA',ranked:false,season_name:null,started_at:'2026-08-01T10:00:00Z'}))];
  const before=JSON.stringify(rows);
  assert.equal(rows.filter(row=>rowMatchesScope(row)).length,0);
  assert.equal(rows.filter(row=>rowMatchesScope(row,{era:'set-13',queue:'core-bo1'})).length,50);
  assert.equal(rows.filter(row=>rowMatchesScope(row,{era:'set-13',queue:'all'})).length,75);
  assert.equal(JSON.stringify(rows),before);
  assert.deepEqual(DEFAULT_STAT_SCOPE,{era:'current',queue:'core-bo1'});
});
test('immutable season beats renamed queue labels; contradictory dates and import dates are not trusted',()=>{
  assert.equal(classifyGameContext(game('old',{season_name:'Core BO1 - Set 13',started_at:'2026-08-01T10:00:00Z'})).chapter,13);
  assert.equal(classifyGameContext(game('date',{season_name:null,started_at:'2026-08-01T10:00:00Z'})).chapter,13);
  assert.equal(classifyGameContext(game('conflict',{season_name:'Core BO1 - Set 13'})).confidence,'conflict');
  assert.equal(rowMatchesScope({played_at:'2026-10-19T10:00:00Z',queue:'Core Set 14 BO1',format:'BO1',result:'win'}),false);
  assert.equal(classifyGameContext({played_at:'2026-10-19T10:00:00Z'}).chapter,null);
  const beta=classifyGameContext(game('beta',{queue_id:'quick-play-core-set13',ranked:false,season_name:null,started_at:'2026-08-01T10:00:00Z'}));
  assert.equal(beta.chapter,13);assert.equal(beta.queue,'other');
});
test('ranked Core BO1 and BO3 remain disjoint, including JSON projections and conflicts',()=>{
  const bo3=game('bo3',{queue_id:'core-bo3',queue_name:'Core Set 14 BO3',match_format:'bo3'});
  assert.equal(rowMatchesScope(bo3),false);
  assert.equal(rowMatchesScope(bo3,{era:'current',queue:'core-bo3'}),true);
  assert.equal(classifyGameContext(game('bad',{queue_id:'core-bo1',match_format:'bo3'})).queue,'unknown');
  const flat={context_queue_id:'core-bo1',context_ranked:true,context_mode:'matchmaking',context_season_name:'Core BO1 - Set 14',context_started_at:'2026-10-19T10:00:00Z',context_result:'win',context_match_format:'bo1'};
  assert.equal(rowMatchesScope(flat),true);
  assert.equal(rowMatchesScope({...flat,context_ranked:false}),false);
  assert.equal(rowMatchesScope(game('private',{mode:'private'})),false);
});
test('API era discovery advances the default chapter, without moving historical rows',()=>{
  const eras=eraCatalog({currentEra:{key:'set-15-core',name:'Set 15',startedAt:'2027-01-01T00:00:00Z'},pastEras:[{...DEFAULT_ERAS[0],endedAt:'2027-01-01T00:00:00Z'}]});
  assert.equal(eras[0].chapter,15);
  assert.equal(rowMatchesScope(game('set14'),DEFAULT_STAT_SCOPE,eras),false);
  assert.equal(rowMatchesScope(game('set14'),{era:'set-14',queue:'core-bo1'},eras),true);
  assert.equal(scopeEraStart(DEFAULT_STAT_SCOPE,eras),'2027-01-01T00:00:00Z');
  assert.equal(scopeEraStart({era:'all',queue:'all'}),null);
});
test('null and abandoned native results are never converted to legacy losses; draws stay distinct',()=>{
  const unknown=game('null',{result:null});unknown.result='loss';
  assert.equal(contextFields(unknown).result,null);
  assert.equal(contextFields({duelink_match_id:'flat',context_result:null,result:'loss'}).result,null);
  const summary=resultSummary([game('w'),game('l',{result:'loss'}),game('d',{result:'draw'}),unknown,game('a',{result:'abandoned'})]);
  assert.equal(summary.games.wins,1);assert.equal(summary.games.losses,1);assert.equal(summary.games.draws,1);assert.equal(summary.games.unknown,2);assert.equal(summary.games.n,3);
});
test('BO3 counts confirmed series, not rows, excludes incomplete results and deduplicates games',()=>{
  const match=(id,series,result,number)=>game(id,{queue_id:'core-bo3',queue_name:'Core BO3',match_format:'bo3',match_id:series,result,match_game_number:number});
  const rows=[match('a1','a','win',1),match('a2','a','loss',2),match('a3','a','win',3),match('b1','b','loss',1),match('b2','b','loss',2),match('c1','c','win',1),match('u',null,'loss',1)];
  const result=resultSummary([...rows,rows[0]]);
  assert.equal(result.games.n,7);assert.equal(result.matches.n,2);assert.equal(result.matches.wins,1);assert.equal(result.matches.losses,1);assert.equal(result.matches.unconfirmed,2);assert.equal(result.matches.rate,50);
  const damaged=resultSummary([match('x1','x','win',1),match('x2','x','win',2),match('x3','x',null,3)]);
  assert.equal(damaged.matches.n,0);assert.equal(damaged.matches.unconfirmed,1);
});
test('card and mulligan cohorts require the same recorded decklist, even within one deck profile',()=>{
  assert.equal(coherentDeckList([{deck_profile_id:'same',context_deck_hash:'a'},{deck_profile_id:'same',context_deck_hash:'b'}]),false);
  assert.equal(coherentDeckList([{context_deck_hash:'a'},{api_metadata:{my_deck_hash:'a'}}]),true);
  assert.equal(coherentDeckList([{context_deck_hash:'a'},{}]),false);
  assert.equal(coherentDeckList([]),false);
});
