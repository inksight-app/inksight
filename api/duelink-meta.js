import { createHash } from 'node:crypto';
import { fetchBounded, HttpError, jsonError } from './_http.js';
const QUEUES=new Set(['core-bo1','core-bo3','infinity-bo1','infinity-bo3','core-ja-bo1','special-ja-bo1','quick-play','quick-play-infinity']);
const cache=new Map(), DAY=86400000;
const subset=(value,keys)=>Object.fromEntries(keys.filter(key=>value?.[key]!==undefined).map(key=>[key,value[key]]));
function stablePayload(raw){
  return {
    meta:{...subset(raw.meta,['queueId','period','selectedEraKey','appliedRanks','appliedWeeks','availableWeeks','eras']),queues:{active:(raw.meta?.queues?.active || []).map(q=>subset(q,['id','name','format','gameMode','ranked']))}},
    activity:{totalGames:raw.activity?.totalGames ?? 0},
    colorPairs:(raw.colorPairs || []).map(row=>subset(row,['colors','games','wins','winRate','firstPlayerWinRate'])),
    matchups:(raw.matchups || []).map(row=>subset(row,['colorsA','colorsB','games','winsA','winRate','firstPlayerGames','firstPlayerWinRate'])),
    updatedAt:raw.updatedAt ?? null,
  };
}
async function upstream(path,headers={}){
  const result=await fetchBounded('https://duels.ink'+path,{hosts:['duels.ink'],headers:{Accept:'application/json',...headers},maximum:4*1024*1024});
  if(result.status===304) return {notModified:true};
  if(!result.ok) throw new HttpError(502,'Statistiques communautaires temporairement indisponibles.');
  let data;try{data=JSON.parse(new TextDecoder().decode(result.bytes));}catch{throw new HttpError(502,'Statistiques communautaires non exploitables.');}
  if(!data.meta || !Array.isArray(data.colorPairs) || !Array.isArray(data.matchups)) throw new HttpError(502,'Format des statistiques communautaires non reconnu.');
  return {data,etag:result.headers.get('etag')};
}
export default async function handler(req,res){
  try{
    if(req.method!=='GET'){res.setHeader('Allow','GET');throw new HttpError(405,'Méthode non autorisée.');}
    const queue=req.query?.queue || 'core-bo1';
    if(typeof queue!=='string' || !QUEUES.has(queue)) throw new HttpError(400,'File de jeu non reconnue.');
    const requestedEra=req.query?.era || 'current';
    if(typeof requestedEra!=='string' || !/^(current|set-[a-z0-9-]{1,40})$/.test(requestedEra))throw new HttpError(400,'Chapitre non reconnu.');
    const cacheKey=queue+':'+requestedEra;
    let cached=cache.get(cacheKey);
    if(!cached || Date.now()-cached.at>DAY){
      // Current era is discovered, never guessed from a mutable queue display name.
      const discovery=await upstream('/api/stats/meta?queue='+encodeURIComponent(queue)+'&period=all_time');
      const eras=discovery.data.meta?.eras;
      const options=[eras?.currentEra,...(eras?.pastEras || [])].filter(Boolean);
      const era=requestedEra==='current'?eras?.currentEra?.key:options.find(item=>item.key===requestedEra || item.key?.startsWith(requestedEra+'-'))?.key;
      if(typeof era!=='string' || !era) throw new HttpError(requestedEra==='current'?502:404,'Chapitre indisponible pour cette file.');
      const sameEra=cached?.era===era;
      const result=await upstream('/api/stats/meta?queue='+encodeURIComponent(queue)+'&era='+encodeURIComponent(era)+'&period=all_time',sameEra&&cached.upstreamEtag?{'If-None-Match':cached.upstreamEtag}:{});
      if(result.notModified){cached={...cached,at:Date.now()};}
      else{
        if(result.data.meta.queueId!==queue || result.data.meta.selectedEraKey!==era)throw new HttpError(502,'Les statistiques reçues ne correspondent pas au contexte demandé.');
        const body=JSON.stringify({success:true,...stablePayload(result.data)});
        cached={at:Date.now(),era,upstreamEtag:result.etag,body,etag:'"'+createHash('sha256').update(body).digest('hex')+'"'};
      }
      cache.set(cacheKey,cached);
    }
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Cache-Control','public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600');
    res.setHeader('ETag',cached.etag);
    if(req.headers['if-none-match']===cached.etag){res.statusCode=304;return res.end();}
    res.statusCode=200;return res.end(cached.body);
  }catch(error){return jsonError(res,error);}
}
