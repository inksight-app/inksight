import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { SessionBoundary } from '../src/security/session.js';
import { CORE_SET_NUMBERS, isCurrentCoreGame } from '../src/lorcana/format.js';
import { replayCancellations, analyzeInkDrops, combineInkDrops } from '../src/lorcana/resources.js';
import { applyReplayPatch } from '../src/security/replay.js';
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
  const context=vm.createContext({document:{addEventListener(){},querySelectorAll(){return[];},querySelector(){return null;},getElementById(){return null;}},window:{},Chart:{},JSZip:{},pako:{},SessionBoundary,CORE_SET_NUMBERS,isCurrentCoreGame,analyzeInkDrops,combineInkDrops,replayCancellations,applyReplayPatch,structuredClone,console,setTimeout,clearTimeout,TextDecoder,URL,Map,Set,Date});
  vm.runInContext(text.slice(0,end)+'\n globalThis.testApi={parseReplay,state,buildCardIndex,cardSetNumbers,coreLegality};\n})();',context);
  return context.testApi;
}
test('the original analyzer excludes undone plays and retains new inkdrop metrics',()=>{
  const api=analyzerHarness(),replay=base();
  replay.frames=[frame(1,'PLAY_CARD',[replace('/myPlayer/inkDrops',2)]),frame(2,'FREE_UNDO:1',[replace('/myPlayer/inkDrops',0)]),frame(3,'END_TURN',[replace('/currentPlayer',2)])];
  const parsed=api.parseReplay(replay,{name:'synthetic.replay',size:1});
  assert.equal(parsed.actions.filter(a=>a.type==='play').length,0);
  assert.equal(parsed.proMetrics.inkDrops.gained,0);
  const catalog=JSON.parse(fs.readFileSync(new URL('../public/lorcana-set14.json',import.meta.url)));
  api.state.cards=catalog.cards;api.buildCardIndex();
  assert.equal(api.coreLegality({fullName:catalog.cards[0].fullName,setCode:'TFC'}),'legal');
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
