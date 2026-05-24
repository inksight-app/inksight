import { createClient } from '@supabase/supabase-js';

// Clé publique Supabase : OK côté frontend.
// Ne jamais mettre ici une clé "service_role".
const supabaseUrl = 'https://htmsgnnqnmaqxuzlcsld.supabase.co';

const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0bXNnbm5xbm1hcXh1emxjc2xkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjYyOTgsImV4cCI6MjA5NDU0MjI5OH0.NX9jDVkm8JL4ffH9f5GsH7BfNOO9MM1N6zKipULNvyI';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});


function sanitizeDuelinkStoredData(value, seen = new WeakSet()) {
  const sensitiveKeys = new Set([
    'opponentDecklist', 'opponent_decklist', 'oppDecklist', 'opp_decklist',
    'enemyDecklist', 'enemy_decklist', 'opponentDeck', 'opponent_deck',
    'opponent_deck_hash', 'opponentDeckHash',
    'opponent_deck_unique_cards', 'opponentDeckUniqueCards',
    'opponent_deck_copies', 'opponentDeckCopies'
  ]);
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return null;
  seen.add(value);
  if (Array.isArray(value)) return value.map(item => sanitizeDuelinkStoredData(item, seen));
  const clean = {};
  for (const [key, nested] of Object.entries(value)) {
    if (sensitiveKeys.has(key) || /^opp(?:onent)?_?deck(?:list|_hash|_copies|_unique_cards)?$/i.test(key) || /^enemy_?deck(list)?$/i.test(key)) continue;
    clean[key] = sanitizeDuelinkStoredData(nested, seen);
  }
  return clean;
}

function sanitizeSavedMatchRow(row) {
  if (!row || typeof row !== 'object') return row;
  const clean = sanitizeDuelinkStoredData(row);
  delete clean.opponent_decklist;
  return clean;
}

// =========================================================
// Auth · Fonctions utilisateur
// =========================================================

export async function signInWithDiscord() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: window.location.origin,
      scopes: 'identify email',
    },
  });

  if (error) throw error;

  return data;
}


export async function signUpUser(email, password) {
  const cleanEmail = String(email || '').trim().toLowerCase();

  if (!cleanEmail || !password) {
    throw new Error('Email et mot de passe requis.');
  }

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) throw error;

  return data;
}

