import { resolveDuelinkToken } from './_duelink-token-store.js';
import { json, readJsonBody, jsonError, HttpError, validateRemoteUrl } from './_http.js';
import { requestDuelsJson, expireSavedConnection } from './_duels-client.js';
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); throw new HttpError(405, 'Méthode non autorisée.'); }
    const body = await readJsonBody(req), resolved = await resolveDuelinkToken(req, body);
    if (!Array.isArray(body.ids) || body.ids.length > 1000 || body.ids.some(id => typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id))) throw new HttpError(400, 'Liste de replays invalide (1 000 IDs maximum).');
    const ids = [...new Set(body.ids)];
    if (!ids.length) throw new HttpError(400, 'Aucun replay à importer.');
    const payload = await requestDuelsJson('/api/me/bulk-replays', { token: resolved.token, method: 'POST', body: { ids }, onUnauthorized: () => expireSavedConnection(resolved) });
    if (!Array.isArray(payload.files) || !Array.isArray(payload.missing)) throw new HttpError(502, 'Manifeste Duels.ink invalide.');
    const files = payload.files.map(file => ({ id: file.id, filename: file.filename, url: validateRemoteUrl(file.url, ['duels.ink','cdn.duels.ink']).href })).filter(file => ids.includes(file.id));
    return json(res, 200, { success: true, files, missing: payload.missing });
  } catch (error) { return jsonError(res, error); }
}
