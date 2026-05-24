import { cleanDuelinkToken, encryptToken, getRequestUser, tokenHint } from './_duelink-token-store.js';

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1024 * 1024) { reject(new Error('Requête trop volumineuse.')); req.destroy(); }
    });
    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { reject(new Error('JSON invalide.')); }
    });
    req.on('error', reject);
  });
}

function safeDate(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export default async function handler(req, res) {
  try {
    const { client, user } = await getRequestUser(req);

    if (req.method === 'GET') {
      const { data, error } = await client
        .from('duelink_connections')
        .select('token_hint,expires_at,last_sync_at,created_at,updated_at')
        .eq('user_id', user.id)
        .eq('provider', 'duelink')
        .maybeSingle();
      if (error) throw error;
      return json(res, 200, { success: true, connected: Boolean(data), connection: data || null });
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      const token = cleanDuelinkToken(body.token);
      if (!token) return json(res, 400, { success: false, error: 'Token Duels.ink manquant.' });
      const row = {
        user_id: user.id,
        provider: 'duelink',
        encrypted_token: encryptToken(token),
        token_hint: tokenHint(token),
        expires_at: safeDate(body.expires_at),
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await client
        .from('duelink_connections')
        .upsert(row, { onConflict: 'user_id,provider' })
        .select('token_hint,expires_at,last_sync_at,created_at,updated_at')
        .single();
      if (error) throw error;
      return json(res, 200, { success: true, connected: true, connection: data });
    }

    if (req.method === 'DELETE') {
      const { error } = await client
        .from('duelink_connections')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'duelink');
      if (error) throw error;
      return json(res, 200, { success: true, connected: false });
    }

    res.setHeader('Allow', 'GET,POST,DELETE');
    return json(res, 405, { success: false, error: 'Méthode non autorisée.' });
  } catch (error) {
    const status = error?.code === 'AUTH_REQUIRED' ? 401 : (error?.code === 'CONFIG_MISSING' ? 500 : 500);
    return json(res, status, { success: false, error: error?.message || 'Erreur Duels.ink token.' });
  }
}
