import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { SessionBoundary } from '../src/security/session.js';
import { CORE_SET_NUMBERS, isCurrentCoreGame } from '../src/lorcana/format.js';
import { replayCancellations, analyzeInkDrops, combineInkDrops } from '../src/lorcana/resources.js';
import { applyReplayPatch } from '../src/security/replay.js';
import * as seasons from '../src/lorcana/seasons.js';
import metaHandler from '../api/duelink-meta.js';

const base=()=>({format:'duels-replay-v1',perspective:1,baseSnapshot:{viewingAs:1,status:'playing',currentPlayer:1,turnNumber:1,myPlayer:{lore:0,hand:[],inkwell:[],field:[],inkDrops:0},opponent:{lore:0,handCount:7,inkwell:[],field:[],inkDrops:0}},frames:[],logs:[]});
const frame=(seq,actionType,patch,takenAction={})=>({seq,actionType,patch,takenAction,player:1,turnNumber:1});
const replace=(path,value)=>({op:'replace',path,value});

test('in-flight account work cannot cross identities, logout, or a later login of the same user',()=>{
  const boundary=new SessionBoundary();boundary.change('A');const old=boundary.capture();
  assert.equal(boundary.isCurrent(old),true);boundary.change('B');assert.equal(boundary.isCurrent(old),false);
  boundary.change(null);boundary.change('A');assert.equal(boundary.isCurrent(old),false);
  assert.throws(()=>boundary.assertCurrent(old));const fresh=boundary.capture();assert.equal(boundary.change('A'),false);assert.equal(boundary.isCurrent(fresh),true);
});
test('Core adds Set 14 without rotating Set 9, and a renamed queue cannot relabel an old game',()=>{
  assert.deepEqual([...CORE_SET_NUMBERS],['9','10','11','12','13','14']);
  assert.equal(isCurrentCoreGame({queue:'Core Set 14 BO1',startedAt:'2026-07-30T10:00:00Z'}),false);
  assert.equal(isCurrentCoreGame({queue:'Core Set 14 BO1',startedAt:'2026-10-20T10:00:00Z'}),true);
  assert.equal(isCurrentCoreGame({queue:'Quick Play Core Set 13',startedAt:'2026-10-10T10:00:00Z'}),false);
  assert.equal(isCurrentCoreGame({queue:'Core Set 14'}),false);
  assert.equal(isCurrentCoreGame({queue:'Core 日本語 BO1',startedAt:'2026-10-20T10:00:00Z'}),false);
});
test('inkdrops: both-turn gains, explicit payment, alternate removal and final stock stay distinct',()=>{
  const replay=base();
  replay.frames=[
    frame(1,'RESPOND_TO_PROMPT',[replace('/myPlayer/inkDrops',4)]),
    frame(2,'PLAY_CARD',[replace('/myPlayer/inkDrops',2)],{inkDropsToSpend:2}),
    frame(3,'END_TURN',[replace('/currentPlayer',2)]),
    {...frame(4,'ACTIVATE_ABILITY',[replace('/myPlayer/inkDrops',5),replace('/opponent/inkDrops',1)]),player:2},
    frame(5,'PLAY_CARD',[replace('/myPlayer/inkDrops',3)],{alternateCost:'remove_ink_drops'})
  ];
  const result=analyzeInkDrops(replay);
  assert.deepEqual(result.mine,{start:0,gained:7,removed:4,paid:2,unattributed:2,end:3});
  assert.equal(result.opponent.gained,1);assert.equal(result.opponent.end,1);
  assert.equal(result.timeline.mine.reduce((sum,row)=>sum+row.gained,0),7);
  assert.equal(result.timeline.mine.reduce((sum,row)=>sum+row.removed,0),4);
  assert.equal(result.timeline.mine.at(-1).stock,3);
  assert(result.timeline.mine.some(row=>row.activeOwner==='opponent' && row.gained===3));
  assert.equal(combineInkDrops([{inkDrops:result.mine},{}]),null);
  assert.equal(combineInkDrops([{inkDrops:result.mine},{inkDrops:result.mine}]).gained,14);
});
test('undone actions do not inflate inkdrop totals, and malformed rewinds fail explicitly',()=>{
  const replay=base();replay.frames=[frame(1,'PLAY_CARD',[replace('/myPlayer/inkDrops',3)]),frame(2,'FREE_UNDO:1',[replace('/myPlayer/inkDrops',0)]),frame(3,'PLAY_CARD',[replace('/myPlayer/inkDrops',1)])];
  assert.deepEqual([...replayCancellations(replay.frames)],[1]);assert.equal(analyzeInkDrops(replay).mine.gained,1);
  replay.frames[1].actionType='FREE_UNDO:999';assert.throws(()=>analyzeInkDrops(replay));
  replay.frames[1].actionType='UNDO_UNKNOWN';assert.throws(()=>analyzeInkDrops(replay));
});
test('missing legacy zero counts work, negative/malformed resource counts do not',()=>{
  const replay=base();delete replay.baseSnapshot.myPlayer.inkDrops;assert.equal(analyzeInkDrops(replay).mine.end,0);
  replay.baseSnapshot.myPlayer.inkDrops=-1;assert.throws(()=>analyzeInkDrops(replay));
  replay.baseSnapshot.myPlayer.inkDrops='3';assert.throws(()=>analyzeInkDrops(replay));
});
test('Set 14 catalog is local, attributed, and contains 242 unique print references',()=>{
  const data=JSON.parse(fs.readFileSync(new URL('../public/lorcana-set14.json',import.meta.url)));
  assert.equal(data.cards.length,242);assert.equal(new Set(data.cards.map(c=>c.id)).size,242);
  assert.equal(data.language,'en');assert.equal(data.source,'https://api.lorcast.com/v0');
  assert(data.cards.every(c=>c.id.startsWith('14-')&&c.set==='SET14'&&Number.isFinite(c.cost)));
});
function analyzerHarness(){
  const text=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
  const end=text.indexOf('\n})();');
  assert(end>0);
  const context=vm.createContext({...seasons,document:{documentElement:{style:{setProperty(){}}},addEventListener(){},querySelectorAll(){return[];},querySelector(){return null;},getElementById(){return null;}},getComputedStyle(){return{getPropertyValue(){return'';}};},window:{},Chart:{},JSZip:{},pako:{},SessionBoundary,CORE_SET_NUMBERS,isCurrentCoreGame,analyzeInkDrops,combineInkDrops,replayCancellations,applyReplayPatch,structuredClone,console,setTimeout,clearTimeout,TextDecoder,URL,Map,Set,Date});
  vm.runInContext(text.slice(0,end)+'\n globalThis.testApi={parseReplay,state,els,buildCardIndex,cardSetNumbers,coreLegality,scopedSavedRows,filteredSavedMatches,gamePassesImportFilters,rowSetNum,compactMetrics,savedMetrics,arrayify,savedRowToRuntimeState,isPerformanceDataScoped,computePerformanceAnalytics,computeTempoSplit,renderScopeResultSummary,generateMatchNarrative,renderSavedStats,gameJsonFromDetailRow};\n})();',context);
  return context.testApi;
}
test('saved history accepts sanitized null-prototype objects without coercing them to text',()=>{
  const api=analyzerHarness();
  const point=Object.assign(Object.create(null),{turn:1,handCount:5});
  assert.equal(api.arrayify([point,null,'',0]).length,2);
  const json={metrics:{mine:{handKnown:true,handByTurn:[point],inkByTurn:[{turn:1,capacity:2,spent:1,float:1}]}},charts:{lore_series:[{turn:1,mine:2,opponent:0}]},hand_retention:{mine:[{cardName:'Fixture',maxHeldTurns:1}]}};
  const safeCopy=v=>Array.isArray(v)?v.map(safeCopy):v&&typeof v==='object'?Object.assign(Object.create(null),Object.fromEntries(Object.entries(v).map(([k,x])=>[k,safeCopy(x)]))):v;
  json.games=[{otp:false}];
  const runtime=api.savedRowToRuntimeState(safeCopy({id:'fixture',created_at:'2026-10-20',result:'win',total_turns:1,analysis_json:json}));
  assert.equal(runtime.sessions[0].proMetrics.handByTurn[0].handCount,5);
  assert.equal(runtime.sessions[0].handRetention.length,1);
  assert.equal(runtime.sessions[0].firstTurnPlayer,2);
});
test('the all-formats selector does not lock a filtered identical decklist',()=>{
  const api=analyzerHarness();
  api.state.statScope={era:'current',queue:'all'};
  api.state.savedMatches=[{id:'fixture',result:'win',format:'BO1',my_decklist:[{cardId:'14-1',count:4}],apiRow:{queue_id:'core-bo1',ranked:true,season_name:'Core BO1 - Set 14',started_at:'2026-10-20',result:'win'}}];
  assert.equal(api.isPerformanceDataScoped(),true);
  const winrate={};api.els.performanceWinrate=winrate;api.renderScopeResultSummary();
  assert.equal(winrate.textContent,'100%');
});
test('missing turn metrics do not invent zero actions or a whole game in top-deck',()=>{
  const api=analyzerHarness();
  const analytics=api.computePerformanceAnalytics([{id:'fixture',result:'win',total_turns:5,final_mine_lore:19}]);
  assert.equal(analytics.tempoSplit.win.avgQuests,null);
  assert.equal(analytics.tempoSplit.win.avgTopDeck,null);
  assert.equal(analytics.turnCurve.length,0);
});
test('stats load detailed tempo without selecting a deck, then render known starts and actions',()=>{
  const api=analyzerHarness();
  const make=(id,result)=>({id,result,format:'BO1',total_turns:5,my_decklist:[{cardId:'14-'+id,count:4}],apiRow:{queue_id:'core-bo1',ranked:true,season_name:'Core BO1 - Set 14',started_at:'2026-10-20',result}});
  api.state.currentUser={id:'owner'};api.state.savedMatchesLoaded=true;
  api.state.savedMatches=[make('1','win'),make('2','loss')];
  api.state.savedAnalytics={loading:true,loadingIds:['1','2'],loadedIds:[],games:[],cardStats:[],turnStats:[]};
  api.els.performanceOtpSplit={};api.els.performanceTempoSplit={};
  api.renderSavedStats();
  assert.equal(api.els.performanceOtpSplit.innerHTML,'Chargement…');
  api.state.cards=[{id:'14-1'}];api.state.index.set('14-1',api.state.cards[0]);
  api.state.savedAnalytics={loading:false,loadedIds:['1','2'],games:[{match_id:'1',game_number:1,is_win:true,otp:false,turn_count:5},{match_id:'2',game_number:1,is_win:false,otp:true,turn_count:5}],cardStats:[],turnStats:[{match_id:'1',game_number:1,owner:'mine',turn:1,quests:2,challenges:1,hand_count:4,ink_float:1},{match_id:'2',game_number:1,owner:'mine',turn:1,quests:1,challenges:0,hand_count:2,ink_float:0}]};
  api.renderSavedStats();
  assert.match(api.els.performanceOtpSplit.innerHTML,/Vous jouez second/);
  assert.equal(api.state.lastPerformanceAnalytics.tempoSplit.win.avgQuests,2);
  assert.equal(api.state.lastPerformanceAnalytics.tempoSplit.loss.avgTopDeck,0);
});
test('narrow saved-game projections retain metrics, opening hands and hand retention',()=>{
  const api=analyzerHarness(),row={metrics:{mine:{questCount:13}},mulligan:{visible:true,initial:[{name:'Fixture'}]},handRetention:[{cardName:'Fixture',maxHeldTurns:3}]};
  const data=api.gameJsonFromDetailRow(row);
  assert.equal(data.metrics.mine.questCount,13);
  assert.equal(data.mulligan.initial.length,1);
  assert.equal(data.handRetention[0].maxHeldTurns,3);
});
test('the original analyzer excludes undone plays and retains new inkdrop metrics',()=>{
  const api=analyzerHarness(),replay=base();
  replay.frames=[frame(1,'PLAY_CARD',[replace('/myPlayer/inkDrops',2)]),frame(2,'FREE_UNDO:1',[replace('/myPlayer/inkDrops',0)]),frame(3,'END_TURN',[replace('/currentPlayer',2)])];
  const parsed=api.parseReplay(replay,{name:'synthetic.replay',size:1});
  assert.equal(parsed.actions.filter(a=>a.type==='play').length,0);
  assert.equal(parsed.proMetrics.inkDrops.gained,0);
  assert.equal(parsed.proMetrics.inkDropTimeline.reduce((sum,row)=>sum+row.gained,0),0);
  assert.equal(JSON.stringify(api.savedMetrics(api.compactMetrics(parsed.proMetrics)).inkDropTimeline),JSON.stringify(parsed.proMetrics.inkDropTimeline));
  const catalog=JSON.parse(fs.readFileSync(new URL('../public/lorcana-set14.json',import.meta.url)));
  api.state.cards=catalog.cards;api.buildCardIndex();
  assert.equal(api.coreLegality({fullName:catalog.cards[0].fullName,setCode:'TFC'}),'legal');
});
test('imports and statistics accept both current Core formats, never older or unranked games',()=>{
  const api=analyzerHarness();
  const make=(id,raw)=>({id,format:'BO1',apiRow:{queue_id:'core-bo1',queue_name:'Core Set 14 BO1',ranked:true,season_name:'Core BO1 - Set 14',started_at:'2026-10-19T10:00:00Z',result:'win',...raw}});
  const current=make('current',{}),old=make('old',{season_name:'Core BO1 - Set 13',started_at:'2026-08-01T10:00:00Z'}),beta=make('beta',{ranked:false}),bo3=make('bo3',{queue_id:'core-bo3',queue_name:'Core BO3',match_format:'bo3'});
  bo3.format='BO3';
  api.state.savedMatches=[current,old,beta,bo3];
  assert.equal(api.scopedSavedRows().map(row=>row.id).join(','),'current,bo3');
  assert.equal(api.filteredSavedMatches('stats').map(row=>row.id).join(','),'current,bo3');
  assert.equal(api.gamePassesImportFilters(old),false);
  api.state.statScope={era:'set-13',queue:'core-bo1'};
  assert.equal(api.gamePassesImportFilters(old),false);
  assert.equal(api.gamePassesImportFilters(current),true);
  assert.equal(api.gamePassesImportFilters(bo3),true);
  assert.equal(api.gamePassesImportFilters(beta),false);
  api.state.filterSelections.performanceFormatFilter=['BO3'];
  assert.equal(api.filteredSavedMatches('stats').map(row=>row.id).join(','),'bo3');
  // A view filter must never restrict the sync to that format.
  assert.equal(api.gamePassesImportFilters(current),true);
  api.state.filterSelections.performanceFormatFilter=['BO1'];
  assert.equal(api.filteredSavedMatches('stats').map(row=>row.id).join(','),'current');
});
test('public meta uses discovered era, stable fields, daily caching and conditional responses',async t=>{
  const original=globalThis.fetch;let calls=0;
  t.after(()=>{globalThis.fetch=original;});
  globalThis.fetch=async(url,options)=>{
    calls++;assert.equal(new Headers(options.headers).has('Authorization'),false);
    if(calls===2)assert.equal(new URL(url).searchParams.get('era'),'set-14-core');
    return new Response(JSON.stringify({meta:{queueId:'core-bo1',period:'opaque-season',selectedEraKey:'set-14-core',eras:{currentEra:{key:'set-14-core',name:'Set 14'}},queues:{active:[{id:'core-bo1',name:'Core',format:'CoreConstructed',ranked:true,internal:'hidden'}]},profiles:[{name:'must-not-leak'}]},activity:{totalGames:100,internal:'hidden'},colorPairs:[{colors:['ruby','amethyst'],games:30,wins:15,winRate:50,internal:'hidden'}],matchups:[],updatedAt:'2026-10-20T00:00:00Z',internal:'hidden'}),{headers:{ETag:'"upstream"'}});
  };
  const res=()=>({headers:{},setHeader(key,value){this.headers[key.toLowerCase()]=value;},end(body){this.body=body;}});
  const first=res();await metaHandler({method:'GET',query:{queue:'core-bo1'},headers:{}},first);
  assert.equal(first.statusCode,200);assert.equal(calls,2);assert.equal(first.body.includes('hidden'),false);assert.equal(first.body.includes('must-not-leak'),false);
  const second=res();await metaHandler({method:'GET',query:{queue:'core-bo1'},headers:{'if-none-match':first.headers.etag}},second);
  assert.equal(second.statusCode,304);assert.equal(calls,2);assert(first.headers['cache-control'].includes('s-maxage=86400'));
  const invalid=res();await metaHandler({method:'GET',query:{queue:'https://evil.example'},headers:{}},invalid);assert.equal(invalid.statusCode,400);assert.equal(calls,2);
});
test('community archives cannot reuse another queue or current-era cache entry',async t=>{
  const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});let calls=0;
  globalThis.fetch=async(url)=>{
    calls++;const params=new URL(url).searchParams,queue=params.get('queue'),era=params.get('era')||'set-14-core';
    return Response.json({meta:{queueId:queue,selectedEraKey:era,eras:{currentEra:{key:'set-14-core'},pastEras:[{key:'set-13-core'}]}},activity:{totalGames:10},colorPairs:[],matchups:[]});
  };
  const res=()=>({setHeader(){},end(body){this.body=body;}});
  const archive=res();await metaHandler({method:'GET',query:{queue:'core-bo3',era:'set-13'},headers:{}},archive);
  assert.equal(archive.statusCode,200);assert.equal(JSON.parse(archive.body).meta.selectedEraKey,'set-13-core');
  const current=res();await metaHandler({method:'GET',query:{queue:'core-bo3'},headers:{}},current);
  assert.equal(JSON.parse(current.body).meta.selectedEraKey,'set-14-core');assert.equal(calls,4);
  const missing=res();await metaHandler({method:'GET',query:{queue:'core-bo3',era:'set-99'},headers:{}},missing);assert.equal(missing.statusCode,404);
});
