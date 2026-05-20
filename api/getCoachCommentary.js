import { COACH_LINE_LIBRARY } from './coach-lines.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_TITLE = 'LECTURE DU MATCH';
const DEFAULT_DESCRIPTION = 'Le coach local n’a pas trouvé de punchline assez propre pour ce replay.';

function cleanJsonString(rawText = '') {
  return String(rawText || '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

function extractFirstJsonObject(text = '') {
  const cleaned = cleanJsonString(text);
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found in response.');
    return JSON.parse(match[0]);
  }
}

function getNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clampText(value, fallback, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return fallback;
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength).trim();
  const lastSentence = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('!'), cut.lastIndexOf('?'));
  if (lastSentence > Math.floor(maxLength * 0.55)) return cut.slice(0, lastSentence + 1).trim();
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 20 ? cut.slice(0, lastSpace) : cut).trim();
}

function stableHash(seed = '') {
  let hash = 2166136261;
  const str = String(seed || '');
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function stablePick(list = [], seed = '') {
  const items = Array.isArray(list) ? list.filter(Boolean) : [];
  if (!items.length) return null;
  return items[stableHash(seed) % items.length];
}

function fillTemplate(template = '', vars = {}) {
  return String(template || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    const value = vars[key];
    if (value === undefined || value === null || value === '') return '—';
    return String(value);
  });
}

function normalizeBool(value, fallback = null) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return fallback;
}

function getBodyContext(body = {}) {
  const monScore = getNumber(body.monScore ?? body.mineScore);
  const scoreAdverse = getNumber(body.scoreAdverse ?? body.opponentScore);
  const scoreGap = getNumber(body.scoreGap, Math.abs(monScore - scoreAdverse));
  const nbTours = Math.max(0, Math.round(getNumber(body.nbTours ?? body.turnCount)));
  const inkFloat = getNumber(body.inkFloat);
  const toursTopDeck = getNumber(body.toursTopDeck ?? body.topDeckTurns);
  const loreFromLocations = getNumber(body.loreFromLocations);
  const isWin = normalizeBool(body.isWin, monScore > scoreAdverse && (monScore >= 20 || scoreAdverse < 20));
  const isLoss = !isWin;
  const pace = body.pace || body.archetypeSpeed || (nbTours <= 6 ? 'Aggro' : nbTours >= 13 ? 'Control' : 'Midrange');
  const actionTotals = body.actionTotals || {};
  const questCount = getNumber(body.questCount ?? actionTotals.quests);
  const challengeCount = getNumber(body.challengeCount ?? actionTotals.challenges);
  const questRatio = getNumber(body.questRatio, questCount + challengeCount > 0 ? Math.round((questCount / (questCount + challengeCount)) * 100) : 0);
  const cardsPlayedTotal = getNumber(body.cardsPlayedTotal ?? actionTotals.played);
  const inkedTotal = getNumber(body.inkedTotal ?? actionTotals.inked);

  return {
    monScore,
    scoreAdverse,
    scoreGap,
    nbTours,
    inkFloat,
    toursTopDeck,
    loreFromLocations,
    isWin,
    isLoss,
    pace,
    otp: clampText(body.otp, 'inconnu', 24),
    opponentName: clampText(body.opponentName, 'l’adversaire', 80),
    deckName: clampText(body.deckName, 'deck non renseigné', 120),
    matchupLabel: clampText(body.matchupLabel, 'matchup non renseigné', 120),
    format: clampText(body.format, 'BO1', 12),
    topQuester: clampText(body.topQuester || body.topLoreSource, 'votre moteur de lore', 90),
    topLoreSource: clampText(body.topLoreSource || body.topQuester, 'votre moteur de lore', 90),
    topInkedCard: clampText(body.topInkedCard, 'aucune carte', 90),
    topInkedCount: getNumber(body.topInkedCount),
    topPlayedCard: clampText(body.topPlayedCard, 'aucune carte', 90),
    topPlayedCount: getNumber(body.topPlayedCount),
    nbMulligan: getNumber(body.nbMulligan ?? body.mulliganChanges),
    maxFloatTurn: getNumber(body.maxFloatTurn),
    maxFloatAmount: getNumber(body.maxFloatAmount),
    questCount,
    challengeCount,
    questRatio,
    cardsPlayedTotal,
    inkedTotal,
  };
}

function conditionMatches(conditions = {}, v = {}) {
  if (Object.prototype.hasOwnProperty.call(conditions, 'isWin') && Boolean(conditions.isWin) !== Boolean(v.isWin)) return false;
  if (conditions.monScoreMin !== undefined && v.monScore < conditions.monScoreMin) return false;
  if (conditions.monScoreMax !== undefined && v.monScore > conditions.monScoreMax) return false;
  if (conditions.monScoreEquals !== undefined && v.monScore !== conditions.monScoreEquals) return false;
  if (conditions.scoreAdverseMin !== undefined && v.scoreAdverse < conditions.scoreAdverseMin) return false;
  if (conditions.scoreAdverseMax !== undefined && v.scoreAdverse > conditions.scoreAdverseMax) return false;
  if (conditions.scoreAdverseEquals !== undefined && v.scoreAdverse !== conditions.scoreAdverseEquals) return false;
  if (conditions.scoreGapMax !== undefined && v.scoreGap > conditions.scoreGapMax) return false;
  if (conditions.nbToursMin !== undefined && v.nbTours < conditions.nbToursMin) return false;
  if (conditions.nbToursMax !== undefined && v.nbTours > conditions.nbToursMax) return false;
  if (conditions.inkFloatMin !== undefined && v.inkFloat < conditions.inkFloatMin) return false;
  if (conditions.toursTopDeckMin !== undefined && v.toursTopDeck < conditions.toursTopDeckMin) return false;
  if (conditions.loreFromLocationsMin !== undefined && v.loreFromLocations < conditions.loreFromLocationsMin) return false;
  if (conditions.nbMulliganMin !== undefined && v.nbMulligan < conditions.nbMulliganMin) return false;
  if (conditions.challengeCountMin !== undefined && v.challengeCount < conditions.challengeCountMin) return false;
  if (conditions.questRatioMin !== undefined && v.questRatio < conditions.questRatioMin) return false;
  return true;
}

