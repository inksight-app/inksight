import { applyReplayPatch, validateReplayJson } from '../security/replay.js';

// Reconstruct only the perspective that was recorded; never infer private opponent zones.
const clone = value => JSON.parse(JSON.stringify(value));
const finite = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
const count = value => Array.isArray(value) ? value.length : null;
const text = (value, max=180) => typeof value === 'string' ? value.slice(0, max) : null;
const safeCardArt = value => {
  if (typeof value !== 'string' || value.length > 350) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'cards.duels.ink'
      && url.pathname.startsWith('/lorcana/') && /\.(webp|png|jpe?g)$/i.test(url.pathname) ? url.href : null;
  } catch { return null; }
};

const card = value => {
  const raw = value?.card && typeof value.card === 'object' ? value.card : value;
  return {
    id: text(raw?.id || raw?.cardId || raw?.card_id || raw?.fullId),
    instanceId: text(value?.instanceId || raw?.instanceId || value?.cardInstanceId),
    name: text(raw?.fullName || raw?.cardName || [raw?.name,raw?.title || raw?.version].filter(Boolean).join(' - '), 120) || 'Carte non identifiée',
    image: safeCardArt(raw?.imageUrl || raw?.image),
    imageSmall: safeCardArt(raw?.imageSmallUrl || raw?.imageSmall),
    cost: finite(raw?.cost), lore: finite(raw?.lore),
    strength: finite(raw?.strength), willpower: finite(raw?.willpower),
    damage: finite(value?.damage ?? raw?.damage),
    exerted: (value?.exerted ?? raw?.exerted) === true,
    justPlayed: (value?.justPlayed ?? raw?.justPlayed) === true,
    type: text(raw?.type, 40),
    cardsUnderCount: count(value?.cardsUnder ?? raw?.cardsUnder)
  };
};
const cards = zone => Array.isArray(zone) ? zone.map(card) : null;
const visible = (zone, own) => {
  const p = zone || {};
  const ink = Array.isArray(p.inkwell) ? p.inkwell : null;
  const data = {
    lore: finite(p.lore),
    handCount: count(p.hand) ?? (Number.isInteger(p.handCount) ? p.handCount : null),
    fieldCount: count(p.field),
    inkwellCount: count(ink),
    readyInkCount: ink ? ink.filter(entry => entry?.exerted === false).length : null,
    inkDrops: finite(p.inkDrops),
    deckCount: finite(p.deckCount),
    field: cards(p.field), items: cards(p.items), discard: cards(p.discard)
  };
  if (own) data.hand = cards(p.hand);
  return data;
};

// Duels' takenAction sometimes includes private ink identities even for opponents.
// This is an explicit public-only whitelist, not a copy of the raw action.
function publicAction(frame, perspective) {
  if (!frame || !frame.takenAction || typeof frame.takenAction !== 'object') return null;
  const a=frame.takenAction, kind=frame.actionType;
  const mine=Number(frame.player)===perspective;
  const publicCard=() => ({cardId:text(a.cardId),cardName:text(a.cardName,120),cardInstanceId:text(a.cardInstanceId)});
  if(kind==='QUEST') return {...publicCard(),loreGained:finite(a.loreGained)};
  if(kind==='ATTACK'||kind==='CHALLENGE') return {
    attackerInstanceId:text(a.attackerInstanceId),attackerName:text(a.attackerName,120),
    defenderInstanceId:text(a.defenderInstanceId),defenderName:text(a.defenderName,120),
    damageToAttacker:finite(a.damageToAttacker),damageToDefender:finite(a.damageToDefender),
    attackerBanished:a.attackerBanished===true,defenderBanished:a.defenderBanished===true
  };
  if(kind==='PLAY_CARD') return {...publicCard(),cardType:text(a.cardType,40),source:text(a.source,30)};
  if(kind==='ACTIVATE_ABILITY') return {...publicCard(),abilityName:text(a.abilityName,100)};
  if(kind==='ADD_TO_INK') return mine ? {...publicCard(),source:text(a.source,30)} : {hidden:true};
  return null;
}
const ACTIONS = new Set(['ADD_TO_INK','PLAY_CARD','QUEST','CHALLENGE','ATTACK','END_TURN','MOVE_TO_LOCATION','ACTIVATE_ABILITY','RESPOND_TO_PROMPT','BOOST','MULLIGAN','CONCEDE','GAME_FINISH']);
export function reconstructReplayTimeline(replay) {
  validateReplayJson(replay);
  const snapshot = clone(replay.baseSnapshot);
  const perspective = Number(replay.perspective ?? snapshot.viewingAs ?? 1);
  if (![1, 2].includes(perspective)) throw new Error('Perspective du replay invalide.');
  const frames = replay.frames.map((frame,index) => ({frame,index}))
    .sort((a,b) => Number(a.frame.seq ?? a.index) - Number(b.frame.seq ?? b.index) || a.index - b.index);
  const undoneSeqs = new Set(frames.filter(({frame}) => /^FREE_UNDO:\d+$/.test(frame.actionType || ''))
    .map(({frame}) => Number(frame.actionType.split(':')[1])));
  const state = (kind, frame=null) => ({
    kind, seq:frame?.seq ?? null, actionType:frame?.actionType ?? null,
    actor:Number(frame?.player) === perspective ? 'mine' : [1,2].includes(Number(frame?.player)) ? 'opponent' : null,
    action:publicAction(frame,perspective),
    isDecision:ACTIONS.has(frame?.actionType),
    undone:frame !== null && undoneSeqs.has(Number(frame.seq)),
    isUndo:!!frame && /^FREE_UNDO:\d+$/.test(frame.actionType || ''),
    turnNumber:Number.isInteger(snapshot.turnNumber) ? snapshot.turnNumber : null,
    currentPlayer:[1,2].includes(Number(snapshot.currentPlayer)) ? Number(snapshot.currentPlayer) : null,
    status:typeof snapshot.status === 'string' ? snapshot.status : null,
    mine:visible(snapshot.myPlayer,true),
    opponent:visible(snapshot.opponent,false),
    evidence:'replay-pov', ...(frame ? {patchCount:frame.patch.length} : {})
  });
  const steps=[state('initial')];
  for(const {frame} of frames) {
    for(const patch of frame.patch) applyReplayPatch(snapshot,patch);
    steps.push(state('frame',frame));
  }
  return {
    perspective, playerNames:{
      mine:text(replay.playerNames?.[perspective] || replay.playerNames?.[String(perspective)],70) || 'Moi',
      opponent:text(replay.playerNames?.[perspective===1?2:1] || replay.playerNames?.[String(perspective===1?2:1)],70) || 'Adversaire'
    },
    steps, frameCount:frames.length, complete:true, undoneSeqs:[...undoneSeqs]
  };
}
