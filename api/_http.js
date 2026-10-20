import { createHash } from 'node:crypto';

export class HttpError extends Error {
  constructor(status, message, code = 'REQUEST_FAILED') { super(message); this.status = status; this.code = code; }
}
export function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.end(JSON.stringify(payload));
}
export function jsonError(res, error) {
  const status = error instanceof HttpError ? error.status : error?.code === 'AUTH_REQUIRED' ? 401 : 500;
  if (status === 429) res.setHeader('Retry-After', String(error.retryAfter ?? 60));
  return json(res, status, { success: false, code: error instanceof HttpError ? error.code : status === 401 ? 'AUTH_REQUIRED' : 'INTERNAL_ERROR', ...(status === 429 ? { retryAfter: error.retryAfter ?? 60 } : {}), error: error instanceof HttpError ? error.message : status === 401 ? 'Connexion Inksight requise.' : 'Service temporairement indisponible. Réessayez plus tard.' });
}
export function checkOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return;
  const origins = new Set(['https://inksight-omega.vercel.app', process.env.PUBLIC_SITE_URL]);
  for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) if (host) origins.add(`https://${host}`);
  if (process.env.NODE_ENV !== 'production') { origins.add('http://localhost:5173'); origins.add('http://127.0.0.1:5173'); }
  if (!origins.has(origin)) throw new HttpError(403, 'Origine de requête non autorisée.', 'ORIGIN_DENIED');
}
function parseBody(body, limit) {
  const raw = typeof body === 'string' ? body : Buffer.isBuffer(body) ? body.toString('utf8') : JSON.stringify(body);
  if (!raw || Buffer.byteLength(raw) > limit) throw new HttpError(413, 'Requête trop volumineuse.', 'BODY_TOO_LARGE');
  let value; try { value = JSON.parse(raw); } catch { throw new HttpError(400, 'JSON invalide.', 'INVALID_JSON'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'Objet JSON requis.', 'INVALID_JSON');
  return value;
}
export async function readJsonBody(req, limit = 128 * 1024) {
  checkOrigin(req);
  if (!String(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) throw new HttpError(415, 'Content-Type application/json requis.', 'CONTENT_TYPE');
  if (req.body !== undefined) return parseBody(req.body, limit);
  let size = 0; const chunks = [];
  for await (const chunk of req) {
    size += Buffer.byteLength(chunk);
    if (size > limit) throw new HttpError(413, 'Requête trop volumineuse.', 'BODY_TOO_LARGE');
    chunks.push(Buffer.from(chunk));
  }
  return parseBody(Buffer.concat(chunks), limit);
}
export function retryAfterSeconds(value) {
  const number = Number(value);
  if (Number.isFinite(number) && number > 0) return Math.min(86400, Math.ceil(number));
  const date = Date.parse(value ?? '');
  return Number.isFinite(date) ? Math.min(86400, Math.max(1, Math.ceil((date - Date.now()) / 1000))) : 60;
}
const buckets = new Map();
/** Per-instance soft guard. Provider quotas remain authoritative across serverless instances. */
export function softRateLimit(identity, { maximum = 60, windowMs = 60000, now = Date.now() } = {}) {
  const key = createHash('sha256').update(String(identity)).digest('hex');
  for (const [id, bucket] of buckets) if (bucket.until <= now) buckets.delete(id);
  if (buckets.size > 10000) buckets.clear();
  const bucket = buckets.get(key) ?? { count: 0, until: now + windowMs };
  if (++bucket.count > maximum) throw new HttpError(429, 'Trop de requêtes. Réessayez dans une minute.', 'RATE_LIMIT');
  buckets.set(key, bucket);
}
export async function readResponseBytes(response, maximum) {
  if (Number(response.headers.get('content-length')) > maximum) throw new HttpError(502, 'Réponse distante trop volumineuse.', 'UPSTREAM_TOO_LARGE');
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader(), chunks = []; let total = 0;
  try {
    while (true) { const { value, done } = await reader.read(); if (done) break; total += value.length; if (total > maximum) throw new HttpError(502, 'Réponse distante trop volumineuse.', 'UPSTREAM_TOO_LARGE'); chunks.push(value); }
  } finally { await reader.cancel().catch(() => {}); }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}
export function validateRemoteUrl(value, hosts) {
  let url; try { url = new URL(value); } catch { throw new HttpError(400, 'URL invalide.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !hosts.includes(url.hostname)) throw new HttpError(400, 'Hôte non autorisé.', 'HOST_DENIED');
  return url;
}
export async function fetchBounded(url, { hosts, maximum = 16 * 1024 * 1024, timeout = 15000, ...options } = {}) {
  let target = validateRemoteUrl(String(url), hosts), headers = new Headers(options.headers);
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeout);
  try {
    for (let hop = 0; hop < 4; hop++) {
      const response = await fetch(target, { ...options, headers, signal: controller.signal, redirect: 'manual' });
      if ([301,302,303,307,308].includes(response.status)) {
        const next = validateRemoteUrl(new URL(response.headers.get('location') ?? '', target).href, hosts);
        if (next.origin !== target.origin) headers.delete('Authorization');
        await response.body?.cancel(); target = next; continue;
      }
      return { status: response.status, ok: response.ok, headers: response.headers, bytes: await readResponseBytes(response, maximum) };
    }
    throw new HttpError(502, 'Trop de redirections distantes.', 'UPSTREAM_REDIRECT');
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, controller.signal.aborted ? 'Le service distant met trop de temps à répondre.' : 'Service distant indisponible.', 'UPSTREAM_UNAVAILABLE');
  } finally { clearTimeout(timer); }
}
