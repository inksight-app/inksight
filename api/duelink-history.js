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

function safeLimit(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 5;
  return Math.max(1, Math.min(25, parsed));
}

function pickDate(row) {
  return row?.updatedAt || row?.updated_at || row?.playedAt || row?.played_at || row?.createdAt || row?.created_at || null;
}

function summarizeGame(row) {
  const id = row?.id || row?.game_id || row?.gameId || row?.game?.id || null;
  const replayId = row?.replay_id || row?.replayId || row?.replay?.id || row?.replay?.replay_id || null;
  const source = row?.source || row?.game_source || row?.gameSource || row?.queue_source || null;
  const queue = row?.queue || row?.queue_id || row?.queueId || row?.queueName || row?.queue_name || null;
  const opponent = row?.opponentName || row?.opponent_name || row?.opponent?.name || row?.opponentDisplayName || row?.opponent_display_name || null;
  const result = row?.result || row?.outcome || row?.isWin || row?.is_win || null;
  return { id, replayId, source, queue, opponent, result, updatedAt: pickDate(row) };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { success: false, error: 'Méthode non autorisée.' });
  }

  try {
    const body = await readJsonBody(req);
    const token = cleanToken(body.token);
    const limit = safeLimit(body.limit);

    if (!token) {
      return json(res, 400, { success: false, error: 'Token Duel.ink manquant.' });
    }

    const url = new URL('/api/me/match-history', DUELINK_BASE_URL);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
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

    const games = Array.isArray(payload?.games) ? payload.games : (Array.isArray(payload) ? payload : []);
    const summaries = games.slice(0, limit).map(summarizeGame);

    return json(res, 200, {
      success: true,
      count: games.length,
      next_cursor: payload?.next_cursor || payload?.nextCursor || null,
      games: summaries,
      sample: games.slice(0, Math.min(3, games.length)),
    });
  } catch (error) {
    return json(res, 500, {
      success: false,
      error: error?.message || 'Erreur inconnue pendant le test Duel.ink.',
    });
  }
}
