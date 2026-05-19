const DEFAULT_GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-1.5-flash",
].filter(Boolean);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function cleanGeminiJson(rawText = "") {
  return String(rawText || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function extractFirstJsonObject(text = "") {
  const cleaned = cleanGeminiJson(text);
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found in Gemini response.");
    return JSON.parse(match[0]);
  }
}

function clampText(value, fallback, maxLength) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return fallback;
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}…` : text;
}

function getNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function stablePick(items, seed = "") {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!list.length) return "";
  let hash = 0;
  String(seed || "").split("").forEach((ch) => {
    hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  });
  return list[Math.abs(hash) % list.length];
}

function fillTemplate(template, vars) {
  return String(template || "").replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    const value = vars[key];
    return value === undefined || value === null || value === "" ? "—" : String(value);
  });
}

function getBodyContext(body = {}) {
  const monScore = getNumber(body.monScore);
  const scoreAdverse = getNumber(body.scoreAdverse);
  const nbTours = getNumber(body.nbTours);
  const inkFloat = getNumber(body.inkFloat);
  const toursTopDeck = getNumber(body.toursTopDeck);
  const loreFromLocations = getNumber(body.loreFromLocations);
  const isWin = body.isWin === true || (monScore > scoreAdverse && (monScore >= 20 || scoreAdverse < 20));
  const isLoss = body.isWin === false || (scoreAdverse > monScore && scoreAdverse >= 20);
  const scoreGap = Math.abs(monScore - scoreAdverse);

  const pace = nbTours <= 6 ? "Aggro" : nbTours >= 13 ? "Control" : "Midrange";
  const otp = clampText(body.otp, "inconnu", 24);
  const topQuester = clampText(body.topQuester || body.topLoreSource, "votre moteur de lore", 80);
  const opponentName = clampText(body.opponentName, "l’adversaire", 80);
  const topInkedCard = clampText(body.topInkedCard, "aucune carte", 80);
  const topPlayedCard = clampText(body.topPlayedCard, "aucune carte", 80);

  return {
    monScore,
    scoreAdverse,
    nbTours,
    inkFloat,
    toursTopDeck,
    loreFromLocations,
    isWin,
    isLoss,
    scoreGap,
    pace,
    otp,
    topQuester,
    opponentName,
    nbMulligan: getNumber(body.nbMulligan ?? body.mulliganChanges),
    topInkedCard,
    topInkedCount: getNumber(body.topInkedCount),
    topPlayedCard,
    topPlayedCount: getNumber(body.topPlayedCount),
    deckName: clampText(body.deckName, "deck non renseigné", 120),
    matchupLabel: clampText(body.matchupLabel, "matchup non renseigné", 120),
    format: clampText(body.format, "BO1", 12),
  };
}

function buildLocalCommentary(body = {}) {
  const v = getBodyContext(body);
  const seed = [
    v.monScore,
    v.scoreAdverse,
    v.nbTours,
    v.inkFloat,
    v.toursTopDeck,
    v.loreFromLocations,
    v.topQuester,
    v.opponentName,
  ].join("|");

  const pools = {
    perfectWin: {
      title: ["Intouchable.", "No match.", "Board verrouillé."],
      description: [
        "Un vrai {monScore}-0 des familles. {opponentName} a regardé votre board partir en aventure sans jamais trouver le bouton pause.",
        "Card, Ink et Lore Advantage verrouillés. Même pas besoin de top deck : la game était pliée tour {nbTours}.",
      ],
    },
    stompWin: {
      title: ["Promenade de santé.", "Ink et Lore Advantage.", "Scoop mental."],
      description: [
        "Victoire {monScore}-{scoreAdverse} en {nbTours} tours. {topQuester} a porté la clock pendant que {opponentName} cherchait encore son plan de jeu.",
        "Tu lui as roulé dessus sans forcer. La curve a fait le travail et le lethal est arrivé avant que le board adverse respire.",
      ],
    },
    cleanWin: {
      title: ["Victoire solide.", "Plan exécuté.", "Travail propre."],
      description: [
        "Victoire {monScore}-{scoreAdverse}. Le plan {pace} a tenu : tu as converti tes ressources en lore sans laisser trop de fenêtres à {opponentName}.",
        "La game est gagnée proprement. {topQuester} ressort comme moteur de lore, avec une ligne de jeu suffisamment stable pour fermer la partie.",
      ],
    },
    concedeWin: {
      title: ["Scoop détecté.", "Game écourtée.", "Il a lâché."],
      description: [
        "Victoire avant les 20 lore : le score finit à {monScore}-{scoreAdverse}, mais le replay indique que la partie est gagnée. Probable scoop ou état de board devenu ingérable.",
        "{opponentName} n’a pas attendu le lethal officiel. À vérifier dans le journal, mais le tempo semblait déjà suffisamment verrouillé.",
      ],
    },
    closeWin: {
      title: ["Photo-finish.", "Lethal sur le fil.", "La course au Lore."],
      description: [
        "Victoire {monScore}-{scoreAdverse} au tour {nbTours}. Une vraie course au lethal : un mauvais trade et la game pouvait basculer.",
        "C’était moins une. Tu as trouvé la dernière fenêtre de lore avant que {opponentName} ne ferme la porte.",
      ],
    },
    closeLoss: {
      title: ["Si proche du but...", "À un lore près.", "Le seum du lethal."],
      description: [
        "Défaite {monScore}-{scoreAdverse}. Il manquait presque rien : la VOD doit surtout retrouver le tour où la course au lore bascule.",
        "Belle résistance, mais le dernier top deck ou le dernier trade a tourné du mauvais côté. La prochaine, c’est la bonne.",
      ],
    },
    stompLoss: {
      title: ["Sortie de route.", "Aïe, le rouleau compresseur.", "Brick suspect."],
      description: [
        "Défaite {monScore}-{scoreAdverse}. {opponentName} a pris le Lore Advantage instantanément et tu n’as jamais vraiment récupéré le board.",
        "La curve a déraillé et l’adversaire a ramp dans ta dignité. À revoir : mulligan, early game et première fenêtre de tempo perdue.",
      ],
    },
    topDeck: {
      title: ["Top deck mode.", "Asphyxie totale.", "Page blanche."],
      description: [
        "Tu as passé {toursTopDeck} tours en main vide ou quasi vide. Perdre le Card Advantage comme ça transforme chaque pioche en prière.",
        "Le moteur de pioche a calé. Même avec {inkFloat} encres flottées, sans main, impossible de convertir proprement le tempo.",
      ],
    },
    inkLeak: {
      title: ["Fuite d’encre.", "Tempo perdu.", "Curve en grève."],
      description: [
        "{inkFloat} encres flottées, c’est beaucoup trop de ressources non converties. À Lorcana, l’Ink Advantage ne sert à rien si la curve ne suit pas.",
        "L’encre était là, mais pas la pression. Tu as laissé du tempo sur la table, et {opponentName} a pu respirer.",
      ],
    },
    passiveLore: {
      title: ["L’immobilier paie.", "Lore passif destructeur.", "Start-of-turn rentable."],
      description: [
        "Tes lieux ont généré {loreFromLocations} lore passif. Pendant que l’adversaire gérait les personnages, l’immobilier faisait avancer le lethal tout seul.",
        "{opponentName} a probablement sous-estimé les lieux. {loreFromLocations} points gratuits au start-of-turn, ça finit par coûter une game.",
      ],
    },
    control: {
      title: ["Bataille de tranchées.", "Guerre d’usure.", "Attrition totale."],
      description: [
        "{nbTours} tours, ça sent le match Control. La partie s’est jouée sur l’attrition, le Card Advantage et la capacité à trouver le dernier moteur de lore.",
        "Longue game, beaucoup de décisions invisibles. Ici, la clé n’est pas seulement le score final : c’est qui a gardé assez de ressources pour le late game.",
      ],
    },
    defaultLoss: {
      title: ["Défaite à décortiquer.", "Tempo à revoir.", "VOD obligatoire."],
      description: [
        "Défaite {monScore}-{scoreAdverse}. Le journal devrait aider à trouver le tour où {opponentName} prend définitivement l’ascendant.",
        "La partie n’est pas forcément perdue au score final, mais sur l’accumulation de petites pertes de tempo. À revoir : curve, trades et fenêtres de quest.",
      ],
    },
  };

  let scenario = pools.cleanWin;
  if (v.isWin && v.monScore >= 20 && v.scoreAdverse === 0) scenario = pools.perfectWin;
  else if (v.isWin && v.monScore < 20) scenario = pools.concedeWin;
  else if (v.isWin && v.scoreAdverse <= 5) scenario = pools.stompWin;
  else if (v.isWin && v.loreFromLocations >= 4) scenario = pools.passiveLore;
  else if (v.scoreGap <= 3 && v.monScore >= 15 && v.scoreAdverse >= 15) scenario = v.isWin ? pools.closeWin : pools.closeLoss;
  else if (!v.isWin && v.monScore <= 6 && v.scoreAdverse >= 20) scenario = pools.stompLoss;
  else if (v.toursTopDeck >= 4) scenario = pools.topDeck;
  else if (v.inkFloat >= 15) scenario = pools.inkLeak;
  else if (v.nbTours >= 13) scenario = pools.control;
  else if (!v.isWin) scenario = pools.defaultLoss;

  const vars = {
    ...v,
    pace: v.pace,
  };

  return {
    title: clampText(fillTemplate(stablePick(scenario.title, seed), vars), "Lecture du match", 60),
    description: clampText(fillTemplate(stablePick(scenario.description, `${seed}-desc`), vars), "Analyse locale indisponible.", 420),
    source: "local",
  };
}

function buildPrompt(body = {}) {
  const v = getBodyContext(body);
  return `