export async function signInUser(email, password) {
  const cleanEmail = String(email || '').trim().toLowerCase();

  if (!cleanEmail || !password) {
    throw new Error('Email et mot de passe requis.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) throw error;

  return data;
}


export async function listDeckProfiles() {
  const { data, error } = await supabase
    .from('deck_profiles')
    .select('id,name,colors,archetype,notes,archived_at,created_at,updated_at')
    .order('name', { ascending: true });

  if (error) throw error;

  return data || [];
}

export async function upsertDeckProfile(profile = {}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Vous devez être connecté pour créer un deck.');
  }

  const name = String(profile.name || '').trim();

  if (!name) {
    throw new Error('Nom de deck manquant.');
  }

  const { data, error } = await supabase
    .from('deck_profiles')
    .upsert(
      {
        user_id: user.id,
        name,
        colors: Array.isArray(profile.colors) ? profile.colors : [],
        updated_at: new Date().toISOString(),
        archived_at: null,
      },
      { onConflict: 'user_id,name' }
    )
    .select('id,name,colors,archetype,notes,archived_at,created_at,updated_at')
    .single();

  if (error) throw error;

  return data;
}


export async function renameDeckProfile(deckId, name) {
  if (!deckId) throw new Error('Identifiant de deck manquant.');
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new Error('Nom de deck manquant.');

  const { data, error } = await supabase
    .from('deck_profiles')
    .update({ name: cleanName, updated_at: new Date().toISOString() })
    .eq('id', deckId)
    .select('id,name,colors,archetype,notes,archived_at,created_at,updated_at')
    .single();

  if (error) throw error;
  return data;
}

export async function archiveDeckProfile(deckId, archive = true) {
  if (!deckId) throw new Error('Identifiant de deck manquant.');

  const { data, error } = await supabase
    .from('deck_profiles')
    .update({
      archived_at: archive ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', deckId)
    .select('id,name,colors,archetype,notes,archived_at,created_at,updated_at')
    .single();

  if (error) throw error;
  return data;
}

export async function mergeDeckProfiles(sourceDeckId, targetDeckId) {
  if (!sourceDeckId || !targetDeckId) throw new Error('Deck source ou cible manquant.');
  if (sourceDeckId === targetDeckId) throw new Error('Choisissez deux decks différents.');

  const { data: target, error: targetError } = await supabase
    .from('deck_profiles')
    .select('id,name')
    .eq('id', targetDeckId)
    .single();

  if (targetError) throw targetError;

  const { error: matchError } = await supabase
    .from('saved_matches')
    .update({
      deck_profile_id: targetDeckId,
      deck_name: target?.name || null,
      updated_at: new Date().toISOString(),
    })
    .eq('deck_profile_id', sourceDeckId);

  if (matchError) throw matchError;

  const { data, error } = await supabase
    .from('deck_profiles')
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: 'Fusionné dans une autre version de deck.',
    })
    .eq('id', sourceDeckId)
    .select('id,name,colors,archetype,notes,archived_at,created_at,updated_at')
    .single();

  if (error) throw error;
  return data;
}

export async function saveMatchAnalysis(payload, details = {}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Vous devez être connecté pour sauvegarder une analyse.');
  }

  const safePayload = {
    ...payload,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('saved_matches')
    .insert(safePayload)
    .select()
    .single();

  if (error) throw error;

  await saveDetailedAnalysisRows(data.id, user.id, details);

  return data;
}

async function saveDetailedAnalysisRows(matchId, userId, details = {}) {
  if (!matchId || !userId) return;

  const games = Array.isArray(details.games) ? details.games : [];
  const cardStats = Array.isArray(details.cardStats) ? details.cardStats : [];
  const turnStats = Array.isArray(details.turnStats) ? details.turnStats : [];

  await insertMany('saved_games', games.map((row) => ({
    ...row,
    user_id: userId,
    match_id: matchId,
  })));

  await insertMany('saved_card_stats', cardStats.map((row) => ({
    ...row,
    user_id: userId,
    match_id: matchId,
  })));

  await insertMany('saved_turn_stats', turnStats.map((row) => ({
    ...row,
    user_id: userId,
    match_id: matchId,
  })));
}

async function insertMany(table, rows, chunkSize = 500) {
  if (!Array.isArray(rows) || !rows.length) return [];

  const inserted = [];

  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    const { data, error } = await supabase
      .from(table)
      .insert(chunk)
      .select('id');

    if (error) {
      throw new Error(`Erreur d'écriture ${table} : ${error.message}`);
    }

    inserted.push(...(data || []));
  }

  return inserted;
}


