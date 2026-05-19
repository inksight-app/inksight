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
    if (!match) throw new Error("No JSON object found in response.");
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
    monScore, scoreAdverse, nbTours, inkFloat, toursTopDeck, loreFromLocations,
    isWin, isLoss, scoreGap, pace, otp, topQuester, opponentName,
    nbMulligan: getNumber(body.nbMulligan ?? body.mulliganChanges),
    topInkedCard, topInkedCount: getNumber(body.topInkedCount),
    topPlayedCard, topPlayedCount: getNumber(body.topPlayedCount),
    deckName: clampText(body.deckName, "deck non renseigné", 120),
    matchupLabel: clampText(body.matchupLabel, "matchup non renseigné", 120),
    format: clampText(body.format, "BO1", 12),
  };
}

function buildLocalCommentary(body = {}) {
  const v = getBodyContext(body);
  const seed = [v.monScore, v.scoreAdverse, v.nbTours, v.inkFloat, v.toursTopDeck, v.loreFromLocations, v.topQuester, v.opponentName].join("|");

  const pools = {
    perfectWin: {
      title: ["Intouchable.", "No match.", "Board verrouillé."],
      description: ["Un vrai {monScore}-0 des familles. {opponentName} a regardé votre board partir en aventure sans jamais trouver le bouton pause.", "Card, Ink et Lore Advantage verrouillés. Même pas besoin de top deck : la game était pliée tour {nbTours}."]
    },
    stompWin: {
      title: ["Promenade de santé.", "Ink et Lore Advantage.", "Scoop mental."],
      description: ["Victoire {monScore}-{scoreAdverse} en {nbTours} tours. {topQuester} a porté la clock pendant que {opponentName} cherchait encore son plan de jeu."]
    },
    cleanWin: {
      title: ["Victoire solide.", "Plan exécuté.", "Travail propre."],
      description: ["Victoire {monScore}-{scoreAdverse}. Le plan {pace} a tenu : tu as converti tes ressources en lore sans laisser trop de fenêtres à {opponentName}."]
    },
    concedeWin: {
      title: ["Scoop détecté.", "Game écourtée.", "Il a lâché."],
      description: ["Victoire avant les 20 lore : le score finit à {monScore}-{scoreAdverse}, mais le replay indique que la partie est gagnée. Probable scoop ou état de board devenu ingérable."]
    },
    closeWin: {
      title: ["Photo-finish.", "Lethal sur le fil.", "La course au Lore."],
      description: ["Victoire {monScore}-{scoreAdverse} au tour {nbTours}. Une vraie course au lethal : un mauvais trade et la game pouvait basculer."]
    },
    closeLoss: {
      title: ["Si proche du but...", "À un lore près.", "Le seum du lethal."],
      description: ["Défaite {monScore}-{scoreAdverse}. Il manquait presque rien : la VOD doit surtout retrouver le tour où la course au lore bascule."]
    },
    stompLoss: {
      title: ["Sortie de route.", "Aïe, le rouleau compresseur.", "Brick suspect."],
      description: ["Défaite {monScore}-{scoreAdverse}. {opponentName} a pris le Lore Advantage instantanément et tu n’as jamais vraiment récupéré le board."]
    },
    topDeck: {
      title: ["Top deck mode.", "Asphyxie totale.", "Page blanche."],
      description: ["Tu as passé {toursTopDeck} tours en main vide ou quasi vide. Perdre le Card Advantage comme ça transforme chaque pioche en prière."]
    },
    inkLeak: {
      title: ["Fuite d’encre.", "Tempo perdu.", "Curve en grève."],
      description: ["{inkFloat} encres flottées, c’est beaucoup trop de ressources non converties. À Lorcana, l’Ink Advantage ne sert à rien si la curve ne suit pas."]
    },
    passiveLore: {
      title: ["L’immobilier paie.", "Lore passif destructeur.", "Start-of-turn rentable."],
      description: ["Tes lieux ont généré {loreFromLocations} lore passif. Pendant que l’adversaire gérait les personnages, l’immobilier faisait avancer le lethal tout seul."]
    },
    control: {
      title: ["Bataille de tranchées.", "Guerre d’usure.", "Attrition totale."],
      description: ["{nbTours} tours, ça sent le match Control. La partie s’est jouée sur l’attrition, le Card Advantage et la capacité à trouver le dernier moteur de lore."]
    },
    defaultLoss: {
      title: ["Défaite à décortiquer.", "Tempo à revoir.", "VOD obligatoire."],
      description: ["Défaite {monScore}-{scoreAdverse}. Le journal devrait aider à trouver le tour où {opponentName} prend définitivement l’ascendant."]
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

  const vars = { ...v, pace: v.pace };

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
- Résultat : ${v.isWin ? "victoire" : "défaite"}
- Durée : ${v.nbTours} tours
- Rythme probable : ${v.pace}
- Cartes mulliganées : ${v.nbMulligan}
- Encre flottée : ${v.inkFloat}
- Tours en main vide : ${v.toursTopDeck}
- Carte MVP : ${v.topQuester}
- Carte la plus encrée : ${v.topInkedCard} (${v.topInkedCount}x)
- Carte la plus jouée : ${v.topPlayedCard} (${v.topPlayedCount}x)
- Lore passif des Lieux : ${v.loreFromLocations}

Consigne de ton :
Fais une vanne piquante mais pas insultante sur le pseudo de l'adversaire ou sur mes erreurs. Reste constructif et pro TCG.
Réponds UNIQUEMENT au format JSON valide, sans markdown, avec exactement deux clés: "title" et "description".
`.trim();
}

async function callGroq(prompt) {
  const response = await fetch("[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("ERREUR GROQ BRUTE:", JSON.stringify(data));
    throw new Error(`Groq API error: ${data?.error?.message || response.status}`);
  }

  const rawText = data?.choices?.[0]?.message?.content || "";
  if (!rawText) throw new Error("Empty Groq response.");
  const parsed = extractFirstJsonObject(rawText);

  return {
    title: clampText(parsed.title, "Lecture du match", 60),
    description: clampText(parsed.description, "Analyse indisponible.", 420),
    source: "Groq Llama 3",
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch(e) {}
  }

  const localFallback = buildLocalCommentary(body);

  if (!process.env.GROQ_API_KEY) {
    return res.status(200).json({ ...localFallback, reason: "missing_key" });
  }

  const prompt = buildPrompt(body);

  try {
    const commentary = await callGroq(prompt);
    return res.status(200).json(commentary);
  } catch (error) {
    console.warn("Groq failure, fallback to local:", error.message);
    return res.status(200).json({ ...localFallback, reason: "groq_error", debug: error.message });
  }
}