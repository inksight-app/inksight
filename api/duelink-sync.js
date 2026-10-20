import { resolveDuelinkToken } from './_duelink-token-store.js';
import { requestDuelsJson, expireSavedConnection } from './_duels-client.js';
import { HttpError, json, jsonError, readJsonBody, softRateLimit } from './_http.js';
import { startSyncState, encodeSyncState, decodeSyncState, advanceSyncState } from './_duelink-sync-state.js';
import { nativeHistoryRow } from '../src/lorcana/duels-results.js';
import { isCurrentCoreRow } from '../src/lorcana/seasons.js';

export async function syncResultsPage(resolved, continuation, request = requestDuelsJson, now = Date.now()) {
  const state=continuation?decodeSyncState(continuation,resolved,now):startSyncState(resolved,now);
  const query=new URLSearchParams({format:'json',limit:'250',source:'matchmaking',queue:'core-bo1,core-bo3',from:state.from,to:state.to});
  if(state.cursor)query.set('cursor',state.cursor);
  const payload=await request('/api/me/match-history?'+query,{token:resolved.token,onUnauthorized:()=>expireSavedConnection(resolved)});
  if(!payload || !Array.isArray(payload.games) || payload.games.length>250 || !Object.hasOwn(payload,'next_cursor'))
    throw new HttpError(502,'Historique Duels.ink incomplet ou non reconnu.','SYNC_RESPONSE');
  const next=advanceSyncState(state,payload.next_cursor);
  const rows=[];
  for(const raw of payload.games){
    if(!raw || typeof raw!=='object' || Array.isArray(raw))throw new HttpError(502,'Partie Duels.ink non reconnue.','SYNC_RESPONSE');
    // Old/other formats can be updated recently: do not import them, but keep paginating.
    if(!isCurrentCoreRow({apiRow:raw}))continue;
    const native=nativeHistoryRow(raw);
    if(!native || Date.parse(native.started_at)>Date.parse(state.to) || (resolved.connection?.duels_user_id && native.your_user_id!==resolved.connection.duels_user_id))
      throw new HttpError(502,'Données Duels.ink non reconnues pour ce compte.','SYNC_RESPONSE');
    // The API exposes an updated-at cursor, not a per-row updated_at field.
    // Version observations by the fixed scan boundary; older scans cannot overwrite newer ones.
    rows.push({game_id:native.game_id,native,started_at:native.started_at,source_updated_at:state.to});
  }
  const {data,error}=await resolved.client.rpc('ingest_duelink_results',{
    p_rows:rows,p_checkpoint:next?null:state.to,
    p_connection_iv:resolved.source==='saved'?resolved.connection?.encrypted_token?.iv || null:null
  });
  if(error)throw new HttpError(503,'Résultats non sauvegardés. Relancez la synchronisation.','SYNC_SAVE_FAILED');
  return {success:true,count:rows.length,saved:Number(data)||0,complete:!next,continuation:next?encodeSyncState(next):null};
}

export default async function handler(req,res){
  try{
    if(req.method!=='POST'){res.setHeader('Allow','POST');throw new HttpError(405,'Méthode non autorisée.');}
    const body=await readJsonBody(req),resolved=await resolveDuelinkToken(req,body);
    softRateLimit('duels-results:'+resolved.user.id,{maximum:20});
    return json(res,200,await syncResultsPage(resolved,body.continuation));
  }catch(error){return jsonError(res,error);}
}
