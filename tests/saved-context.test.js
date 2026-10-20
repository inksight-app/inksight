import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { MATCH_CONTEXT_SELECT } from '../src/lorcana/context-select.js';
import { coherentDeckList } from '../src/lorcana/seasons.js';

test('lightweight saved rows preserve native chapter fields and recover legacy personal lists',()=>{
  const source=fs.readFileSync(new URL('../src/supabase.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
  const context=vm.createContext({createClient(){return{};},MATCH_CONTEXT_SELECT,console,URL,Map,Set,WeakSet,Date});
  vm.runInContext(source+'\n globalThis.sanitizeForTest=sanitizeSavedMatchRow;',context);
  const row={id:'fixture',context_queue_id:'core-bo1',context_season_name:'Core BO1 - Set 13',context_ranked:true,context_deck_hash:null,context_deck_list:[{cardId:'13-1',count:4}],opponent_decklist:[{cardId:'private-opponent-card',count:4}]};
  const clean=context.sanitizeForTest(row);
  assert.equal(clean.context_queue_id,'core-bo1');assert.equal(clean.context_season_name,'Core BO1 - Set 13');assert.equal(clean.context_ranked,true);
  assert.equal(JSON.stringify(clean.my_decklist),JSON.stringify(row.context_deck_list));
  assert.equal(clean.context_deck_list,undefined);assert.equal(clean.opponent_decklist,undefined);
  assert.equal(coherentDeckList([clean,{my_decklist:row.context_deck_list}]),true);
});
test('a concurrent native-game save returns the existing owner analysis without overwriting it',async()=>{
  const source=fs.readFileSync(new URL('../src/supabase.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
  let inserts=0;const predicates=[];
  const client={auth:{getUser:async()=>({data:{user:{id:'owner'}}})},from(table){
    assert.equal(table,'saved_matches');let inserting=false;
    const query={insert(){inserts++;inserting=true;return query;},select(){return query;},eq(key,value){predicates.push([key,value]);return query;},maybeSingle:async()=>({data:{id:'canonical'},error:null}),single:async()=>inserting?{data:null,error:{code:'23505'}}:{data:{id:'canonical',user_id:'owner',analysis_json:{narrative:{title:'Preserved'}}},error:null}};return query;
  }};
  const context=vm.createContext({createClient:()=>client,MATCH_CONTEXT_SELECT,console,URL,Map,Set,WeakSet,Date});
  vm.runInContext(source+'\n globalThis.saveForTest=saveMatchAnalysis;',context);
  const saved=await context.saveForTest({duelink_match_id:'game-a',analysis_json:{narrative:{title:'Do not overwrite'}}},{},'owner');
  assert.equal(saved.id,'canonical');assert.equal(saved.analysis_json.narrative.title,'Preserved');assert.equal(inserts,1);
  assert(predicates.some(([key,value])=>key==='user_id' && value==='owner'));
});
