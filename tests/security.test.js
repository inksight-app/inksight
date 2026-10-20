import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { gzip } from 'pako';
import JSZip from 'jszip';
import { applyReplayPatch, decodeReplayBytes, readZipEntry } from '../src/security/replay.js';
import { readJsonBody, checkOrigin, fetchBounded, jsonError, HttpError, readResponseBytes } from '../api/_http.js';
import { encryptToken, decryptToken, resolveDuelinkToken } from '../api/_duelink-token-store.js';
import { requestDuelsJson } from '../api/_duels-client.js';
import imageHandler from '../api/img-proxy.js';
import historyHandler from '../api/duelink-history.js';

function response(){return {headers:{},statusCode:0,setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(body){this.body=body;}};}
function mockFetch(t,fn){const old=globalThis.fetch;globalThis.fetch=fn;t.after(()=>{globalThis.fetch=old;});}
const raw=()=>({format:'duels-replay-v1',gameId:'fixture',perspective:1,baseSnapshot:{myPlayer:{inkwell:[],hand:[]},opponent:{inkwell:[]}},frames:[{seq:1,patch:[{op:'replace',path:'/optional',value:1}]}]});

test('malicious pointers cannot modify global prototypes',()=>{
  for(const path of ['/__proto__/audit','/constructor/prototype/audit','/x/prototype/audit']) assert.throws(()=>applyReplayPatch({}, {op:'add',path,value:true}));
  assert.equal({}.audit,undefined);
  const state={list:['A','C']};applyReplayPatch(state,{op:'add',path:'/list/1',value:'B'});assert.deepEqual(state.list,['A','B','C']);
  applyReplayPatch(state,{op:'replace',path:'/optional',value:2});assert.equal(state.optional,2);
  assert.throws(()=>applyReplayPatch(state,{op:'replace',path:'/list/10',value:'X'}));
  assert.throws(()=>applyReplayPatch(state,{op:'replace',path:'/missing/child',value:'X'}));
  assert.throws(()=>applyReplayPatch(state,{op:'unsafe',path:'/optional'}));
});
test('gzip and ZIP readers bound decoded data and preserve a valid replay',async()=>{
  const bytes=new TextEncoder().encode(JSON.stringify(raw())),gz=gzip(bytes);
  assert.equal(decodeReplayBytes(gz).gameId,'fixture');
  assert.throws(()=>decodeReplayBytes(gz,{remaining:16}));
  const bad=raw();bad.frames[0].patch[0].path='/__proto__/audit';assert.throws(()=>decodeReplayBytes(new TextEncoder().encode(JSON.stringify(bad))));
  const zip=new JSZip();zip.file('game.replay',bytes);const restored=await JSZip.loadAsync(await zip.generateAsync({type:'uint8array'}));
  assert.throws(()=>readZipEntry(restored.file('game.replay'),16));
  assert.equal(decodeReplayBytes(await readZipEntry(restored.file('game.replay'))).gameId,'fixture');
});
test('pre-parsed Vercel bodies work, oversized/incorrect bodies fail',async()=>{
  const req={headers:{'content-type':'application/json'},body:{ids:['one']}};
  assert.deepEqual(await readJsonBody(req),{ids:['one']});
  await assert.rejects(readJsonBody({...req,body:{text:'x'.repeat(500)},headers:req.headers},100),e=>e.status===413);
  await assert.rejects(readJsonBody({...req,headers:{'content-type':'text/plain'}}),e=>e.status===415);
  const stream=Readable.from(['{"cursor":','"opaque|next"}']);stream.headers=req.headers;
  assert.equal((await readJsonBody(stream)).cursor,'opaque|next');
});
test('a forged Host does not grant cross-origin access',()=>{
  assert.throws(()=>checkOrigin({headers:{origin:'https://evil.example',host:'evil.example'}}),e=>e.status===403);
  assert.doesNotThrow(()=>checkOrigin({headers:{origin:'https://inksight-omega.vercel.app'}}));
});
test('redirects are restricted and bearer tokens are stripped before CDN access',async t=>{
  let calls=0;
  mockFetch(t,async(url,options)=>{calls++;if(calls===1)return new Response(null,{status:302,headers:{Location:'https://cdn.duels.ink/replay.gz'}});assert.equal(new Headers(options.headers).get('Authorization'),null);return new Response(new Uint8Array([1,2,3]));});
  const result=await fetchBounded('https://duels.ink/r/public',{hosts:['duels.ink','cdn.duels.ink'],headers:{Authorization:'Bearer secret'}});
  assert.equal(result.bytes.length,3);assert.equal(calls,2);
});
test('redirects to internal/arbitrary hosts and huge streams fail closed',async t=>{
  mockFetch(t,async()=>new Response(null,{status:302,headers:{Location:'http://127.0.0.1/internal'}}));
  await assert.rejects(fetchBounded('https://cards.duels.ink/image',{hosts:['cards.duels.ink']}),e=>e.code==='HOST_DENIED');
  await assert.rejects(readResponseBytes(new Response(new Uint8Array(12)),8),e=>e.code==='UPSTREAM_TOO_LARGE');
});
test('HTML and SVG cannot be served as same-origin images',async t=>{
  mockFetch(t,async()=>new Response('<svg onload="alert(1)"/>',{headers:{'Content-Type':'image/svg+xml'}}));
  const res=response();await imageHandler({method:'GET',headers:{},query:{url:'https://cards.duels.ink/payload.svg'}},res);assert.equal(res.statusCode,502);assert.equal(res.headers['x-content-type-options'],'nosniff');
});
test('all Duels routes require a verified Inksight session, even for a pasted token',async t=>{
  mockFetch(t,async()=>{throw new Error('must not be reached');});
  await assert.rejects(resolveDuelinkToken({headers:{}},{token:'personal-token'}),e=>e.status===401);
});
test('token ciphertext is bound to the owner, while legacy v1 remains readable',t=>{
  const previous=process.env.DUELINK_TOKEN_SECRET;process.env.DUELINK_TOKEN_SECRET='local-test-only-32-characters-long-secret';t.after(()=>{if(previous===undefined)delete process.env.DUELINK_TOKEN_SECRET;else process.env.DUELINK_TOKEN_SECRET=previous;});
  const sealed=encryptToken('private-token','owner-a');assert.equal(decryptToken(sealed,'owner-a'),'private-token');assert.throws(()=>decryptToken(sealed,'owner-b'));assert.equal(decryptToken(encryptToken('legacy')),'legacy');
});
test('private errors never disclose internal messages',()=>{
  const res=response();jsonError(res,new Error('SECRET_SENTINEL'));assert.equal(res.statusCode,500);assert.ok(!res.body.includes('SECRET_SENTINEL'));assert.equal(res.headers['cache-control'],'no-store');
});
test('401 breaks the link once, 429 exposes Retry-After without automatic retries',async t=>{
  let calls=0,expired=0;mockFetch(t,async()=>{calls++;return new Response('{}',{status:401});});
  await assert.rejects(requestDuelsJson('/api/me',{token:'t',onUnauthorized:()=>{expired++;}}),e=>e.code==='DUELS_RECONNECT');assert.equal(calls,1);assert.equal(expired,1);
  globalThis.fetch=async()=>new Response('{}',{status:429,headers:{'Retry-After':'37'}});
  await assert.rejects(requestDuelsJson('/api/me',{token:'t'}),e=>e.retryAfter===37);
});
test('history uses a 250-row page and preserves opaque cursors',async t=>{
  mockFetch(t,async(url,options)=>{
    const u=new URL(url);
    if(u.hostname.endsWith('.supabase.co'))return Response.json({id:'owner',aud:'authenticated',app_metadata:{},user_metadata:{}});
    assert.equal(u.searchParams.get('limit'),'250');assert.equal(u.searchParams.get('cursor'),'opaque|cursor + suffix');
    return Response.json({games:[],next_cursor:'still-more'});
  });
  const res=response();await historyHandler({method:'POST',headers:{authorization:'Bearer test.jwt.token','content-type':'application/json'},body:{token:'duels-token',limit:1000,cursor:'opaque|cursor + suffix'}},res);
  assert.equal(res.statusCode,200);assert.equal(JSON.parse(res.body).next_cursor,'still-more');
});
test('stored tokens use the stable profile id, provider expiry and read-only scopes',async t=>{
  const old=process.env.DUELINK_TOKEN_SECRET;process.env.DUELINK_TOKEN_SECRET='test-only-encryption-secret-long-enough';t.after(()=>{if(old===undefined)delete process.env.DUELINK_TOKEN_SECRET;else process.env.DUELINK_TOKEN_SECRET=old;});
  const expiry=new Date(Date.now()+86400000).toISOString();let stored;
  mockFetch(t,async(url,options)=>{
    const target=new URL(url);
    if(target.pathname==='/auth/v1/user')return Response.json({id:'owner-a',aud:'authenticated',app_metadata:{},user_metadata:{}});
    if(target.hostname==='duels.ink')return Response.json({id:'stable-duels-id',name:'Mutable display name',token:{expiresAt:expiry,clientId:'dapp_fixture',scopes:['profile','match_history:read','replays:read']}});
    stored=JSON.parse(options.body);return Response.json({token_hint:stored.token_hint,expires_at:stored.expires_at,duels_user_id:stored.duels_user_id,auth_method:stored.auth_method,scopes:stored.scopes});
  });
  const {default:tokenHandler}=await import('../api/duelink-token.js');const res=response();
  await tokenHandler({method:'POST',headers:{authorization:'Bearer fixture.jwt.token','content-type':'application/json'},body:{token:'private-fixture-token'}},res);
  assert.equal(res.statusCode,200);assert.equal(stored.user_id,'owner-a');assert.equal(stored.duels_user_id,'stable-duels-id');assert.equal(stored.expires_at,expiry);assert.equal(stored.auth_method,'oauth');
  assert.equal(decryptToken(stored.encrypted_token,'owner-a'),'private-fixture-token');assert.equal(res.body.includes('private-fixture-token'),false);
});
test('an insufficiently scoped Duels token is never stored',async t=>{
  let writes=0;mockFetch(t,async(url)=>{
    const target=new URL(url);
    if(target.pathname==='/auth/v1/user')return Response.json({id:'owner-a',aud:'authenticated',app_metadata:{},user_metadata:{}});
    if(target.hostname==='duels.ink')return Response.json({id:'stable-duels-id',token:{scopes:['profile']}});
    writes++;throw new Error('must not store');
  });
  const {default:tokenHandler}=await import('../api/duelink-token.js');const res=response();
  await tokenHandler({method:'POST',headers:{authorization:'Bearer fixture.jwt.token','content-type':'application/json'},body:{token:'private-fixture-token'}},res);
  assert.equal(res.statusCode,400);assert.equal(writes,0);
});
