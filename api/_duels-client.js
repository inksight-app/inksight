import { fetchBounded, HttpError, retryAfterSeconds } from './_http.js';
export async function requestDuelsJson(path, { token, method = 'GET', body, onUnauthorized } = {}) {
  const response = await fetchBounded(`https://duels.ink${path}`, {
    hosts: ['duels.ink'], method,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'User-Agent':'Inksight/1.0 (+https://inksight-omega.vercel.app)', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (response.status === 401) {
    await onUnauthorized?.();
    throw new HttpError(401, 'Connexion Duels.ink expirée, révoquée ou sans les droits requis. Reconnectez ce compte.', 'DUELS_RECONNECT');
  }
  if(response.status===403)throw new HttpError(403,'Duels.ink refuse cet accès. Vérifiez les permissions du lien ou réessayez plus tard.','DUELS_FORBIDDEN');
  if (response.status === 429) {
    const error = new HttpError(429, 'Limite Duels.ink atteinte. Patientez avant de reprendre.', 'DUELS_RATE_LIMIT');
    error.retryAfter = retryAfterSeconds(response.headers.get('retry-after')); throw error;
  }
  if (!response.ok) throw new HttpError(502, 'Duels.ink est temporairement indisponible.', 'DUELS_UNAVAILABLE');
  try { return JSON.parse(new TextDecoder().decode(response.bytes)); }
  catch { throw new HttpError(502, 'Réponse Duels.ink non exploitable.', 'DUELS_RESPONSE'); }
}
export async function expireSavedConnection(resolved) {
  if (resolved.source !== 'saved' || !resolved.client || !resolved.user) return;
  if(!resolved.connection?.encrypted_token?.iv)return;
  await resolved.client.from('duelink_connections').update({ expires_at: new Date().toISOString() }).eq('user_id', resolved.user.id).eq('provider', 'duelink').eq('encrypted_token->>iv',resolved.connection.encrypted_token.iv);
}
