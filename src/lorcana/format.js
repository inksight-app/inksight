// Verified against Duels.ink's public era metadata and Ravensburger's rotation notice.
export const CURRENT_SET = 14;
export const CORE_START_SET = 9;
export const CURRENT_ERA_START = '2026-10-08T22:37:09.766Z';
export const CORE_SET_NUMBERS = new Set(['9','10','11','12','13','14']);

/** Queue display names can be renamed retroactively: never relabel a July game Set 14. */
export function isCurrentCoreGame(game, eraStart=CURRENT_ERA_START){
  const raw=game?.apiRow || {};
  const queue=[game?.queue,game?.format,game?.queue_id,raw.queue,raw.queue_name,raw.format].filter(Boolean).join(' ').toLowerCase();
  if(!queue.includes('core') || queue.includes('infinity') || /\bja\b|japanese|日本語/.test(queue)) return false;
  const set=/set[\s_-]*(\d+)\b/.exec(queue);
  if(set && Number(set[1]) !== CURRENT_SET) return false;
  const played=Date.parse(game?.startedAt || raw.started_at || raw.created_at || game?.updatedAt || '');
  return Number.isFinite(played) && played >= Date.parse(eraStart);
}
