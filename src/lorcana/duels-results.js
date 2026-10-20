import { isCurrentCoreRow } from './seasons.js';

// Documented history fields only. Never retain uncontracted opponent information.
const FIELDS=['game_id','match_id','match_format','match_game_number','mode','queue_id','queue_name','ranked','season_id','season_name','started_at','ended_at','duration_seconds','turns','result','end_reason','your_player','went_first','your_lore','opp_lore','mmr_before','mmr_after','mmr_delta','is_placement','placement_number','your_user_id','your_deck_id','your_deck_colors','your_decklist','opp_display_name','opp_guest','opp_is_bot','opp_deck_colors','opp_mmr_before','replay_id','replay_filename','replay_url','gamelog_id','gamelog_filename','gamelog_url'];
export function nativeHistoryRow(value){
  if(!value || typeof value!=='object' || Array.isArray(value))return null;
  if(typeof value.game_id!=='string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value.game_id))return null;
  if(!isCurrentCoreRow({apiRow:value}))return null;
  if(value.mode!=='matchmaking' || value.ranked!==true || !['core-bo1','core-bo3'].includes(value.queue_id)
    || typeof value.your_user_id!=='string' || !value.your_user_id || value.your_user_id.length>128
    || !Number.isFinite(Date.parse(value.started_at || ''))
    || !Object.hasOwn(value,'result') || ![null,'win','loss','draw','abandoned'].includes(value.result))return null;
  const clean=Object.fromEntries(FIELDS.filter(key=>Object.hasOwn(value,key)).map(key=>[key,value[key]]));
  if(clean.your_decklist!=null && !Array.isArray(clean.your_decklist))return null;
  for(const [key,v] of Object.entries(clean)){
    if(key==='your_decklist')continue;
    if(v!==null && (!['string','number','boolean'].includes(typeof v) || (typeof v==='string' && v.length>4096) || (typeof v==='number' && !Number.isFinite(v))))return null;
  }
  if(Array.isArray(clean.your_decklist)){
    if(clean.your_decklist.length>500)return null;
    clean.your_decklist=clean.your_decklist.map(card=>({cardId:String(card?.cardId || card?.card_id || card?.id || ''),count:Number(card?.count ?? card?.quantity ?? card?.qty ?? 1)}));
    if(clean.your_decklist.some(card=>!card.cardId || card.cardId.length>200 || !Number.isSafeInteger(card.count) || card.count<1 || card.count>999))return null;
  }
  if(JSON.stringify(clean).length>100000)return null;
  return clean;
}
const number=value=>typeof value==='number' && Number.isFinite(value)?value:null;
const colors=value=>typeof value==='string'?value.toLowerCase().split('/').map(x=>x.trim()).filter(x=>['amber','amethyst','emerald','ruby','sapphire','steel'].includes(x)):[];
const labels={win:'Victoire',loss:'Défaite',draw:'Nul',abandoned:'Abandonnée'};
export function resultAsSavedRow(record,profiles=[]){
  const r=record.native || {},format=r.queue_id==='core-bo3'?'BO3':'BO1';
  const result=['win','loss','draw','abandoned'].includes(r.result)?r.result:null;
  const profile=profiles.find(p=>String(p.external_deck_id || '')===String(r.your_deck_id || '') && r.your_deck_id);
  const mineColors=colors(r.your_deck_colors);
  const opponentColors=colors(r.opp_deck_colors);
  const mine=number(r.your_lore),opponent=number(r.opp_lore),score=mine===null || opponent===null?'—':mine+'-'+opponent;
  return {
    id:'metadata:'+record.game_id,user_id:record.user_id,_metadataOnly:true,team_visible:false,
    created_at:record.created_at,updated_at:record.ingested_at || record.created_at,
    played_at:r.started_at || null,title:format+' · '+(labels[result] || 'Résultat inconnu')+' · '+score,
    format,result,wins:result==='win'?1:0,losses:result==='loss'?1:0,score_label:score,
    mine_colors:mineColors,opponent_colors:opponentColors,opponent_name:r.opp_display_name || '',
    matchup_label:mineColors.join(' / ')+' vs '+opponentColors.join(' / '),
    deck_profile_id:profile?.id || null,deck_name:profile?.name || null,
    source_type:'duelink_metadata',duelink_match_id:record.game_id,series_match_id:r.match_id || null,
    queue_id:r.queue_id,duelink_queue:r.queue_id,duelink_source:r.mode,duelink_updated_at:record.source_updated_at || null,
    went_first:typeof r.went_first==='boolean'?r.went_first:null,
    total_turns:number(r.turns),avg_turns:number(r.turns),final_mine_lore:mine,final_opp_lore:opponent,
    my_decklist:r.your_decklist || null,data_quality:'partial',quality_issues:{replay_pending:true},
    api_metadata:{duelink_game_id:record.game_id,duelink_replay_id:r.replay_id || null,my_decklist:r.your_decklist || null,api_row:{raw:r}}
  };
}
export function mergeDuelinkResults(analyses=[],records=[],profiles=[]){
  const pending=new Map(records.filter(row=>!row.hidden_at).map(row=>[row.game_id,resultAsSavedRow(row,profiles)]));
  const rows=analyses.map(row=>{
    const native=pending.get(row.duelink_match_id);
    if(!native)return row;
    pending.delete(row.duelink_match_id);
    // Native results are authoritative; annotations and replay analysis are retained.
    const fields=['result','wins','losses','format','score_label','played_at','went_first','series_match_id','queue_id','duelink_updated_at'];
    const patch=Object.fromEntries(fields.map(key=>[key,native[key]]));
    // Lightweight history has projected context_* fields; refresh those too.
    const raw=native.api_metadata.api_row.raw;
    for(const key of ['queue_id','queue_name','ranked','mode','season_id','season_name','started_at','result','match_id','match_game_number','match_format'])patch['context_'+key]=raw[key]??null;
    patch.context_deck_list=raw.your_decklist ?? null;
    patch.context_deck_hash=null;
    return {...row,...patch,api_metadata:{...(row.api_metadata || {}),...native.api_metadata}};
  });
  return [...rows,...pending.values()].sort((a,b)=>Date.parse(b.played_at || b.created_at || 0)-Date.parse(a.played_at || a.created_at || 0));
}
export function gameFromResultRow(row){
  const r=row.api_metadata?.api_row?.raw || {};
  return {id:row.duelink_match_id,replayId:r.replay_id || null,startedAt:r.started_at,updatedAt:row.duelink_updated_at || r.ended_at,source:r.mode,queue:r.queue_id,format:r.match_format || row.format,opponent:r.opp_display_name,result:r.result,myDecklist:r.your_decklist || null,apiRow:r};
}
export function nativeMmrDelta(row){
  const r=row.api_metadata?.api_row?.raw;
  return r?.is_placement===true?null:number(r?.mmr_delta);
}