Tu es un coach eSport Lorcana sarcastique, piquant, mais très expert.
Tu maîtrises la théorie des ressources : Card Advantage, Ink Advantage, Tempo, Curve, Lethal, Top deck, Lore passif, Attrition.

Analyse ce match :
- Adversaire : ${v.opponentName}
- Format : ${v.format}
- Deck : ${v.deckName}
- Matchup : ${v.matchupLabel}
- Départ : ${v.otp}
- Score : ${v.monScore} à ${v.scoreAdverse}
- Résultat : ${v.isWin ? "victoire" : v.isLoss ? "défaite" : "résultat ambigu"}
- Durée : ${v.nbTours} tours
- Rythme probable : ${v.pace}
- Cartes mulliganées : ${v.nbMulligan}
- Encre flottée : ${v.inkFloat}
- Tours en main vide / quasi vide : ${v.toursTopDeck}
- Carte MVP / moteur de Lore : ${v.topQuester}
- Carte la plus encrée : ${v.topInkedCard} (${v.topInkedCount}x)
- Carte la plus jouée : ${v.topPlayedCard} (${v.topPlayedCount}x)
- Lore passif généré par les Lieux : ${v.loreFromLocations}

Consigne de ton :
Fais une vanne piquante mais pas insultante sur le pseudo de l’adversaire ou sur mes erreurs.
Reste utile et orienté coaching compétitif. Utilise le jargon TCG naturellement : board, quest, lore, curve, brick, ramp, scoop, lethal, top deck.

