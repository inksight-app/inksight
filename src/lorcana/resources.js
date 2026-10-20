import { applyReplayPatch } from '../security/replay.js';

export function replayCancellations(frames){
  const ordered=[...frames].sort((a,b)=>a.seq-b.seq), seen=new Set(), ranges=[];
  for(const frame of ordered){
    if(!Number.isSafeInteger(frame.seq) || seen.has(frame.seq)) throw new Error('Séquence de replay invalide.');
    const undo=/^FREE_UNDO:(\d+)$/.exec(String(frame.actionType || ''));
    if(undo){
      const target=Number(undo[1]);
      if(!seen.has(target) || target>=frame.seq) throw new Error('Retour en arrière sans origine vérifiable.');
      if(ranges.some(range=>range.undo>=target)) throw new Error('Ce retour en arrière imbriqué nécessite une analyse spécifique.');
      ranges.push({from:target,to:frame.seq,undo:frame.seq});
    }else if(/UNDO|REWIND/.test(String(frame.actionType || ''))) throw new Error('Format de retour en arrière non pris en charge.');
    seen.add(frame.seq);
  }
  const cancelled=new Set();
  let cursor=0;
  for(const frame of ordered){
    while(cursor<ranges.length && frame.seq>=ranges[cursor].to) cursor++;
    if(cursor<ranges.length && frame.seq>=ranges[cursor].from) cancelled.add(frame.seq);
  }
  return cancelled;
}
function stock(zone){
  const value=zone?.inkDrops ?? 0; // Duels omits zeroes in its JSON serializer.
  if(!Number.isSafeInteger(value) || value<0) throw new Error('Stock d’inkdrops invalide.');
  return value;
}
export function analyzeInkDrops(replay){
  const frames=[...(replay.frames || [])].sort((a,b)=>a.seq-b.seq);
  const cancelled=replayCancellations(frames), snapshot=structuredClone(replay.baseSnapshot);
  const result={};
  for(const [owner,zone] of [['mine','myPlayer'],['opponent','opponent']]) result[owner]={start:stock(snapshot[zone]),gained:0,removed:0,paid:0,unattributed:0,end:stock(snapshot[zone])};
  for(const frame of frames){
    const before={mine:stock(snapshot.myPlayer),opponent:stock(snapshot.opponent)};
    for(const patch of frame.patch || []) applyReplayPatch(snapshot,patch);
    if(cancelled.has(frame.seq) || String(frame.actionType).startsWith('FREE_UNDO:')) continue;
    for(const [owner,zone] of [['mine','myPlayer'],['opponent','opponent']]){
      const after=stock(snapshot[zone]), delta=after-before[owner], entry=result[owner];
      entry.gained+=Math.max(0,delta);
      const removed=Math.max(0,-delta);
      entry.removed+=removed;
      const actor=Number(frame.player ?? frame.takenAction?.player ?? snapshot.currentPlayer);
      const actorOwner=actor===Number(replay.perspective || replay.baseSnapshot.viewingAs || 1)?'mine':actor===1||actor===2?'opponent':null;
      const declared=frame.takenAction?.inkDropsToSpend;
      const paid=actorOwner===owner && Number.isSafeInteger(declared) && declared>=0 ? Math.min(declared,removed) : 0;
      entry.paid+=paid; entry.unattributed+=removed-paid; entry.end=after;
    }
  }
  // Final stock is an observed state, never inferred from payment counters.
  result.mine.end=stock(snapshot.myPlayer); result.opponent.end=stock(snapshot.opponent);
  return result;
}
export function combineInkDrops(metrics){
  if(!metrics.length || metrics.some(m=>!m.inkDrops)) return null;
  return Object.fromEntries(['start','gained','removed','paid','unattributed','end'].map(key=>[key,metrics.reduce((sum,m)=>sum+m.inkDrops[key],0)]));
}
