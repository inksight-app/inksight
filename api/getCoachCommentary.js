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
      title: ["CLIMATISATION TOTALE !", "UNE MASTERCLASS ABSOLUE.", "FERMETURE DE LA BOUTIQUE.", "DOMINATION CLINIQUE.", "LE BROOM SWEEP !"],
      description: [
        "Un 20-0 parfait ! {opponentName} a regardé le match en spectateur pendant que tu roulais sur le board. Aucun respect pour son tempo.",
        "Card Advantage, Ink Advantage, Lore Advantage... Tu as tout confisqué. {topQuester} s'est promené sur le terrain comme à l'entraînement.",
        "Une boucherie tactique. Pas un seul point de lore concédé. Même les balais de Mickey n'auraient pas nettoyé le board aussi proprement !",
        "On The Play ou On The Draw, ça n'a rien changé. Tu as verrouillé la game avant même qu'elle ne commence vraiment.",
        "Score vierge en face. Tu as imposé un rythme {pace} infernal et la défense a été un mur de briques. Emballez, c'est pesé."
      ]
    },
    stompWin: {
      title: ["CASSAGE DE REINS EN RÈGLE.", "PROMENADE DE SANTÉ.", "SCOOP MENTAL.", "LE ROULEAU COMPRESSEUR.", "UNE LEÇON DE TEMPO."],
      description: [
        "Victoire expéditive {monScore}-{scoreAdverse}. {topQuester} a porté l'équipe pendant que {opponentName} cherchait encore sa curve d'encre.",
        "Il va falloir de la glace pour ces chevilles ! Tu as agressé le board en {nbTours} tours sans laisser la moindre fenêtre de respiration.",
        "Le pauvre {opponentName} a dû se demander s'il jouait au même jeu. Ton deck a déroulé sa partition sans aucun accroc.",
        "Quand {topQuester} prend le contrôle comme ça, y'a rien à faire. Un écart de score abyssal qui prouve ta maîtrise du match-up.",
        "Mulligan géré à la perfection. La sortie était fluide, le tempo était lourd, victoire sans trembler."
      ]
    },
    closeWin: {
      title: ["SUR LE FIL DU RASOIR !", "PHOTO-FINISH CARDIAQUE !", "QUEL SPRINT FINAL !", "LE MENTAL DE CHAMPION !", "CLUTCH MOMENT !"],
      description: [
        "La course au lore était irrespirable ! Victoire {monScore}-{scoreAdverse} à l'arrachée. Un seul mauvais trade et ça basculait.",
        "Tu as fait transpirer tout le stade au tour {nbTours}, mais ton {topQuester} a sorti l'action clutch au buzzer !",
        "C'est dans ces games qu'on reconnait les grands joueurs. Tu as tenu la pression malgré le retard pour arracher ce {monScore}-{scoreAdverse}.",
        "Un finish de folie ! L'adversaire pensait avoir sécurisé le lethal, mais ton board management a fait la différence in extremis.",
        "Le genre de partie qui finit sous aspirine. C'était tendu, mais l'efficacité de tes encrages a validé la win."
      ]
    },
    passiveLore: {
      title: ["LA RENTE IMMOBILIÈRE !", "LORE PASSIF, DÉGÂTS ACTIFS.", "LE MONOPOLY LORCANA.", "INVESTISSEMENT LOCATIF."],
      description: [
        "{loreFromLocations} lore générés par tes lieux ! Pendant que {opponentName} s'épuisait sur tes personnages, la rente tombait toute seule.",
        "Une masterclass de gestion spatiale. Laisser tourner les lieux pour {loreFromLocations} lore, c'est du génie tactique pur et simple.",
        "L'adversaire a complètement oublié d'attaquer tes lieux. Ces points gratuits au start-of-turn t'ont offert la partie sur un plateau."
      ]
    },
    topDeckLoss: {
      title: ["LE DÉSERT TACTIQUE.", "PRIÈRE ET TOP DECK.", "SYNDROME DE LA PAGE BLANCHE.", "L'ASPHYXIE TOTALE.", "PANNE SÈCHE."],
      description: [
        "Passer {toursTopDeck} tours la main vide, c'est mortel à ce niveau. Sans Card Advantage, tu es devenu spectateur de ta propre défaite.",
        "Le moteur de pioche a calé sec. Quand tu joues au top deck la moitié de la game, {opponentName} n'a plus qu'à dérouler son plan.",
        "Gros problème de ressources. Tes {toursTopDeck} tours sans options en main t'ont coûté le tempo et le match.",
        "On ne gagne pas sans munitions. Tu as brûlé tes cartes trop vite et la sanction est tombée : {monScore}-{scoreAdverse}.",
        "Il va falloir revoir le ratio de pioche du deck. Tomber à sec aussi vite t'a empêché de répondre aux menaces adverses."
      ]
    },
    inkLeakLoss: {
      title: ["LA FUITE D'ENCRE.", "TEMPÊTE DANS UN VERRE D'EAU.", "GASPILLAGE TOTAL.", "OÙ EST LE TEMPO ?", "L'ÉCONOMIE EN BERNE."],
      description: [
        "{inkFloat} encres flottées sur le match ! C'est beaucoup trop de ressources jetées par la fenêtre. Le tempo est resté au vestiaire.",
        "Avoir de l'encre c'est bien, s'en servir c'est mieux. Tes {inkFloat} encres inutilisées ont offert un boulevard au board adverse.",
        "La curve a complètement déraillé. Tu n'as pas pu rentabiliser tes ressources et {opponentName} en a profité pour creuser l'écart.",
        "Problème d'optimisation majeur. Tes encres ont dormi pendant que l'adversaire mettait une pression monstre sur le lore.",
        "Une défaite {monScore}-{scoreAdverse} qui s'explique par un cruel manque d'impact sur le board malgré un encrier rempli."
      ]
    },
    mulliganLoss: {
      title: ["LE MULLIGAN DE LA PEUR.", "LA BRIQUE AU DÉMARRAGE.", "SORTIE DE PISTE IMMÉDIATE.", "MAUVAISE PIOCHE."],
      description: [
        "Renvoyer {nbMulligan} cartes pour finir avec une brique... La RNG t'a frappé de plein fouet dès le début du match.",
        "Le mulligan t'a crucifié. Difficile d'installer un tempo {pace} quand la main de départ refuse obstinément de coopérer.",
        "Tu as cherché des solutions avec ton mulligan de {nbMulligan}, mais les dieux de la pioche étaient contre toi aujourd'hui."
      ]
    },
    stompLoss: {
      title: ["UNE VRAIE BOUCHERIE...", "LE SEUM EST TOTAL.", "RETOUR AU LOBBY.", "OUTPLAY COMPLET.", "DANS LES CORDES."],
      description: [
        "Défaite sévère {monScore}-{scoreAdverse}. On ne va pas se mentir, tu t'es fait ouvrir en deux. {opponentName} a dicté tout le rythme.",
        "Aïe. Le rouleau compresseur adverse t'a écrasé en {nbTours} tours. Impossible de contester le board face à une telle sortie.",
        "Il n'y a pas eu de match. Tu as encaissé les quêtes sans pouvoir répondre. Une VOD à oublier (ou à analyser en boucle).",
        "L'adversaire a pris le Card et le Lore Advantage instantanément. Tu as passé la partie à courir derrière un train déjà parti.",
        "Aucun tempo, aucune réponse. {topInkedCard} aura beau avoir été encrée {topInkedCount} fois, ça n'a pas suffi pour stabiliser la game."
      ]
    },
    closeLoss: {
      title: ["LA CLIM EN FIN DE MATCH.", "À UN CHEVEU DU HOLD-UP.", "CRUEL, SI CRUEL...", "LE LETHAL MANQUÉ.", "BRAQUAGE RATÉ."],
      description: [
        "Le seum intersidéral ! Défaite {monScore}-{scoreAdverse} sur le fil. Un seul mauvais trade a fait basculer toute la partie.",
        "Tu y as cru jusqu'au bout ! C'était un match de gladiateurs, mais {opponentName} a trouvé l'ouverture juste avant toi.",
        "La course au lore s'est jouée sur des détails infimes. Une défaite frustrante en {nbTours} tours, mais le niveau de jeu était là.",
        "Tu as touché le lethal du bout des doigts. Il a manqué une toute petite goutte de value pour renverser ce {monScore}-{scoreAdverse}.",
        "Terrible finish. L'adversaire a fermé la porte au pire moment. C'est le genre de partie qui va te hanter cette nuit !"
      ]
    },
    control: {
      title: ["DANS LES TRANCHÉES.", "GUERRE D'USURE.", "UN MARATHON MENTAL.", "LA BATAILLE DE L'ATTRITION."],
      description: [
        "{nbTours} tours de pure guerre psychologique. Le match s'est joué sur la gestion millimétrée du Card Advantage et de la fatigue.",
        "Un vrai match d'échecs. Tout s'est joué sur le contrôle du board et la patience. Une partie ultra lente pour les puristes.",
        "Le festival des trades et des removals ! {nbTours} tours où chaque ressource valait de l'or. La fatigue mentale est réelle.",
        "Une partie marathon. {opponentName} a joué la montre et l'attrition, forçant un late-game ultra punitif."
      ]
    },
    defaultWin: {
      title: ["TRAVAIL DE PRO.", "PROPRE, NET ET SANS BAVURE.", "LE PLAN S'EST DÉROULÉ SANS ACCROC.", "VICTOIRE SOLIDE.", "BON TEMPO."],
      description: [
        "Une belle victoire {monScore}-{scoreAdverse}. Tu as imposé ton rythme {pace} et converti proprement tes ressources en lore.",
        "Match très solide. {topQuester} a fait le taf sur le board et {opponentName} n'a jamais pu combler son retard.",
        "Tu as géré ton encre et ta main intelligemment. L'adversaire a été étouffé tactiquement en {nbTours} tours.",
        "Le deck a bien tourné. Ton adversaire a essayé de résister, mais la pression au lore était trop constante.",
        "Victoire logique. Tu as su tirer parti des erreurs adverses tout en maintenant un excellent Card Advantage."
      ]
    },
    defaultLoss: {
      title: ["RÉVEIL DOULOUREUX.", "RETOUR À L'ENTRAÎNEMENT.", "CIRCULEZ, Y'A RIEN À VOIR.", "DÉFAITE TACTIQUE.", "LE TEMPO PERDU."],
      description: [
        "Défaite {monScore}-{scoreAdverse}. Il va falloir analyser la VOD parce que là, l'adversaire a clairement pris le dessus tactiquement.",
        "Le plan de jeu a coincé. Entre les {inkFloat} encres flottées et le manque de présence, la victoire était hors de portée.",
        "Tu as subi le rythme du début à la fin. {opponentName} a mieux exploité ses cartes clés pour plier le match en {nbTours} tours.",
        "La mécanique du deck s'est enrayée. Difficile de l'emporter quand la menace sur le board n'arrive pas à se concrétiser.",
        "Une défaite sèche. Il faudra revoir la gestion des ressources et les décisions de trades sur ce match-up."
      ]
    }
  };

  let scenario = pools.defaultWin;

  if (v.isWin) {
    if (v.monScore >= 20 && v.scoreAdverse === 0) scenario = pools.perfectWin;
    else if (v.scoreAdverse <= 7) scenario = pools.stompWin;
    else if (v.scoreGap <= 3 && v.monScore >= 18) scenario = pools.closeWin;
    else if (v.loreFromLocations >= 4) scenario = pools.passiveLore;
    else scenario = pools.defaultWin;
  } else {
    if (v.toursTopDeck >= 3) scenario = pools.topDeckLoss;
    else if (v.inkFloat >= 10) scenario = pools.inkLeakLoss;
    else if (v.nbMulligan >= 4 && v.nbTours <= 8) scenario = pools.mulliganLoss;
    else if (v.monScore <= 7) scenario = pools.stompLoss;
    else if (v.scoreGap <= 3 && v.scoreAdverse >= 18) scenario = pools.closeLoss;
    else scenario = pools.defaultLoss;
  }

  if (v.nbTours >= 13 && Math.random() > 0.6) {
    scenario = pools.control;
  }

  const vars = { ...v, pace: v.pace };

  return {
    title: clampText(fillTemplate(stablePick(scenario.title, seed), vars), "Lecture du match", 60),
    description: clampText(fillTemplate(stablePick(scenario.description, `${seed}-desc`), vars), "Analyse locale indisponible.", 420),
    source: "local",
  };
}

