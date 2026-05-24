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

function cleanId(value) {
  return String(value || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
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
    const id = cleanId(body.id);
    if (!id) return json(res, 400, { success: false, error: 'Replay id manquant.' });

    const response = await fetch(`${DUELINK_BASE_URL}/r/${encodeURIComponent(id)}`, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/octet-stream, application/gzip, */*',
      },
    });

    if (!response.ok) {
      const retryAfter = response.headers.get('retry-after');
      const mappedStatus = response.status === 401 || response.status === 403 ? 401 : (response.status === 429 ? 429 : 502);
      return json(res, mappedStatus, {
        success: false,
        status: response.status,
        retryAfter: retryAfter ? Number(retryAfter) || retryAfter : null,
        error: response.status === 429
          ? 'Limite Duels.ink atteinte. Réessayez dans quelques secondes.'
          : `Impossible de télécharger le replay ${id}. Duels.ink a répondu ${response.status}.`,
      });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.statusCode = 200;
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename="${id}.replay.gz"`);
    res.setHeader('Cache-Control', 'no-store');
    res.end(buffer);
  } catch (error) {
    return json(res, 500, { success: false, error: error?.message || 'Erreur inconnue pendant le téléchargement Duels.ink.' });
  }
}
