import { Inflate } from 'pako';

export const MAX_REPLAY_BYTES = 48 * 1024 * 1024;
export const MAX_REPLAY_FILES = 20;
const forbidden = new Set(['__proto__', 'constructor', 'prototype']);
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const clone = value => value === undefined ? value : JSON.parse(JSON.stringify(value));

function pointer(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.length > 4096) throw new Error('Chemin de replay invalide.');
  const parts = path.slice(1).split('/').map(p => p.replace(/~1/g, '/').replace(/~0/g, '~'));
  if (parts.length > 40 || parts.some(p => forbidden.has(p))) throw new Error('Chemin de replay non autorisé.');
  return parts;
}
function locate(root, parts) {
  let parent = root;
  for (const key of parts) {
    if (!parent || typeof parent !== 'object' || !own(parent, key)) throw new Error('Le replay contient un chemin absent.');
    parent = parent[key];
  }
  return parent;
}
/** Duels omits undefined object leaves before replacing/removing them. Only those leaves are tolerant. */
export function applyReplayPatch(root, patch) {
  if (!patch || typeof patch !== 'object') throw new Error('Patch de replay invalide.');
  const parts = pointer(patch.path);
  if (patch.op === 'test') {
    if (JSON.stringify(locate(root, parts)) !== JSON.stringify(patch.value)) throw new Error('Contrôle du replay non satisfait.');
    return;
  }
  if (patch.op === 'copy' || patch.op === 'move') {
    const from = pointer(patch.from);
    if (patch.op === 'move' && parts.length > from.length && from.every((p, i) => parts[i] === p)) throw new Error('Déplacement de replay invalide.');
    const value = clone(locate(root, from));
    if (patch.op === 'move') applyReplayPatch(root, { op: 'remove', path: patch.from });
    applyReplayPatch(root, { op: 'add', path: patch.path, value }); return;
  }
  if (!['add', 'replace', 'remove'].includes(patch.op)) throw new Error('Opération de replay non prise en charge.');
  const parent = locate(root, parts.slice(0, -1)), key = parts.at(-1);
  if (!parent || typeof parent !== 'object') throw new Error('Structure de replay invalide.');
  if (Array.isArray(parent)) {
    const add = patch.op === 'add';
    if (!(add && key === '-') && !/^(0|[1-9]\d*)$/.test(key)) throw new Error('Index de replay invalide.');
    const index = key === '-' ? parent.length : Number(key);
    if (!Number.isSafeInteger(index) || index >= parent.length + Number(add)) throw new Error('Index de replay absent.');
    if (add) parent.splice(index, 0, clone(patch.value));
    else if (patch.op === 'remove') parent.splice(index, 1);
    else parent[index] = clone(patch.value);
  } else if (patch.op === 'remove') delete parent[key];
  else parent[key] = clone(patch.value);
}

export function validateReplayJson(value) {
  const stack = [[value, 0]]; let nodes = 0;
  while (stack.length) {
    const [item, depth] = stack.pop();
    if (++nodes > 600000 || depth > 80) throw new Error('Replay trop complexe.');
    if (!item || typeof item !== 'object') continue;
    for (const key of Object.keys(item)) {
      if (forbidden.has(key)) throw new Error('Le fichier contient une propriété non autorisée.');
      stack.push([item[key], depth + 1]);
    }
  }
  if (!value || value.format !== 'duels-replay-v1' || !value.baseSnapshot || !Array.isArray(value.frames) || value.frames.length > 15000) throw new Error('Format de replay non pris en charge.');
  for (const frame of value.frames) {
    if (!Array.isArray(frame.patch) || frame.patch.length > 10000) throw new Error('Étape de replay invalide.');
    for (const patch of frame.patch) { pointer(patch.path); if (patch.from !== undefined) pointer(patch.from); }
  }
  return value;
}

export function decodeReplayBytes(input, budget = { remaining: MAX_REPLAY_BYTES }) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.length > MAX_REPLAY_BYTES) throw new Error('Fichier trop volumineux (48 Mo maximum).');
  let decoded = bytes;
  if (bytes[0] === 31 && bytes[1] === 139) {
    const chunks = []; let total = 0;
    const inflate = new Inflate({ chunkSize: 65536 });
    inflate.onData = chunk => {
      total += chunk.length;
      if (total > Math.min(MAX_REPLAY_BYTES, budget.remaining)) throw new Error('Replay ou archive décompressée trop volumineuse (48 Mo maximum).');
      chunks.push(chunk);
    };
    inflate.push(bytes, true);
    if (inflate.err) throw new Error('Fichier gzip invalide.');
    decoded = new Uint8Array(total); let offset = 0;
    for (const chunk of chunks) { decoded.set(chunk, offset); offset += chunk.length; }
  }
  if (decoded.length > budget.remaining) throw new Error('Archive décompressée trop volumineuse.');
  budget.remaining -= decoded.length;
  let value;
  try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(decoded)); }
  catch { throw new Error('Le replay ne contient pas de JSON UTF-8 valide.'); }
  return validateReplayJson(value);
}

export function readZipEntry(entry, limit = MAX_REPLAY_BYTES) {
  if (Number(entry._data?.uncompressedSize) > limit) throw new Error('Entrée ZIP trop volumineuse.');
  return new Promise((resolve, reject) => {
    const chunks = []; let total = 0, failed = false;
    const stream = entry.internalStream('uint8array');
    stream.on('data', chunk => {
      if (failed) return;
      total += chunk.length;
      if (total > limit) { failed = true; stream.pause(); reject(new Error('Archive décompressée trop volumineuse.')); return; }
      chunks.push(chunk);
    });
    stream.on('error', reject);
    stream.on('end', () => {
      if (failed) return;
      const result = new Uint8Array(total); let offset = 0;
      for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
      resolve(result.buffer);
    });
    stream.resume();
  });
}
