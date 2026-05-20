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

  // Fallbacks mis à jour avec un ton plus agressif/commentateur
  const pools = {
    perfectWin: {
      title: ["CLIMATISATION TOTALE !", "UNE MASTERCLASS ABSOLUE.", "FERMETURE DE LA BOUTIQUE."],
      description: ["C'est un {monScore}-0 clinique ! {opponentName} a regardé le match depuis les tribunes pendant que tu roulais sur le board. Une boucherie tactique en {nbTours} tours, emballez c'est pesé !"]
    },
    stompWin: {
      title: ["PROMENADE DE SANTÉ.", "CASSAGE DE REINS EN RÈGLE.", "SCOOP MENTAL."],
      description: ["Victoire écrasante {monScore}-{scoreAdverse}. {topQuester} a porté l'équipe pendant que {opponentName} cherchait encore comment jouer. Il va falloir de la glace pour ces chevilles !"]
    },
    cleanWin: {
      title: ["TRAVAIL DE PRO.", "PROPRE, NET ET SANS BAVURE.", "LE PLAN S'EST DÉROULÉ SANS ACCROC."],
      description: ["Une belle victoire {monScore}-{scoreAdverse}. Tu as imposé ton rythme {pace} et {opponentName} n'a jamais pu respirer. Les ressources ont été converties en caviar de lore !"]
    },
    concedeWin: {
      title: ["ABANDON DANS LA DOULEUR !", "IL A JETÉ L'ÉPONGE.", "SCOOP DÉTECTÉ."],
      description: ["Victoire par K.O. technique avant les 20 lore. Le score s'arrête à {monScore}-{scoreAdverse}, {opponentName} a préféré fuir le carnage plutôt que de subir le lethal."]
    },
    closeWin: {
      title: ["SUR LE FIL DU RASOIR !", "PHOTO-FINISH CARDIAQUE !", "QUEL SPRINT FINAL !"],
      description: ["Victoire à l'arrachée {monScore}-{scoreAdverse} ! Une vraie course au lethal au tour {nbTours}. Tu as fait transpirer le stade, mais le mental a tenu bon !"]
    },
    closeLoss: {
      title: ["LE SEUM EST TOTAL.", "À UN CHEVEU DE LA GLOIRE.", "CRUEL, SI CRUEL..."],
      description: ["Défaite amère {monScore}-{scoreAdverse}. Il s'en est fallu de rien, juste d'un mauvais trade ou d'une mauvaise pioche. La VOD va être douloureuse à regarder !"]
    },
    stompLoss: {
      title: ["UNE VRAIE BOUCHERIE...", "SORTIE DE ROUTE MONUMENTALE.", "LE ROULEAU COMPRESSEUR."],
      description: ["Défaite {monScore}-{scoreAdverse}. On ne va pas se mentir, tu t'es fait ouvrir en deux. {opponentName} a pris le contrôle direct et tu es resté dans les cordes tout le match."]
    },
    topDeck: {
      title: ["LE DÉSERT TACTIQUE.", "PRIÈRE ET TOP DECK.", "PLUS UNE GOUTTE D'ENCRE."],
      description: ["Passer {toursTopDeck} tours la main vide, c'est du suicide ! Perdre l'avantage des cartes t'a transformé en spectateur de ta propre défaite."]
    },
    inkLeak: {
      title: ["LA FUITE D'ENCRE.", "TEMPÊTE DANS UN VERRE D'EAU.", "GASPILLAGE TOTAL."],
      description: ["{inkFloat} encres flottées ! C'est inadmissible à ce niveau. L'adversaire doit bien rigoler face à autant de ressources jetées par la fenêtre."]
    },
    passiveLore: {
      title: ["LA RENTE IMMOBILIÈRE !", "LORE PASSIF, DÉGÂTS ACTIFS.", "L'INSPECTEUR DES IMPÔTS."],
      description: ["Tes lieux ont rapporté {loreFromLocations} lore sans rien faire ! Pendant que {opponentName} s'excitait sur tes personnages, la rente tombait toute seule. Brillant !"]
    },
    control: {
      title: ["DANS LES TRANCHÉES.", "GUERRE D'USURE.", "UN MARATHON MENTAL."],
      description: ["{nbTours} tours de pure souffrance mentale ! Un match ultra lent où chaque décision comptait. Le genre de partie qui finit sous aspirine."]
    },
    defaultLoss: {
      title: ["RÉVEIL DOULOUREUX.", "RETOUR À L'ENTRAÎNEMENT.", "CIRCULEZ, Y'A RIEN À VOIR."],
      description: ["Défaite {monScore}-{scoreAdverse}. Il va falloir analyser la VOD parce que là, {opponentName} t'a clairement donné une leçon de rythme."]
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
Tu es un commentateur d'e-sport et de sport légendaire, connu pour tes punchlines incroyables, ton sarcasme, tes hyperboles et ton style très direct (façon commentateur de football très excité).
Tu dois analyser un match du jeu de cartes Lorcana en te basant sur les statistiques ci-dessous.

RÈGLES STRICTES DE GÉNÉRATION :
1. TITRE ("title") : Donne un titre au match. Il DOIT être agressif, hyper accrocheur. Soit ultra-flatteur et second degré si j'ai dominé, soit piquant, sarcastique et moqueur si j'ai perdu ou mal joué. (1 ligne max).
2. ANALYSE ("description") : Un résumé ultra nerveux. Va droit au but. Utilise du vocabulaire de commentateur sportif (ex: 'masterclass', 'il a fermé la boutique', 'clim', 'cassé les reins', 'caviar', 'boucherie', 'dans les cordes'). Fais une remarque sur mon adversaire (${v.opponentName}).
3. LONGUEUR : Le champ "description" NE DOIT JAMAIS faire plus de 3 ou 4 phrases courtes. Ne coupe pas tes phrases.
4. FORMAT : Réponds UNIQUEMENT au format JSON valide. N'ajoute AUCUN texte avant ou après le JSON. Utilise exactement les clés "title" et "description".

DONNÉES DU MATCH À COMMENTER :
- Mon Résultat : ${v.isWin ? "Victoire" : "Défaite"} (${v.monScore} à ${v.scoreAdverse})
- Adversaire : ${v.opponentName}
- Format : ${v.format}, Deck : ${v.deckName}, Matchup : ${v.matchupLabel}
- Départ : ${v.otp}
- Durée : ${v.nbTours} tours (Rythme probable : ${v.pace})
- Cartes mulliganées au départ : ${v.nbMulligan}
- Encre gaspillée (flottée) : ${v.inkFloat}
- Tours passés avec la main vide (Top deck) : ${v.toursTopDeck}
- Ma carte MVP : ${v.topQuester}
- Ma carte la plus encrée : ${v.topInkedCard} (${v.topInkedCount}x)
- Ma carte la plus jouée : ${v.topPlayedCard} (${v.topPlayedCount}x)
- Lore passif généré par mes Lieux : ${v.loreFromLocations}
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
      temperature: 0.8, // Température un peu plus haute pour plus de "folie" et créativité dans le commentaire
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
    title: clampText(parsed.title, "Analyse du match", 100), // Limite augmentée pour laisser de la place aux titres excentriques
    description: clampText(parsed.description, "Analyse indisponible.", 400), // La limite en dur est maintenue en filet de sécurité
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