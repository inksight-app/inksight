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

function safeLimit(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 1000;
  return Math.max(1, Math.min(1000, parsed));
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), obj);
}

function firstValue(row, paths) {
  for (const path of paths) {
    const value = getByPath(row, path);
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return null;
}

function deepFind(row, matcher, depth = 0, seen = new Set()) {
  if (!row || typeof row !== 'object' || depth > 5 || seen.has(row)) return null;
  seen.add(row);
  if (Array.isArray(row)) {
    for (const item of row) {
      const found = deepFind(item, matcher, depth + 1, seen);
      if (found !== null && found !== undefined && String(found).trim() !== '') return found;
    }
    return null;
  }
  for (const [key, value] of Object.entries(row)) {
    if (matcher(key, value) && value !== null && value !== undefined && typeof value !== 'object' && String(value).trim() !== '') {
      return value;
    }
  }
  for (const value of Object.values(row)) {
    const found = deepFind(value, matcher, depth + 1, seen);
    if (found !== null && found !== undefined && String(found).trim() !== '') return found;
  }
  return null;
}


function dateFromUuidLike(value) {
  const text = String(value || '').trim();
  const compact = text.replace(/-/g, '');
  if (!/^[0-9a-f]{12}/i.test(compact)) return null;
  try {
    const ms = Number.parseInt(compact.slice(0, 12), 16);
    if (!Number.isFinite(ms)) return null;
    // UUIDv7 ids used by Duel.ink start with a millisecond timestamp.
    // Guard against random legacy ids by accepting only plausible recent dates.
    const min = Date.UTC(2023, 0, 1);
    const max = Date.now() + 1000 * 60 * 60 * 24 * 30;
    if (ms < min || ms > max) return null;
    return new Date(ms).toISOString();
  } catch {
    return null;
  }
}

function pickIdForDate(row) {
  return firstValue(row, [
    'id','game_id','gameId','game.id','match.id','match_id','matchId',
    'replay_id','replayId','replay.id','game.replay_id','game.replayId'
  ]) || deepFind(row, (key) => /^(?:id|game_?id|match_?id|replay_?id|replayId|gameId|matchId)$/i.test(key));
}

function pickDate(row) {
  const direct = firstValue(row, [
    'updatedAt','updated_at','playedAt','played_at','completedAt','completed_at','createdAt','created_at',
    'game.updatedAt','game.updated_at','game.completedAt','game.completed_at','game.createdAt','game.created_at',
    'match.updatedAt','match.updated_at','match.completedAt','match.completed_at'
  ]);
  if (direct) return direct;
  const nested = deepFind(row, (key) => /(?:updated|played|completed|created|finished|ended).*at$/i.test(key) || /^(?:updatedAt|playedAt|completedAt|createdAt|finishedAt|endedAt|timestamp|date)$/i.test(key));
  if (nested) return nested;
  return dateFromUuidLike(pickIdForDate(row));
}

function pickReplayId(row) {
  return firstValue(row, [
    'replay_id','replayId','replay.id','replay.replay_id','replay.replayId','replayId.id',
    'game.replay_id','game.replayId','game.replay.id','gameReplayId','replayFile.id'
  ]) || deepFind(row, (key) => /replay.*id/i.test(key));
}

function pickGameId(row) {
  return firstValue(row, ['id','game_id','gameId','game.id','match.game_id','match.gameId']) || deepFind(row, (key) => /^(?:game_?id|id)$/i.test(key));
}

function pickOpponent(row) {
  return firstValue(row, [
    'opponentName','opponent_name','opponent.name','opponent.username','opponent.displayName','opponent.display_name',
    'opponentPlayer.name','opponentPlayer.username','opponentPlayer.displayName','opponent_player.name',
    'enemy.name','enemy.username','otherPlayer.name','other_player.name','game.opponent.name','game.opponentName'
  ]) || deepFind(row, (key) => /opponent|enemy|other/i.test(key) && /name|user|display/i.test(key));
}

function pickSource(row) {
  return firstValue(row, ['source','game.source','game_source','gameSource','queue_source','match.source','mode'])
    || deepFind(row, (key) => /^(source|gameSource|game_source|mode)$/i.test(key));
}

function pickQueue(row) {
  return firstValue(row, ['queue','queue_id','queueId','queueName','queue_name','game.queue','game.queue_id','game.queueId','match.queue'])
    || deepFind(row, (key) => /queue/i.test(key));
}


function pickDecklist(row, side) {
  const prefixes = side === 'opponent'
    ? ['opponentDecklist','opponent_decklist','opponent.decklist','opponent.deck_list','opponent.cards','enemyDecklist','enemy_decklist','enemy.decklist']
    : ['myDecklist','my_decklist','playerDecklist','player_decklist','decklist','deck_list','player.decklist','player.deck_list','me.decklist'];
  for (const path of prefixes) {
    const value = getByPath(row, path);
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim().startsWith('[')) {
      try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) return parsed; } catch {}
    }
  }
  return null;
}

