import { resolveDuelinkToken } from './_duelink-token-store.js';
import { fetchBounded, HttpError, jsonError, readJsonBody, retryAfterSeconds } from './_http.js';
import { expireSavedConnection, requestDuelsJson } from './_duels-client.js';
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); throw new HttpError(405, 'Méthode non autorisée.'); }
    const body = await readJsonBody(req), resolved = await resolveDuelinkToken(req, body);
    if (typeof body.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(body.id)) throw new HttpError(400, 'Identifiant de replay invalide.');
    // Resolve an owner-authorized manifest first. OAuth cannot authenticate /r/;
    // its public URL remains valid when it is the URL returned by that manifest.
    const manifest=await requestDuelsJson('/api/me/bulk-replays',{token:resolved.token,method:'POST',body:{ids:[body.id]},onUnauthorized:()=>expireSavedConnection(resolved)});
    const file=Array.isArray(manifest?.files)?manifest.files.find(file=>file.id===body.id):null;
    let download;try{download=new URL(file?.url);}catch{throw new HttpError(404,'Replay indisponible pour ce compte.','REPLAY_MISSING');}
    if(download.protocol!=='https:' || !['duels.ink','cdn.duels.ink'].includes(download.hostname) || download.username || download.password || download.port)
      throw new HttpError(502,'Adresse de replay Duels.ink non reconnue.');
    const response = await fetchBounded(download.href, { hosts: ['duels.ink','cdn.duels.ink'], maximum: 48 * 1024 * 1024, timeout: 20000, headers: { ...(download.hostname==='duels.ink'?{Authorization:'Bearer '+resolved.token}:{}), Accept: 'application/octet-stream, application/gzip', 'User-Agent':'Inksight/1.0 (+https://inksight-omega.vercel.app)' } });
    if (response.status===401) { await expireSavedConnection(resolved); throw new HttpError(401, 'Reconnectez votre compte Duels.ink.', 'DUELS_RECONNECT'); }
    if(response.status===403)throw new HttpError(403,'Duels.ink refuse le téléchargement de ce replay.','DUELS_FORBIDDEN');
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
