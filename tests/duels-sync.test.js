import test from 'node:test';
import assert from 'node:assert/strict';
import { syncResultsPage } from '../api/duelink-sync.js';
import { startSyncState,decodeSyncState } from '../api/_duelink-sync-state.js';
import { CURRENT_ERA_START } from '../src/lorcana/format.js';

const now=Date.parse('2026-10-20T12:00:00Z');
const row={game_id:'fixture-game',your_user_id:'duels-owner',mode:'matchmaking',queue_id:'core-bo3',match_format:'bo3',ranked:true,started_at:'2026-10-19T12:00:00Z',result:'draw',your_decklist:null,replay_id:null};
function setup(t){
  const previous=process.env.DUELINK_TOKEN_SECRET;process.env.DUELINK_TOKEN_SECRET='fixture-only-signing-secret-over-32-characters';
  t.after(()=>{if(previous===undefined)delete process.env.DUELINK_TOKEN_SECRET;else process.env.DUELINK_TOKEN_SECRET=previous;});
  const writes=[];
  const resolved={user:{id:'owner'},token:'fixture-token',source:'saved',connection:{encrypted_token:{iv:'fixture-iv'},duels_user_id:'duels-owner',last_sync_at:'2026-10-19T11:00:00Z',results_sync_version:0},client:{rpc:async(name,args)=>{writes.push({name,args});return {data:args.p_rows.length,error:null};}}};
  return {resolved,writes};
}
test('first sync rebuilds the current-era result index; subsequent windows overlap only recent updates',t=>{
  const {resolved}=setup(t);assert.equal(startSyncState(resolved,now).from,CURRENT_ERA_START);
  resolved.connection.results_sync_version=1;
  assert.equal(startSyncState(resolved,now).from,'2026-10-19T10:55:00.000Z');
  resolved.source='request';assert.equal(startSyncState(resolved,now).from,CURRENT_ERA_START);
});
test('results without a replay are durable before returning an opaque continuation; checkpoint only on final page',async t=>{
  const {resolved,writes}=setup(t);let queries=[];
  const first=await syncResultsPage(resolved,null,async path=>{queries.push(new URL('https://duels.ink'+path));return {games:[row],next_cursor:'opaque|cursor +suffix'};},now);
  assert.equal(first.complete,false);assert.equal(first.saved,1);assert.equal(writes[0].args.p_checkpoint,null);
  assert.equal(writes[0].args.p_rows[0].native.result,'draw');assert.equal(writes[0].args.p_rows[0].native.replay_id,null);
  assert.equal(queries[0].searchParams.get('queue'),'core-bo1,core-bo3');assert.equal(queries[0].searchParams.get('source'),'matchmaking');
  const last=await syncResultsPage(resolved,first.continuation,async path=>{queries.push(new URL('https://duels.ink'+path));return {games:[],next_cursor:null};},now+1000);
  assert.equal(last.complete,true);assert.equal(last.continuation,null);
  assert.equal(queries[1].searchParams.get('cursor'),'opaque|cursor +suffix');assert.equal(queries[1].searchParams.get('to'),queries[0].searchParams.get('to'));
  assert.equal(writes[1].args.p_checkpoint,new Date(now).toISOString());assert.equal(writes[1].args.p_connection_iv,'fixture-iv');
});
test('continuations reject tampering, other accounts, token replacement and expiry before any provider call',async t=>{
  const {resolved}=setup(t);
  const first=await syncResultsPage(resolved,null,async()=>({games:[],next_cursor:'cursor'}),now);
  assert.throws(()=>decodeSyncState(first.continuation.slice(0,-1)+'!',resolved,now),e=>e.code==='SYNC_INVALID');
  assert.throws(()=>decodeSyncState(first.continuation,{...resolved,user:{id:'other'}},now),e=>e.code==='SYNC_INVALID');
  assert.throws(()=>decodeSyncState(first.continuation,{...resolved,token:'replacement'},now),e=>e.code==='SYNC_INVALID');
  assert.throws(()=>decodeSyncState(first.continuation,resolved,now+7*3600000),e=>e.code==='SYNC_INVALID');
});
test('malformed or oversized pages, cursor cycles and another account row never reach storage',async t=>{
  const {resolved,writes}=setup(t);
  for(const payload of [{games:[]},{games:Array(251).fill(row),next_cursor:null},{games:[{...row,your_decklist:{}}],next_cursor:null},{games:[{...row,your_user_id:'other'}],next_cursor:null}]){
    await assert.rejects(syncResultsPage(resolved,null,async()=>payload,now));
  }
  assert.equal(writes.length,0);
  const first=await syncResultsPage(resolved,null,async()=>({games:[],next_cursor:'cycle'}),now);
  await assert.rejects(syncResultsPage(resolved,first.continuation,async()=>({games:[row],next_cursor:'cycle'}),now+1000),e=>e.code==='SYNC_PAGINATION');
  assert.equal(writes.length,1);
});
test('save failures and rate limits do not report success or offer an advanced cursor',async t=>{
  const {resolved,writes}=setup(t);
  resolved.client.rpc=async()=>({error:{message:'fixture-save-failure'}});
  await assert.rejects(syncResultsPage(resolved,null,async()=>({games:[row],next_cursor:null}),now),e=>e.code==='SYNC_SAVE_FAILED');
  await assert.rejects(syncResultsPage(resolved,null,async()=>{throw Object.assign(new Error('limited'),{status:429,retryAfter:37});},now),e=>e.status===429);
  assert.equal(writes.length,0);
});
test('late changes to old games are excluded, and pasted keys never advance a stored connection checkpoint',async t=>{
  const {resolved,writes}=setup(t);resolved.source='request';
  const result=await syncResultsPage(resolved,null,async()=>({games:[{...row,started_at:'2026-08-01T00:00:00Z'},row],next_cursor:null}),now);
  assert.equal(result.count,1);assert.equal(writes[0].args.p_connection_iv,null);
});