function pickResult(row) {
  return firstValue(row, ['result','outcome','winner','game.result','game.outcome','isWin','is_win','won']);
}

function pickFormat(row) {
  const direct = firstValue(row, [
    'format','match_format','matchFormat','game.format','queue.format','bestOf','best_of','bo','match.bestOf','match.best_of'
  ]) || deepFind(row, (key) => /^(?:format|matchFormat|match_format|bestOf|best_of|bo)$/i.test(key));
  if (direct === null || direct === undefined) return null;
  const text = String(direct).trim();
  if (/bo\s*3|best\s*of\s*3|bestof3|3/i.test(text)) return 'BO3';
  if (/bo\s*1|best\s*of\s*1|bestof1|1/i.test(text)) return 'BO1';
  return text;
}

function summarizeGame(row) {
  const id = pickGameId(row);
  const explicitDate = firstValue(row, [
    'updatedAt','updated_at','playedAt','played_at','completedAt','completed_at','createdAt','created_at',
    'game.updatedAt','game.updated_at','game.completedAt','game.completed_at','game.createdAt','game.created_at',
    'finishedAt','finished_at','endedAt','ended_at','timestamp','date'
  ]);
  const updatedAt = pickDate(row);
  return {
    id,
    replayId: pickReplayId(row),
    source: pickSource(row),
    queue: pickQueue(row),
    opponent: pickOpponent(row),
    result: pickResult(row),
    format: pickFormat(row),
    updatedAt,
    dateSource: explicitDate ? 'api' : (updatedAt ? 'id' : 'unknown'),
    myDecklist: pickDecklist(row, 'mine'),
    opponentDecklist: pickDecklist(row, 'opponent'),
    rawKeys: row && typeof row === 'object' ? Object.keys(row).slice(0, 25) : [],
    apiRow: row || null,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { success: false, error: 'Méthode non autorisée.' });
  }

  try {
    const body = await readJsonBody(req);
    const limit = safeLimit(body.limit);
    const cursor = body.cursor ? String(body.cursor) : '';
    const source = body.source ? String(body.source) : '';
    const queue = body.queue ? String(body.queue) : '';
    const from = body.from ? String(body.from) : '';
    const to = body.to ? String(body.to) : '';
    const resolved = await resolveDuelinkToken(req, { token: cleanToken(body.token) });
    const token = resolved.token;
    const tokenSource = resolved.source || 'request';

    const url = new URL('/api/me/match-history', DUELINK_BASE_URL);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', String(limit));
    if (cursor) url.searchParams.set('cursor', cursor);
    if (source) url.searchParams.set('source', source);
    if (queue) url.searchParams.set('queue', queue);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);

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

    const games = Array.isArray(payload?.games) ? payload.games
      : Array.isArray(payload?.items) ? payload.items
      : Array.isArray(payload?.matches) ? payload.matches
      : Array.isArray(payload?.data) ? payload.data
      : (Array.isArray(payload) ? payload : []);
    const summaries = games.slice(0, limit).map(summarizeGame);

    return json(res, 200, {
      success: true,
      tokenSource,
      count: games.length,
      next_cursor: payload?.next_cursor || payload?.nextCursor || null,
      games: summaries,
      sample: games.slice(0, Math.min(3, games.length)),
    });
  } catch (error) {
    const status = error?.code === 'AUTH_REQUIRED' ? 401 : (error?.code === 'TOKEN_MISSING' ? 400 : 500);
    return json(res, status, {
      success: false,
      error: error?.message || 'Erreur inconnue pendant le test Duel.ink.',
    });
  }
}
