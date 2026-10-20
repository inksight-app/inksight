import { CURRENT_SET, CURRENT_ERA_START } from './format.js';

export const DEFAULT_STAT_SCOPE = Object.freeze({ era:'current', queue:'core-bo1' });
export const DEFAULT_ERAS = [
  {key:'set-14-core',chapter:14,name:'Set 14',startedAt:CURRENT_ERA_START,endedAt:null},
  {key:'set-13',chapter:13,name:'Set 13',startedAt:'2026-07-16T01:42:00.000Z',endedAt:CURRENT_ERA_START},
  {key:'set-12',chapter:12,name:'Set 12',startedAt:'2026-05-07T23:18:07.574Z',endedAt:'2026-07-16T01:42:00.000Z'},
  {key:'set-11',chapter:11,name:'Set 11',startedAt:'2026-02-12T00:00:00.000Z',endedAt:'2026-05-07T23:18:07.574Z'},
];
const chapterIn=value=>{
  const match=/(?:set|chapter|chapitre)[\s_-]*0*(\d+)\b/i.exec(String(value || ''));
  return match ? Number(match[1]) : null;
};
const boolean=value=>value===true||value==='true'?true:value===false||value==='false'?false:null;
export function eraCatalog(meta){
  const items=[meta?.currentEra,...(meta?.pastEras || [])].filter(Boolean).map(era=>({...era,chapter:chapterIn(era.key)||chapterIn(era.name)})).filter(era=>era.chapter && Number.isFinite(Date.parse(era.startedAt)));
  return items.length ? items.sort((a,b)=>b.chapter-a.chapter) : DEFAULT_ERAS;
}
export function contextFields(row={}){
  const metadata=row.api_metadata || row.analysis_json?.api_metadata || {};
  const stored=metadata.api_row || {};
  const raw=row.apiRow || stored.raw || stored.apiRow || stored;
  const pick=(name,fallback)=>row['context_'+name] ?? raw[name] ?? fallback ?? null;
  return {
    queueId:pick('queue_id',row.queue_id),
    queueName:pick('queue_name',row.queue || row.duelink_queue || metadata.duelink_queue),
    ranked:boolean(pick('ranked')),
    mode:pick('mode',row.source_mode || row.source || row.duelink_source),
    seasonName:pick('season_name',row.season_name),
    seasonId:pick('season_id',row.season_id),
    startedAt:pick('started_at',row.startedAt),
    result:Object.hasOwn(row,'context_result') && (row.context_queue_id || row.duelink_match_id) ? row.context_result : Object.hasOwn(raw,'result') ? raw.result : row.result ?? null,
    matchId:pick('match_id',row.series_match_id),
    gameNumber:pick('match_game_number'),
    format:pick('match_format',row.format),
  };
}
export function classifyGameContext(row={},eras=DEFAULT_ERAS){
  const fields=contextFields(row);
  const q=[fields.queueId,fields.queueName].filter(Boolean).join(' ').toLowerCase().replace(/[_-]+/g,' ');
  const mode=String(fields.mode || '').toLowerCase();
  const isOther=fields.ranked===false || /private|bot/.test(mode) || /quick|beta|sealed|draft|pack rush|infinity|japanese|日本語|\bja\b/.test(q);
  const formatText=String(fields.format || '').toLowerCase();
  const bo3=/bo\s*3|best.of.3/.test(formatText+' '+q),bo1=/bo\s*1|best.of.1/.test(formatText+' '+q);
  const canonical=String(fields.queueId || '').toLowerCase();
  let queue='unknown';
  if(!isOther && (fields.ranked===true || ['core-bo1','core-bo3'].includes(canonical)) && /\bcore\b/.test(q)){
    queue=bo3?'core-bo3':bo1?'core-bo1':'unknown';
    if((canonical==='core-bo1' && bo3)||(canonical==='core-bo3' && !bo3)) queue='unknown';
    if(bo1 && bo3)queue='unknown';
  }else if(isOther) queue='other';
  // A versioned queue ID is immutable; its display name is not.
  const queueChapter=chapterIn(fields.queueId);
  const explicit=chapterIn(fields.seasonName) || queueChapter;
  const started=Date.parse(fields.startedAt || '');
  const dateEra=Number.isFinite(started) ? eras.find(era=>started>=Date.parse(era.startedAt) && (!era.endedAt || started<Date.parse(era.endedAt))) : null;
  let chapter=null,confidence='unknown';
  if(explicit){
    if(dateEra && explicit!==dateEra.chapter) confidence='conflict';
    else {chapter=explicit;confidence=chapterIn(fields.seasonName)?'season':'queue-version';}
  }else if(dateEra){chapter=dateEra.chapter;confidence='date';}
  else if(!Number.isFinite(started) && fields.seasonId){chapter=null;}
  // Mutable queue labels and deck tags never determine the chapter on their own.
  return {...fields,queue,chapter,era:chapter?'set-'+chapter:'unknown',confidence};
}
export function normalizedScope(scope={}){
  const era=scope.era || 'current',queue=scope.queue || 'core-bo1';
  return {era:/^(current|all|unknown|set-\d+)$/.test(era)?era:'current',queue:['core-bo1','core-bo3','all'].includes(queue)?queue:'core-bo1'};
}
export function rowMatchesScope(row,scope=DEFAULT_STAT_SCOPE,eras=DEFAULT_ERAS){
  const selected=normalizedScope(scope),context=classifyGameContext(row,eras);
  if(selected.queue!=='all' && context.queue!==selected.queue) return false;
  if(selected.era==='all') return true;
  if(selected.era==='unknown') return context.era==='unknown';
  const wanted=selected.era==='current'?'set-'+(eras[0]?.chapter || CURRENT_SET):selected.era;
  return context.era===wanted;
}
export function resultSummary(rows=[]){
  const games={wins:0,losses:0,draws:0,unknown:0,n:0,rate:null},series=new Map(),ids=new Set();
  let unidentifiedSeries=0,index=0;
  for(const row of rows){
    const fields=contextFields(row),id=row.duelink_match_id || row.id || (fields.matchId && fields.gameNumber!=null?fields.matchId+'::'+fields.gameNumber:'row:'+index);
    index++;
    if(ids.has(id)) continue;ids.add(id);
    const outcome=String(fields.result || '').toLowerCase();
    const isBo3=/bo3|best.of.3/i.test(fields.format || '') || classifyGameContext(row).queue==='core-bo3';
    if(!['win','loss','draw'].includes(outcome)){
      games.unknown++;
      if(isBo3){
        if(fields.matchId){const current=series.get(fields.matchId)||{wins:0,losses:0};current.incomplete=true;series.set(fields.matchId,current);}
        else unidentifiedSeries++;
      }
      continue;
    }
    // A manual multi-game ZIP is one stored row, not one played game.
    const manualBo3=/bo3/i.test(row.format || '') && !row.duelink_match_id && Number(row.wins)+Number(row.losses)>1;
    const wins=manualBo3?Number(row.wins):Number(outcome==='win');
    const losses=manualBo3?Number(row.losses):Number(outcome==='loss');
    const draws=manualBo3?0:Number(outcome==='draw');
    games.wins+=wins;games.losses+=losses;games.draws+=draws;
    if(isBo3 || manualBo3){
      const key=fields.matchId || (manualBo3?'manual:'+row.id:null);
      if(!key){unidentifiedSeries++;continue;}
      const current=series.get(key)||{wins:0,losses:0};
      current.wins+=wins;current.losses+=losses;series.set(key,current);
    }
  }
  games.n=games.wins+games.losses+games.draws;games.rate=games.n?games.wins/games.n*100:null;
  const matches={wins:0,losses:0,unconfirmed:unidentifiedSeries,n:0,rate:null};
  for(const seriesResult of series.values()){
    if(seriesResult.incomplete)matches.unconfirmed++;
    else if(seriesResult.wins===2 && seriesResult.losses<2)matches.wins++;
    else if(seriesResult.losses===2 && seriesResult.wins<2)matches.losses++;
    else matches.unconfirmed++;
  }
  matches.n=matches.wins+matches.losses;matches.rate=matches.n?matches.wins/matches.n*100:null;
  return {games,matches};
}
export function scopeEraStart(scope=DEFAULT_STAT_SCOPE,eras=DEFAULT_ERAS){
  const selected=normalizedScope(scope);
  if(selected.era==='all'||selected.era==='unknown')return null;
  const chapter=selected.era==='current'?eras[0]?.chapter:Number(selected.era.slice(4));
  return eras.find(era=>era.chapter===chapter)?.startedAt || null;
}

export function deckListIdentity(list){
  if(!Array.isArray(list) || !list.length || list.length>500)return null;
  const counts=new Map();
  for(const entry of list){
    const id=String(entry?.cardId || entry?.card_id || entry?.id || '').trim();
    const count=Number(entry?.count ?? entry?.quantity ?? entry?.qty ?? entry?.copies ?? 1);
    if(!id || id.length>200 || !Number.isSafeInteger(count) || count<1 || count>999)return null;
    counts.set(id,(counts.get(id)||0)+count);
  }
  // Exact recorded list, including counts; no collision-prone short hash.
  return 'list-v1:'+JSON.stringify([...counts].sort(([a],[b])=>a<b?-1:a>b?1:0));
}

export function coherentDeckList(rows=[]){
  const hashes=rows.map(row=>{
    const metadata=row.api_metadata || row.analysis_json?.api_metadata;
    const list=row.context_deck_list || row.my_decklist || metadata?.my_decklist || metadata?.api_row?.raw?.your_decklist;
    if(list!=null)return deckListIdentity(list);
    return row.context_deck_hash || metadata?.my_deck_hash || null;
  });
  return hashes.length>0 && hashes.every(hash=>typeof hash==='string' && hash.length>0 && hash===hashes[0]);
}