Règles de factualité strictes :
- Ne dis jamais "20-0" si le score exact n’est pas 20 à 0.
- Si le score gagnant est inférieur à 20, parle plutôt de scoop, concession ou replay écourté.
- Ne prétends pas qu’une carte a gagné seule si les chiffres ne le montrent pas.
- Si l’encre flottée est élevée, parle d’Ink Advantage ou de curve ratée.
- Si toursTopDeck est élevé, parle de perte de Card Advantage.
- Si loreFromLocations est élevé, parle de Lore passif.
- Si le match est serré, parle de course au lethal.
- Si une carte est très souvent encrée, tu peux la mentionner comme slot flexible, sans dire qu’elle est mauvaise.
- Si la carte MVP est un Objet, une Action ou un Lieu, parle de moteur de Lore plutôt que de quêteur.

Réponds UNIQUEMENT au format JSON valide, sans markdown, sans backticks, avec exactement deux clés :
{
  "title": "5 mots max",
  "description": "2 à 3 phrases"
}
`.trim();
}

async function callGemini(model, prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.75,
          topP: 0.9,
          maxOutputTokens: 220,
        },
      }),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${model}: ${data?.error?.message || `HTTP ${response.status}`}`);
  }

  const rawText =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("\n")
      .trim() || "";

  if (!rawText) throw new Error(`${model}: Empty Gemini response.`);
  const parsed = extractFirstJsonObject(rawText);

  return {
    title: clampText(parsed.title, "Lecture du match", 60),
    description: clampText(parsed.description, "Analyse indisponible pour ce match.", 420),
    source: "gemini",
    model,
  };
}

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed. Use POST." }),
    };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch (_) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid JSON body." }),
    };
  }

  const localFallback = buildLocalCommentary(body);

  if (!process.env.GEMINI_API_KEY) {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        ...localFallback,
        source: "local",
        reason: "missing_gemini_api_key",
      }),
    };
  }

  const prompt = buildPrompt(body);
  const errors = [];

  for (const model of DEFAULT_GEMINI_MODELS) {
    try {
      const commentary = await callGemini(model, prompt);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(commentary),
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  console.warn("Gemini unavailable; using local fallback:", errors.join(" | "));
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      ...localFallback,
      source: "local",
      reason: "gemini_unavailable",
      debug: process.env.NODE_ENV === "development" ? errors : undefined,
    }),
  };
};
