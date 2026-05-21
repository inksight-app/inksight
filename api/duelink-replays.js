import { resolveDuelinkToken } from './_duelink-token-store.js';

const DUELINK_BASE_URL = 'https://duels.ink';

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
      if (raw.length > 1024 * 1024) {
        reject(new Error('Requête trop volumineuse.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try { resolve(JSON.parse(raw)); }
      catch { reject(new Error('JSON invalide.')); }
    });
    req.on('error', reject);
  });
}

function cleanToken(value) {
  return String(value || '').trim().replace(/^Bearer\s+/i, '');
}

function cleanIds(ids) {
  return [...new Set((Array.isArray(ids) ? ids : [])
    .map(id => String(id || '').trim())
    .filter(Boolean))].slice(0, 1000);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { success: false, error: 'Méthode non autorisée.' });
  }

  try {
    const body = await readJsonBody(req);
    const resolved = await resolveDuelinkToken(req, body);
    const token = resolved.token;
    const ids = cleanIds(body.ids);

    if (!ids.length) return json(res, 400, { success: false, error: 'Aucun replay id à importer.' });

    const response = await fetch(`${DUELINK_BASE_URL}/api/me/bulk-replays`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    const text = await response.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }

    if (!response.ok) {
      const message = payload?.error || payload?.message || `Duel.ink a répondu ${response.status}.`;
      return json(res, response.status === 401 || response.status === 403 ? 401 : 502, {
        success: false,
        status: response.status,
        error: message,
      });
    }

    const files = Array.isArray(payload?.files) ? payload.files : [];
    const missing = Array.isArray(payload?.missing) ? payload.missing : [];
    return json(res, 200, {
      success: true,
      files: files.map(file => ({
        id: file.id || file.replay_id || file.replayId || '',
        filename: file.filename || file.name || `${file.id || 'duelink'}.replay.gz`,
        url: file.url || '',
      })).filter(file => file.id && file.url),
      missing,
    });
  } catch (error) {
    return json(res, 500, { success: false, error: error?.message || 'Erreur inconnue pendant la récupération des replays Duel.ink.' });
  }
}