export async function listSavedMatchSummaries(limit = 5000) {
  const { data, error } = await supabase
    .from('saved_matches')
    .select([
      'id',
      'created_at',
      'updated_at',
      'title',
      'format',
      'result',
      'wins',
      'losses',
      'score_label',
      'matchup_label',
      'mine_colors',
      'opponent_colors',
      'opponent_name',
      'deck_name',
      'deck_profile_id',
      'duelink_url',
      'played_at',
      'source_type',
      'duelink_match_id',
      'duelink_source',
      'duelink_queue',
      'duelink_updated_at',
      'replay_sha256',
      'api_metadata',
      'replay_fingerprint',
      'data_quality',
      'quality_issues',
      'total_turns',
      'avg_turns',
      'final_mine_lore',
      'final_opp_lore',
    ].join(','))
    .order('played_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map(sanitizeSavedMatchRow);
}

export async function listSavedMatches(limit = 100) {
  const { data, error } = await supabase
    .from('saved_matches')
    .select([
      'id',
      'created_at',
      'updated_at',
      'title',
      'format',
      'result',
      'wins',
      'losses',
      'score_label',
      'matchup_label',
      'mine_colors',
      'opponent_colors',
      'opponent_name',
      'deck_name',
      'deck_profile_id',
      'duelink_url',
      'played_at',
      'source_type',
      'duelink_match_id',
      'duelink_source',
      'duelink_queue',
      'duelink_updated_at',
      'replay_sha256',
      'my_decklist',
      'api_metadata',
      'replay_fingerprint',
      'data_quality',
      'quality_issues',
      'total_turns',
      'avg_turns',
      'final_mine_lore',
      'final_opp_lore',
      'analysis_json',
    ].join(','))
    .order('played_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map(sanitizeSavedMatchRow);
}

export async function getSavedMatch(matchId) {
  if (!matchId) throw new Error('Identifiant de match manquant.');

  const { data, error } = await supabase
    .from('saved_matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (error) throw error;

  return sanitizeSavedMatchRow(data);
}


export async function updateSavedMatchDeck(matchId, deck = {}) {
  if (!matchId) throw new Error('Identifiant de match manquant.');

  const deckProfileId = deck.deck_profile_id || null;
  const deckName = deck.deck_name || null;

  const { data, error } = await supabase
    .from('saved_matches')
    .update({
      deck_profile_id: deckProfileId,
      deck_name: deckName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', matchId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteSavedMatch(matchId) {
  if (!matchId) throw new Error('Identifiant de match manquant.');

  const { error } = await supabase
    .from('saved_matches')
    .delete()
    .eq('id', matchId);

  if (error) throw error;

  return true;
}


async function selectAllByMatchIds(table, ids, applyOrder = query => query, chunkSize = 75) {
  const all = [];
  const cleanIds = [...new Set((ids || []).filter(Boolean))];
  const pageSize = 1000;

  for (let index = 0; index < cleanIds.length; index += chunkSize) {
    const chunk = cleanIds.slice(index, index + chunkSize);
    let from = 0;

    while (true) {
      let query = supabase
        .from(table)
        .select('*')
        .in('match_id', chunk)
        .range(from, from + pageSize - 1);

      query = applyOrder(query);
      const { data, error } = await query;

      if (error) throw error;

      const rows = data || [];
      all.push(...rows);

      if (rows.length < pageSize) break;
      from += pageSize;
    }
  }

  return all;
}

export async function listSavedAnalyticsDetails(matchIds = []) {
  const ids = [...new Set((matchIds || []).filter(Boolean))];

  if (!ids.length) {
    return { games: [], cardStats: [], turnStats: [] };
  }

  // PostgREST/Supabase may cap a single select to 1000 rows. A large history can easily
  // contain more card/turn-stat rows than that, which would make the dashboard render
  // partial and therefore false signals. Fetch in ID chunks + pages so the background
  // analytics load is complete before it is displayed.
  const [games, cardStats, turnStats] = await Promise.all([
    selectAllByMatchIds('saved_games', ids, query => query.order('game_number', { ascending: true })),
    selectAllByMatchIds('saved_card_stats', ids, query => query.order('card_name', { ascending: true })),
    selectAllByMatchIds('saved_turn_stats', ids, query => query.order('game_number', { ascending: true }).order('turn', { ascending: true })),
  ]);

  return {
    games: games.map(sanitizeSavedMatchRow),
    cardStats,
    turnStats,
  };
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;

  return true;
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) return null;

  return user;
}

export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) return null;

  return session;
}
export async function logDuelinkSyncRun(run = {}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Vous devez être connecté pour journaliser une synchronisation Duels.ink.');
  }

  const payload = {
    user_id: user.id,
    started_at: run.started_at || new Date().toISOString(),
    finished_at: run.finished_at || null,
    status: run.status || 'pending',
    matches_seen: Number(run.matches_seen || 0),
    matches_imported: Number(run.matches_imported || 0),
    matches_skipped: Number(run.matches_skipped || 0),
    matches_failed: Number(run.matches_failed || 0),
    error: run.error || null,
    details: run.details && typeof run.details === 'object' ? run.details : {},
  };

  const { data, error } = await supabase
    .from('duelink_sync_runs')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}
