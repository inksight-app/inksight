import { resolveDuelinkToken } from './_duelink-token-store.js';
import { fetchBounded, HttpError, jsonError, readJsonBody, retryAfterSeconds } from './_http.js';
import { expireSavedConnection } from './_duels-client.js';
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); throw new HttpError(405, 'Méthode non autorisée.'); }
    const body = await readJsonBody(req), resolved = await resolveDuelinkToken(req, body);
    if (typeof body.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(body.id)) throw new HttpError(400, 'Identifiant de replay invalide.');
    const response = await fetchBounded('https://duels.ink/r/' + encodeURIComponent(body.id), { hosts: ['duels.ink','cdn.duels.ink'], maximum: 48 * 1024 * 1024, timeout: 20000, headers: { Authorization: 'Bearer ' + resolved.token, Accept: 'application/octet-stream, application/gzip' } });
    if ([401,403].includes(response.status)) { await expireSavedConnection(resolved); throw new HttpError(401, 'Reconnectez votre compte Duels.ink.', 'DUELS_RECONNECT'); }
    if (response.status === 429) { const e = new HttpError(429, 'Limite de téléchargement Duels.ink atteinte.'); e.retryAfter = retryAfterSeconds(response.headers.get('retry-after')); throw e; }
    if (!response.ok) throw new HttpError(502, 'Replay non disponible sur Duels.ink.');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', 'attachment; filename="' + body.id + '.replay.gz"');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(Buffer.from(response.bytes));
  } catch (error) { return jsonError(res, error); }
}