function selectScenario(v) {
  const scenarios = Array.isArray(COACH_LINE_LIBRARY?.scenarios) ? COACH_LINE_LIBRARY.scenarios : [];
  const candidates = scenarios
    .filter((scenario) => conditionMatches(scenario.conditions || {}, v))
    .sort((a, b) => getNumber(b.priority) - getNumber(a.priority));
  return candidates[0] || scenarios.find((scenario) => scenario.id === (v.isWin ? 'clean_win' : 'default_loss')) || scenarios[0];
}

function buildLocalCommentary(body = {}) {
  const v = getBodyContext(body);
  const scenario = selectScenario(v);
  const seed = [
    scenario?.id,
    v.monScore,
    v.scoreAdverse,
    v.nbTours,
    v.inkFloat,
    v.toursTopDeck,
    v.loreFromLocations,
    v.nbMulligan,
    v.topQuester,
    v.opponentName,
    v.deckName,
    v.matchupLabel,
  ].join('|');
  const picked = stablePick(scenario?.lines, seed) || {};
  const titleMax = getNumber(COACH_LINE_LIBRARY?.rules?.titleMaxChars, 46);
  const descriptionMax = getNumber(COACH_LINE_LIBRARY?.rules?.descriptionMaxChars, 185);
  return {
    title: clampText(fillTemplate(picked.title, v), DEFAULT_TITLE, titleMax),
    description: clampText(fillTemplate(picked.description, v), DEFAULT_DESCRIPTION, descriptionMax),
    source: 'local',
    badge: 'Coach DB',
    scenario: scenario?.id || 'unknown',
    variantId: picked.id || '',
    libraryVersion: COACH_LINE_LIBRARY?.version || 'unknown',
  };
}

function buildSystemPrompt() {
  return `Tu es un commentateur eSport Disney Lorcana. Tu dois écrire comme une punchline de replay, pas comme une analyse longue.
Règles absolues :
- Réponds uniquement en JSON valide avec exactement {"title":"...","description":"..."}.
- title : 3 à 5 mots, majuscules, maximum 46 caractères.
- description : maximum 2 phrases courtes, maximum 185 caractères.
- Ton : sport/eSport, piquant, TCG, mais jamais insultant envers la personne.
- Interdits : félicitations, cependant, analyse complète, long paragraphe, markdown.`;
}

function buildUserPrompt(body = {}) {
  const v = getBodyContext(body);
  return `Match Lorcana à commenter :
Résultat : ${v.isWin ? 'Victoire' : 'Défaite'} ${v.monScore}-${v.scoreAdverse}
Adversaire : ${v.opponentName}
Format : ${v.format}
Deck : ${v.deckName}
Matchup : ${v.matchupLabel}
Durée : ${v.nbTours} tours (${v.pace})
Départ : ${v.otp}
MVP lore : ${v.topQuester}
Encre flottée : ${v.inkFloat}
Tours top deck : ${v.toursTopDeck}
Mulligan : ${v.nbMulligan}
Lore passif lieux : ${v.loreFromLocations}
Quêtes : ${v.questCount}, défis : ${v.challengeCount}, ratio quête : ${v.questRatio}%`;
}

async function callGroq(body) {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(body) },
      ],
      temperature: 0.55,
      max_completion_tokens: 120,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Groq API error: ${data?.error?.message || response.status}`);
  }

  const rawText = data?.choices?.[0]?.message?.content || '';
  if (!rawText) throw new Error('Empty Groq response.');
  const parsed = extractFirstJsonObject(rawText);
  const local = buildLocalCommentary(body);

  return {
    title: clampText(parsed.title, local.title, 46).toUpperCase(),
    description: clampText(parsed.description, local.description, 185),
    source: 'groq',
    badge: 'Coach IA',
    fallbackScenario: local.scenario,
    libraryVersion: COACH_LINE_LIBRARY?.version || 'unknown',
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }

  const localCommentary = buildLocalCommentary(body);
  const useGroq = process.env.COACH_USE_GROQ === 'true' && !!process.env.GROQ_API_KEY;

  if (!useGroq) {
    return res.status(200).json({ ...localCommentary, reason: process.env.GROQ_API_KEY ? 'local_first' : 'missing_key' });
  }

  try {
    const commentary = await callGroq(body);
    return res.status(200).json(commentary);
  } catch (error) {
    console.warn('Groq failure, fallback to local DB:', error.message);
    return res.status(200).json({ ...localCommentary, reason: 'groq_error', debug: error.message });
  }
}

export { buildLocalCommentary, getBodyContext, selectScenario };
