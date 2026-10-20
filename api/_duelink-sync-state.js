import crypto from 'node:crypto';
import { duelinkSyncMac } from './_duelink-token-store.js';
import { HttpError } from './_http.js';
import { CURRENT_ERA_START } from '../src/lorcana/format.js';

const invalid = () => new HttpError(400, 'Synchronisation expirée ou modifiée. Relancez-la.', 'SYNC_INVALID');
const hash = value => crypto.createHash('sha256').update(value).digest('base64url').slice(0,22);
export function startSyncState(resolved, now = Date.now()) {
  const last = resolved.source === 'saved' && resolved.connection?.results_sync_version === 1
    ? Date.parse(resolved.connection.last_sync_at || '') : NaN;
  return {v:1,owner:resolved.user.id,credential:duelinkSyncMac(resolved.user.id+'\0'+resolved.token),
    from:new Date(Math.max(Date.parse(CURRENT_ERA_START), Number.isFinite(last)?Math.min(last,now)-300000:0)).toISOString(),
    to:new Date(now).toISOString(),cursor:null,seen:[],page:0,expires:now+6*3600000};
}
export function encodeSyncState(state) {
  const encoded = Buffer.from(JSON.stringify(state)).toString('base64url');
  return encoded+'.'+duelinkSyncMac(encoded);
}
export function decodeSyncState(value, resolved, now = Date.now()) {
  if(typeof value!=='string' || value.length>65536) throw invalid();
  const [encoded,signature,...extra]=value.split('.');
  const expected=duelinkSyncMac(encoded || '');
  if(extra.length || !/^[A-Za-z0-9_-]+$/.test(encoded || '') || !/^[A-Za-z0-9_-]{43}$/.test(signature || '') || !crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))throw invalid();
  let s;try{s=JSON.parse(Buffer.from(encoded,'base64url').toString('utf8'));}catch{throw invalid();}
  if(s?.v!==1 || s.owner!==resolved.user.id || s.credential!==duelinkSyncMac(resolved.user.id+'\0'+resolved.token)
    || !Number.isFinite(s.expires) || s.expires<=now || s.expires>now+6*3600000
    || !Number.isInteger(s.page) || s.page<1 || s.page>=1000
    || typeof s.cursor!=='string' || !s.cursor || s.cursor.length>4096
    || !Array.isArray(s.seen) || s.seen.length!==s.page || s.seen.some(x=>typeof x!=='string'||! /^[A-Za-z0-9_-]{22}$/.test(x))
    || !Number.isFinite(Date.parse(s.from)) || Date.parse(s.from)<Date.parse(CURRENT_ERA_START)
    || !Number.isFinite(Date.parse(s.to)) || Date.parse(s.to)>now || Date.parse(s.from)>Date.parse(s.to))throw invalid();
  return s;
}
export function advanceSyncState(state, cursor) {
  if(cursor===null)return null;
  if(typeof cursor!=='string' || !cursor || cursor.length>4096 || state.page>=999 || state.seen.includes(hash(cursor)))
    throw new HttpError(502,'Pagination Duels.ink incohérente. Relancez la synchronisation.','SYNC_PAGINATION');
  return {...state,cursor,seen:[...state.seen,hash(cursor)],page:state.page+1};
}
