import { applyReplayPatch, validateReplayJson } from '../security/replay.js';

// Evidence-only reconstruction from Duels' perspective-limited snapshots.
// Deliberately excludes opponent hand, private deck order and speculative identities.
const clone = value => JSON.parse(JSON.stringify(value));
const finite = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
const count = value => Array.isArray(value) ? value.length : null;
const card = value => ({
  id: typeof value?.id === 'string' ? value.id : typeof value?.cardId === 'string' ? value.cardId : typeof value?.card?.id === 'string' ? value.card.id : null,
  instanceId: typeof value?.instanceId === 'string' ? value.instanceId : null,
  name: typeof value?.fullName === 'string' ? value.fullName : typeof value?.name === 'string' ? value.name : 'Carte non identifiée',
  cost: finite(value?.cost),
  lore: finite(value?.lore),
  strength: finite(value?.strength),
  willpower: finite(value?.willpower),
  damage: finite(value?.damage),
  exerted: value?.exerted === true,
  type: typeof value?.type === 'string' ? value.type : null
});
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
    field: cards(p.field),
    items: cards(p.items),
    discard: cards(p.discard)
  };
  if(own) data.hand = cards(p.hand);
  return data;
};
const ACTIONS = new Set(['ADD_TO_INK','PLAY_CARD','QUEST','CHALLENGE','ATTACK','END_TURN','MOVE_TO_LOCATION','ACTIVATE_ABILITY','RESPOND_TO_PROMPT','BOOST']);
export function reconstructReplayTimeline(replay) {
  validateReplayJson(replay);
  const snapshot = clone(replay.baseSnapshot);
  const perspective = Number(replay.perspective ?? snapshot.viewingAs ?? 1);
  if (![1, 2].includes(perspective)) throw new Error('Perspective du replay invalide.');
  const frames = replay.frames.map((frame, index) => ({ frame, index }))
    .sort((a, b) => Number(a.frame.seq ?? a.index) - Number(b.frame.seq ?? b.index) || a.index - b.index);
  const undoneSeqs = new Set(frames
    .filter(({frame}) => /^FREE_UNDO:\d+$/.test(frame.actionType || ''))
    .map(({frame}) => Number(frame.actionType.split(':')[1])));
  const state = (kind, frame = null) => ({
    kind,
    seq: frame?.seq ?? null,
    actionType: frame?.actionType ?? null,
    actor: Number(frame?.player) === perspective ? 'mine' : [1, 2].includes(Number(frame?.player)) ? 'opponent' : null,
    isDecision: ACTIONS.has(frame?.actionType),
    undone: frame !== null && undoneSeqs.has(Number(frame.seq)),
    isUndo: !!frame && /^FREE_UNDO:\d+$/.test(frame.actionType || ''),
    turnNumber: Number.isInteger(snapshot.turnNumber) ? snapshot.turnNumber : null,
    currentPlayer: [1, 2].includes(Number(snapshot.currentPlayer)) ? Number(snapshot.currentPlayer) : null,
    status: typeof snapshot.status === 'string' ? snapshot.status : null,
    mine: visible(snapshot.myPlayer, true),
    opponent: visible(snapshot.opponent, false),
    evidence: 'replay-pov',
    ...(frame ? {patchCount: frame.patch.length} : {})
  });
  const steps = [state('initial')];
  for (const {frame} of frames) {
    for (const patch of frame.patch) applyReplayPatch(snapshot, patch);
    steps.push(state('frame', frame));
  }
  return { perspective, steps, frameCount: frames.length, complete: true, undoneSeqs: [...undoneSeqs] };
}