function buildSystemPrompt() {
  return `Tu es un commentateur eSport Lorcana légendaire et trash-talker.
RÈGLES STRICTES ET ABSOLUES :
1. FORMAT : Renvoie UNIQUEMENT un objet JSON valide : {"title": "...", "description": "..."}.
2. TITLE : Une punchline agressive de 3 à 5 mots MAXIMUM, TOUT EN MAJUSCULES (ex: "CLIMATISATION TOTALE", "LE ROULEAU COMPRESSEUR", "CASSAGE DE REINS").
3. DESCRIPTION : MAXIMUM 2 PHRASES (moins de 150 caractères au total). Va droit au but ! L'interface bug si c'est trop long.
4. TON : Sarcasme pur, jargon TCG (Card Advantage, Tempo, Top Deck, Lethal). INTERDICTION formelle d'être poli (jamais de "Félicitations", "Cependant", ou "Bien joué"). Sois brutal, drôle et sans pitié.`;
}

function buildUserPrompt(body = {}) {
  const v = getBodyContext(body);
  return `Analyse ce match de Lorcana et génère le JSON :
- Résultat : ${v.isWin ? "Victoire" : "Défaite"} ${v.monScore} à ${v.scoreAdverse} contre ${v.opponentName}.
- Durée : ${v.nbTours} tours. Rythme : ${v.pace}.
- Ma carte MVP : ${v.topQuester}.
- Stats notables : ${v.nbMulligan} cartes mulliganées, ${v.inkFloat} encre gaspillée (flottée), ${v.loreFromLocations} lore passif des lieux.`;
}

async function callGroq(body) {
  const systemContent = buildSystemPrompt();
  const userContent = buildUserPrompt(body);
  // CE QU'IL FAUT METTRE (LA CORRECTION) :
const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {

   method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent }
      ],
      temperature: 0.6,
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
    description: clampText(parsed.description, "Analyse indisponible.", 250),
    source: "Coach IA",
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

  try {
    const commentary = await callGroq(body);
    return res.status(200).json(commentary);
  } catch (error) {
    console.warn("Groq failure, fallback to local:", error.message);
    return res.status(200).json({ ...localFallback, reason: "groq_error", debug: error.message });
  }
}