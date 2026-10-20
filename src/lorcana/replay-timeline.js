import { applyReplayPatch, validateReplayJson } from '../security/replay.js';

// Phase 1: evidence-only replay states. No card identity inference or strategic scores.
const clone = value => JSON.parse(JSON.stringify(value));
const visible = (zone, key) => {
  const p = zone || {};
  return {
    lore: Number.isFinite(p.lore) ? p.lore : null,
    handCount: Array.isArray(p.hand) ? p.hand.length : Number.isInteger(p.handCount) ? p.handCount : null,
    fieldCount: Array.isArray(p.field) ? p.field.length : null,
    inkwellCount: Array.isArray(p.inkwell) ? p.inkwell.length : null,
    inkDrops: Number.isFinite(p.inkDrops) ? p.inkDrops : null,
    // Preserve only IDs actually present in the viewer's snapshot.
    fieldInstanceIds: Array.isArray(p.field) ? p.field.map(c => c?.instanceId ?? null) : null
  };
};
export function reconstructReplayTimeline(replay) {
  validateReplayJson(replay);
  const snapshot = clone(replay.baseSnapshot);
  const perspective = Number(replay.perspective ?? snapshot.viewingAs ?? 1);
  if (![1, 2].includes(perspective)) throw new Error('Perspective du replay invalide.');
  const frames = replay.frames.map((frame, index) => ({ frame, index }))
    .sort((a, b) => Number(a.frame.seq ?? a.index) - Number(b.frame.seq ?? b.index) || a.index - b.index);
  const undoneSeqs = new Set(frames.filter(({frame}) => /^FREE_UNDO:\\d+$/.test(frame.actionType || '')).map(({frame}) => Number(frame.actionType.split(':')[1])));
  const state = (kind, frame = null) => ({
    kind, seq: frame?.seq ?? null, actionType: frame?.actionType ?? null,
    undone: frame ? undoneSeqs.has(Number(frame.seq)) : false,
    turnNumber: Number.isInteger(snapshot.turnNumber) ? snapshot.turnNumber : null,
    currentPlayer: [1, 2].includes(Number(snapshot.currentPlayer)) ? Number(snapshot.currentPlayer) : null,
    mine: visible(snapshot.myPlayer),
    opponent: visible(snapshot.opponent),
    // A snapshot is evidence from the replay POV, not a full-information game state.
    evidence: 'replay-pov',
    ...(frame ? { patchCount: frame.patch.length } : {})
  });
  const steps = [state('initial')];
  for (const { frame } of frames) {
    for (const patch of frame.patch) applyReplayPatch(snapshot, patch);
    steps.push(state('frame', frame));
  }
  return { perspective, steps, frameCount: frames.length, complete: true, undoneSeqs: [...undoneSeqs] };
}
