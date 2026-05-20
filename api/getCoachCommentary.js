/**
 * InkSight V128 — Coach Culture DB
 * Drop-in Vercel API route: /api/getCoachCommentary
 *
 * Objectif:
 * - Plus de références culturelles visibles.
 * - Ton plus drôle, flatteur en victoire, sarcastique en défaite.
 * - Sélection conditionnelle: pas de phrase "20-0" si le score n'est pas un vrai 20-0.
 * - Sans appel IA externe: rapide, stable, sans coût API.
 *
 * Frontend attendu:
 * POST /api/getCoachCommentary
 * body: {
 *   monScore, scoreAdverse, nbTours, inkFloat, toursTopDeck, loreFromLocations,
 *   topQuester, opponentName, nbMulligan, isWin, result, scoreLabel,
 *   otp, format, passiveLoreCard, topInkedCard, topThreat
 * }
 */

const MAX_TITLE = 68;
const MAX_DESCRIPTION = 360;

function n(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function s(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function clampText(value, fallback, maxLength) {
  const text = s(value, fallback);
  return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…` : text;
}

function hashString(input = "") {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function rand() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(items, rand) {
  if (!items.length) return null;
  return items[Math.floor(rand() * items.length)] || items[0];
}

function weightedPick(items, rand) {
  if (!items.length) return null;
  const total = items.reduce((sum, item) => sum + Math.max(1, n(item.weight, 1)), 0);
  let roll = rand() * total;
  for (const item of items) {
    roll -= Math.max(1, n(item.weight, 1));
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function normalizeBody(body = {}) {
  const monScore = n(body.monScore ?? body.myScore ?? body.playerScore ?? body.finalMineLore, 0);
  const scoreAdverse = n(body.scoreAdverse ?? body.opponentScore ?? body.finalOppLore, 0);
  const nbTours = n(body.nbTours ?? body.turns ?? body.turnCount ?? body.totalTurns, 0);
  const inkFloat = n(body.inkFloat ?? body.totalInkFloat ?? body.unusedInk, 0);
  const toursTopDeck = n(body.toursTopDeck ?? body.topDeckTurns ?? body.emptyHandTurns, 0);
  const loreFromLocations = n(body.loreFromLocations ?? body.passiveLore ?? body.locationLore, 0);
  const nbMulligan = n(body.nbMulligan ?? body.mulliganCount ?? body.replacedMulligan ?? 0, 0);
  const topQuester = s(body.topQuester ?? body.mvp ?? body.topLoreCard, "votre moteur de Lore");
  const passiveLoreCard = s(body.passiveLoreCard ?? body.topLocation ?? "vos Lieux");
  const opponentName = s(body.opponentName ?? body.opponent ?? "l’adversaire");
  const topInkedCard = s(body.topInkedCard ?? body.mostInkedCard ?? "votre carte sacrifiée");
  const topThreat = s(body.topThreat ?? body.opponentMvp ?? body.menaceAdverse ?? "la menace adverse");
  const format = s(body.format ?? "BO1", "BO1");
  const otp = typeof body.otp === "boolean" ? body.otp : Boolean(body.onThePlay);
  const isWin = typeof body.isWin === "boolean" ? body.isWin : (monScore > scoreAdverse && (monScore >= 20 || s(body.result).toLowerCase().includes("victoire")));
  const scoreDelta = monScore - scoreAdverse;
  const close = Math.abs(scoreDelta) <= 3 || (monScore >= 17 && scoreAdverse >= 17);
  const stomp = Math.abs(scoreDelta) >= 10 || monScore <= 6 || scoreAdverse <= 6;
  const pace = nbTours <= 6 ? "aggro" : nbTours >= 13 ? "control" : "midrange";
  return {
    ...body,
    monScore,
    scoreAdverse,
    nbTours,
    inkFloat,
    toursTopDeck,
    loreFromLocations,
    nbMulligan,
    topQuester,
    passiveLoreCard,
    opponentName,
    topInkedCard,
    topThreat,
    format,
    otp,
    isWin,
    isLoss: !isWin,
    scoreDelta,
    close,
    stomp,
    pace,
    opponentShort: opponentName.length > 18 ? `${opponentName.slice(0, 17).trim()}…` : opponentName,
  };
}

function bucketWeights(ctx) {
  const weights = [];
  const add = (bucket, weight) => weights.push({ bucket, weight });

  if (ctx.isWin && ctx.monScore >= 20 && ctx.scoreAdverse === 0) add("perfectWin", 120);
  if (ctx.isWin && ctx.scoreAdverse <= 5) add("stompWin", 105);
  if (ctx.isWin && ctx.scoreAdverse > 5 && ctx.scoreAdverse <= 14) add("cleanWin", 75);
  if (ctx.isWin && (ctx.close || ctx.scoreAdverse >= 15)) add("closeWin", 95);
  if (ctx.isLoss && ctx.monScore === 0 && ctx.scoreAdverse >= 20) add("zeroScoreLoss", 110);
  if (ctx.isLoss && ctx.monScore <= 6) add("stompLoss", 100);
  if (ctx.isLoss && (ctx.close || ctx.monScore >= 15)) add("closeLoss", 95);
  if (ctx.toursTopDeck >= 4) add("topDeckLoss", ctx.isLoss ? 115 : 70);
  if (ctx.inkFloat >= 15) add("inkLeak", ctx.isLoss ? 110 : 65);
  if (ctx.nbMulligan >= 4) add("mulligan", ctx.isLoss ? 95 : 65);
  if (ctx.nbTours >= 13) add("control", 80);
  if (ctx.nbTours <= 6) add("aggro", 65);
  if (ctx.loreFromLocations >= 4) add("passiveLore", ctx.isWin ? 115 : 80);
  if (ctx.topQuester && ctx.topQuester !== "votre moteur de Lore") add("mvp", 60);
  if (ctx.isWin) add("genericWin", 40);
  if (ctx.isLoss) add("genericLoss", 40);
  add("neutral", 15);
  return weights;
}

const COACH_LINES = [
  // PERFECT / STOMP WINS — sport, foot, Disney, cinéma
  {
    buckets: ["perfectWin", "stompWin"],
    weight: 12,
    ref: "Thierry Roland, France-Brésil 1998",
    title: "On peut mourir tranquille.",
    description: "Victoire nette, score verrouillé, board sous contrôle. {opponentShort} a surtout servi de plot d’entraînement pendant que {topQuester} faisait le travail.",
    sourceLine: "Réf. commentaire football : Thierry Roland, France-Brésil 1998."
  },
  {
    buckets: ["perfectWin", "stompWin"],
    weight: 10,
    ref: "France 98",
    title: "Quel pied !",
    description: "Tu as gagné sur les trois axes : Card Advantage, Ink Advantage et Lore Advantage. {opponentShort} n’a jamais vraiment eu le droit d’entrer dans le match.",
    sourceLine: "Réf. commentaire sportif : finale France-Brésil 1998."
  },
  {
    buckets: ["perfectWin", "stompWin", "cleanWin"],
    weight: 10,
    ref: "football",
    title: "Il n’y a pas eu photo.",
    description: "Le plan était lisible, propre, presque cruel. Tu as curvé, questé, sécurisé le lethal, et {opponentShort} a regardé le match depuis le banc.",
    sourceLine: "Réf. formule classique de commentaire sportif."
  },
  {
    buckets: ["perfectWin", "stompWin"],
    weight: 9,
    ref: "Toy Story",
    title: "Vers l'infini et au-delà.",
    description: "La course au Lore n’était même plus une course. {topQuester} a appuyé sur l’accélérateur et ton adversaire a découvert la vitesse en différé.",
    sourceLine: "Réf. Disney/Pixar : Toy Story."
  },
  {
    buckets: ["perfectWin", "stompWin"],
    weight: 9,
    ref: "Cars",
    title: "Ka-chow.",
    description: "Sortie éclair, tempo propre, lethal sans trembler. Ce n’était pas une partie, c’était une démonstration de conduite sportive.",
    sourceLine: "Réf. Disney/Pixar : Cars."
  },
  {
    buckets: ["perfectWin", "stompWin"],
    weight: 8,
    ref: "Le Roi Lion",
    title: "Longue vie au roi.",
    description: "Tu as pris le board, puis le royaume. {opponentShort} a perdu le tempo au moment exact où ton plan de jeu devenait inévitable.",
    sourceLine: "Réf. Disney : Le Roi Lion."
  },
  {
    buckets: ["stompWin", "cleanWin"],
    weight: 8,
    ref: "Les Tontons flingueurs",
    title: "Façon puzzle.",
    description: "Chaque tour a retiré une pièce de son plan. À la fin, il restait surtout des fragments de board et un lethal proprement emballé.",
    sourceLine: "Réf. cinéma français : Les Tontons flingueurs."
  },
  {
    buckets: ["stompWin", "cleanWin"],
    weight: 7,
    ref: "OSS 117",
    title: "Habile, Bill.",
    description: "Curve solide, ressources propres, pression constante. Rien de spectaculaire, mais exactement ce qu’il faut pour faire paraître l’adversaire très lent.",
    sourceLine: "Réf. comédie française : OSS 117."
  },
  {
    buckets: ["stompWin", "cleanWin"],
    weight: 7,
    ref: "Ratatouille",
    title: "Tout le monde peut curver.",
    description: "Sauf {opponentShort}, visiblement. Tu as servi une partie bien dressée : tempo, value, lethal, addition payée.",
    sourceLine: "Réf. Disney/Pixar : Ratatouille."
  },
  {
    buckets: ["stompWin", "genericWin"],
    weight: 7,
    ref: "Gladiator",
    title: "Divertis ?",
    description: "La foule voulait du spectacle, tu as livré un audit tactique. {topQuester} a pris ses responsabilités et la game n’a pas résisté.",
    sourceLine: "Réf. cinéma : Gladiator."
  },

  // CLEAN WINS
  {
    buckets: ["cleanWin", "genericWin"],
    weight: 10,
    ref: "football",
    title: "C’est clinique.",
    description: "Pas besoin de hurler au miracle : tu as juste mieux séquencé. {nbTours} tours, une curve propre, et un lethal préparé sans panique.",
    sourceLine: "Réf. formule classique de commentaire sportif."
  },
  {
    buckets: ["cleanWin", "genericWin"],
    weight: 9,
    ref: "football",
    title: "Le break est fait.",
    description: "Tu as créé l’écart au bon moment, puis tu l’as protégé. Une victoire solide, construite plus sur le tempo que sur la chance.",
    sourceLine: "Réf. formule classique de commentaire sportif."
  },
  {
    buckets: ["cleanWin", "genericWin"],
    weight: 8,
    ref: "Aladdin",
    title: "Ce rêve bleu.",
    description: "La ligne Saphir a déroulé sans trembler. Pioche, encre, Lore : le tapis volant n’a pas fait de détour.",
    sourceLine: "Réf. Disney : Aladdin."
  },
  {
    buckets: ["cleanWin", "genericWin"],
    weight: 8,
    ref: "Le Livre de la jungle",
    title: "Il en faut peu pour être heureux.",
    description: "Il suffisait de curver correctement et de ne pas offrir le board. Simple, efficace, presque vexant pour {opponentShort}.",
    sourceLine: "Réf. Disney : Le Livre de la jungle."
  },
  {
    buckets: ["cleanWin", "genericWin"],
    weight: 7,
    ref: "Star Wars",
    title: "La Force était là.",
    description: "Pas de top deck miraculeux : juste une vraie maîtrise des ressources. Le côté clair du tempo, en somme.",
    sourceLine: "Réf. pop culture : Star Wars."
  },
  {
    buckets: ["cleanWin", "genericWin"],
    weight: 7,
    ref: "Le Parrain",
    title: "C'est une offre qu'il ne pouvait pas refuser.",
    description: "Tu as proposé un board que {opponentShort} ne pouvait pas refuser : gérer tout de suite ou mourir au Lore deux tours plus tard.",
    sourceLine: "Réf. cinéma : Le Parrain."
  },
  {
    buckets: ["cleanWin"],
    weight: 7,
    ref: "commentaire sportif",
    title: "Il n’a pas tremblé.",
    description: "Money time propre. Tu avais le lethal, tu l’as pris, sans transformer la fin de partie en sketch de mulligan.",
    sourceLine: "Réf. formule sportive : penalty / money time."
  },
  {
    buckets: ["cleanWin"],
    weight: 6,
    ref: "Toy Story",
    title: "J'appelle pas ça voler, j'appelle ça tomber avec panache.",
    description: "Même quand la partie a ralenti, tu as gardé le plan. Ce n’était peut-être pas voler, mais c’était un lethal avec style.",
    sourceLine: "Réf. Disney/Pixar : Toy Story."
  },

  // CLOSE WINS
  {
    buckets: ["closeWin"],
    weight: 12,
    ref: "football 1966",
    title: "Ça l’est maintenant.",
    description: "Ils croyaient que ce n’était pas fini. Puis le dernier point de Lore est tombé. Victoire au forceps, mais victoire quand même.",
    sourceLine: "Réf. commentaire sportif : Kenneth Wolstenholme, Mondial 1966."
  },
  {
    buckets: ["closeWin"],
    weight: 11,
    ref: "Pavard 2018",
    title: "Second poteau Pavaaaaard.",
    description: "La game était tendue, puis l’ouverture est arrivée. Un tour bien séquencé, un lethal qui claque, et {opponentShort} n’a plus revu le ballon.",
    sourceLine: "Réf. commentaire football : Grégoire Margotton, France-Argentine 2018."
  },
  {
    buckets: ["closeWin"],
    weight: 10,
    ref: "Aguero 2012",
    title: "Aguerooooooo.",
    description: "Fin de partie irrespirable : tu as trouvé le lethal au moment exact où tout pouvait basculer. Pas propre, mais mémorable.",
    sourceLine: "Réf. commentaire football : Martin Tyler, Manchester City-QPR 2012."
  },
  {
    buckets: ["closeWin"],
    weight: 9,
    ref: "Star Wars",
    title: "It's a trap!",
    description: "{opponentShort} pensait tenir la course. Mauvaise lecture : tu gardais juste assez de pression pour fermer la porte au dernier tour.",
    sourceLine: "Réf. pop culture : Star Wars."
  },
  {
    buckets: ["closeWin"],
    weight: 9,
    ref: "Jurassic Park",
    title: "La vie trouve toujours un chemin.",
    description: "La partie semblait bloquée, puis ton plan a trouvé un chemin. Un peu sale, très efficace, et franchement difficile à contester.",
    sourceLine: "Réf. cinéma : Jurassic Park."
  },
  {
    buckets: ["closeWin"],
    weight: 8,
    ref: "Les Bronzés",
    title: "sur un malentendu ça peut marcher.",
    description: "Ça pouvait mal finir, mais la fenêtre de lethal était là. Tu as foncé, et pour une fois le plan improbable a marché.",
    sourceLine: "Réf. comédie française : Les Bronzés font du ski."
  },
  {
    buckets: ["closeWin"],
    weight: 8,
    ref: "Nemo",
    title: "Nage droit devant Nemo.",
    description: "Tu as gardé le cap malgré la pression. Pas de panique, pas de détour inutile : juste assez de Lore pour sortir vivant.",
    sourceLine: "Réf. Disney/Pixar : Le Monde de Nemo."
  },
  {
    buckets: ["closeWin"],
    weight: 7,
    ref: "Dirty Dancing",
    title: "Pas dans un coin.",
    description: "Ton lethal n’est pas resté dans un coin. Il est sorti au bon moment, et {opponentShort} n’avait plus assez de board pour répondre.",
    sourceLine: "Réf. cinéma : Dirty Dancing."
  },

  // CLOSE LOSSES
  {
    buckets: ["closeLoss"],
    weight: 12,
    ref: "Thierry Gilardi 2006",
    title: "Pas ça, Zinédine.",
    description: "Tu étais à portée de lethal, puis la game a basculé. Pas aujourd’hui, pas maintenant, pas après cette remontée.",
    sourceLine: "Réf. commentaire football : Thierry Gilardi, finale 2006."
  },
  {
    buckets: ["closeLoss"],
    weight: 11,
    ref: "sport",
    title: "C’est cruel.",
    description: "Défaite courte, mais pas anodine. Le dernier trade, le dernier top deck ou le dernier point de Lore a coûté beaucoup trop cher.",
    sourceLine: "Réf. formule classique de commentaire sportif."
  },
  {
    buckets: ["closeLoss"],
    weight: 10,
    ref: "Star Wars",
    title: "Mauvais pressentiment.",
    description: "La fin sentait le piège, et tu as quand même marché dedans. Il manquait une carte, un trade ou un tour de respiration.",
    sourceLine: "Réf. pop culture : Star Wars."
  },
  {
    buckets: ["closeLoss"],
    weight: 9,
    ref: "Forrest Gump",
    title: "Cours, Forrest, cours.",
    description: "Tu as couru derrière le score jusqu’au bout, mais {opponentShort} avait une foulée d’avance. Frustrant, mais analysable.",
    sourceLine: "Réf. cinéma : Forrest Gump."
  },
  {
    buckets: ["closeLoss"],
    weight: 9,
    ref: "Kaamelott",
    title: "On en a gros.",
    description: "Perdre aussi près du lethal, ça laisse des traces. Le plan était presque là, mais presque ne gagne pas les rondes.",
    sourceLine: "Réf. comédie française : Kaamelott."
  },
  {
    buckets: ["closeLoss"],
    weight: 8,
    ref: "Toy Story",
    title: "Adieu, partenaire.",
    description: "Ton dernier espoir est parti avec la pioche. La game se perd sur un détail, mais le détail s’appelle souvent Card Advantage.",
    sourceLine: "Réf. Disney/Pixar : Toy Story 3."
  },
  {
    buckets: ["closeLoss"],
    weight: 8,
    ref: "football",
    title: "Il fallait tuer.",
    description: "Tu avais une fenêtre pour fermer le match. Tu l’as laissée ouverte, et {opponentShort} a évidemment payé cash.",
    sourceLine: "Réf. formule classique de commentaire sportif."
  },

  // STOMP / ZERO LOSSES
  {
    buckets: ["zeroScoreLoss", "stompLoss"],
    weight: 12,
    ref: "Le Roi Lion",
    title: "Souviens-toi qui tu es.",
    description: "Parce que là, on t’a surtout vu subir. {monScore}-{scoreAdverse}, c’est moins une game qu’un rappel brutal à la théorie des ressources.",
    sourceLine: "Réf. Disney : Le Roi Lion."
  },
  {
    buckets: ["zeroScoreLoss", "stompLoss"],
    weight: 11,
    ref: "Les Tontons flingueurs",
    title: "Ça va faire du vilain.",
    description: "Et ça a fait du vilain. Ton board n’a jamais tenu, ton tempo a disparu, et {opponentShort} a joué seul pendant {nbTours} tours.",
    sourceLine: "Réf. cinéma français : Les Tontons flingueurs."
  },
  {
    buckets: ["zeroScoreLoss", "stompLoss"],
    weight: 10,
    ref: "Terminator 2",
    title: "Hasta la vista, Baby.",
    description: "Ta curve est sortie du match avant toi. Trop peu de pression, trop peu de réponses, beaucoup trop de dégâts au moral.",
    sourceLine: "Réf. cinéma : Terminator 2."
  },
  {
    buckets: ["zeroScoreLoss", "stompLoss"],
    weight: 10,
    ref: "Les Bronzés",
    title: "Oublie que t’as aucune chance.",
    description: "Le deck l’a pris littéralement. Main compliquée, tempo absent, et une sensation de pente noire sans planté du bâton.",
    sourceLine: "Réf. comédie française : Les Bronzés font du ski."
  },
  {
    buckets: ["zeroScoreLoss", "stompLoss"],
    weight: 9,
    ref: "Kaamelott",
    title: "C’est pas faux.",
    description: "Surtout parce qu’il n’y avait pas grand-chose de vrai dans ton plan de jeu. {opponentShort} a pris le board, puis le match.",
    sourceLine: "Réf. comédie française : Kaamelott."
  },
  {
    buckets: ["zeroScoreLoss", "stompLoss"],
    weight: 9,
    ref: "Star Wars",
    title: "Le côté obscur.",
    description: "Tu as vu le côté obscur de ta sortie : pas de curve, pas de board, pas de lethal. Juste une leçon gratuite de tempo.",
    sourceLine: "Réf. pop culture : Star Wars."
  },
  {
    buckets: ["zeroScoreLoss", "stompLoss"],
    weight: 8,
    ref: "La Classe américaine",
    title: "Monde de brick.",
    description: "Rien n’a vraiment respiré dans cette game. Ton Card Advantage s’est évaporé et {opponentShort} a transformé ça en séance de tirs.",
    sourceLine: "Réf. comédie : La Classe américaine."
  },
  {
    buckets: ["zeroScoreLoss", "stompLoss"],
    weight: 8,
    ref: "Le Roi Lion",
    title: "Entouré d’idiots.",
    description: "Ton board avait l’air de chercher une réunion de crise. Mauvais trades, mauvaises fenêtres, et aucune pression durable.",
    sourceLine: "Réf. Disney : Le Roi Lion."
  },
  {
    buckets: ["stompLoss"],
    weight: 8,
    ref: "football",
    title: "La sanction est immédiate.",
    description: "Tu as laissé une faille, {opponentShort} a ouvert l’autoroute. À ce niveau, chaque encre flottée devient une occasion concédée.",
    sourceLine: "Réf. formule classique de commentaire sportif."
  },

  // TOPDECK / CARD ADVANTAGE LOSS
  {
    buckets: ["topDeckLoss"],
    weight: 14,
    ref: "Nemo",
    title: "Plus de nage.",
    description: "{toursTopDeck} tours à sec, c’est beaucoup trop. Sans main, tu ne joues plus au Lorcana : tu regardes ton deck décider à ta place.",
    sourceLine: "Réf. Disney/Pixar : Le Monde de Nemo."
  },
  {
    buckets: ["topDeckLoss"],
    weight: 13,
    ref: "football",
    title: "Sans ballon.",
    description: "On ne gagne pas longtemps sans cartes. {toursTopDeck} tours en top deck mode, et ton Card Advantage a quitté le stade.",
    sourceLine: "Réf. culture football : contrôle du ballon / possession."
  },
  {
    buckets: ["topDeckLoss"],
    weight: 12,
    ref: "Les Dents de la mer",
    title: "Plus gros moteur.",
    description: "Tu avais besoin d’un plus gros moteur de pioche. Là, la main était vide et chaque tour ressemblait à une prière.",
    sourceLine: "Réf. cinéma : Les Dents de la mer."
  },
  {
    buckets: ["topDeckLoss"],
    weight: 11,
    ref: "Star Wars",
    title: "Il n’y a pas d’essai.",
    description: "En top deck mode, il faut faire ou ne pas faire. Ton deck a surtout choisi la troisième option : ne rien donner.",
    sourceLine: "Réf. pop culture : Star Wars / Yoda."
  },
  {
    buckets: ["topDeckLoss"],
    weight: 10,
    ref: "Le Père Noël est une ordure",
    title: "C’est cela, oui.",
    description: "Tu voulais probablement stabiliser la main. Résultat : {toursTopDeck} tours de silence radio et un board adverse qui grossit tranquille.",
    sourceLine: "Réf. comédie française : Le Père Noël est une ordure."
  },
  {
    buckets: ["topDeckLoss"],
    weight: 10,
    ref: "E.T.",
    title: "Main téléphone maison.",
    description: "Elle est partie, et elle n’est pas revenue. Le top deck a pris le volant, ce qui est rarement une bonne stratégie compétitive.",
    sourceLine: "Réf. cinéma : E.T."
  },
  {
    buckets: ["topDeckLoss"],
    weight: 9,
    ref: "Kaamelott",
    title: "On en a gros.",
    description: "Quand la main disparaît pendant {toursTopDeck} tours, le deck ne pilote plus : il subit. Et toi avec.",
    sourceLine: "Réf. comédie française : Kaamelott."
  },
  {
    buckets: ["topDeckLoss"],
    weight: 9,
    ref: "Toy Story",
    title: "Pas de jouet.",
    description: "Tu n’avais plus rien à poser, plus rien à menacer, plus rien à bluffer. Même Woody aurait demandé une pioche de secours.",
    sourceLine: "Réf. Disney/Pixar : Toy Story."
  },

  // INK LEAK / TEMPO
  {
    buckets: ["inkLeak"],
    weight: 14,
    ref: "La Petite Sirène",
    title: "Sous l’océan d’encre.",
    description: "{inkFloat} encres flottées : à ce stade, ce n’est plus une réserve, c’est un aquarium. Le tempo s’est noyé avant le lethal.",
    sourceLine: "Réf. Disney : La Petite Sirène."
  },
  {
    buckets: ["inkLeak"],
    weight: 13,
    ref: "football",
    title: "Ils ont payé cash.",
    description: "Chaque encre non dépensée est une occasion ratée. Avec {inkFloat} encres flottées, ton board a payé la facture plein tarif.",
    sourceLine: "Réf. formule classique de commentaire sportif."
  },
  {
    buckets: ["inkLeak"],
    weight: 12,
    ref: "Aladdin",
    title: "Mille et une encres.",
    description: "Tu avais de la ressource, mais pas le bon tempo pour la convertir. L’encrier brillait, le board beaucoup moins.",
    sourceLine: "Réf. Disney : Aladdin."
  },
  {
    buckets: ["inkLeak"],
    weight: 11,
    ref: "Mission Cléopâtre",
    title: "Pas d'palais, pas d'palais",
    description: "Pas de tempo, pas de board. Tu as empilé l’encre comme des pierres, mais le chantier n’a jamais vraiment livré.",
    sourceLine: "Réf. comédie française : Astérix & Obélix : Mission Cléopâtre."
  },
  
  {
    buckets: ["inkLeak"],
    weight: 10,
    ref: "Cars",
    title: "Frein à main.",
    description: "L’encre était là, mais tu as roulé avec le frein à main. La curve voulait accélérer, le séquençage a dit non.",
    sourceLine: "Réf. Disney/Pixar : Cars."
  },
  {
    buckets: ["inkLeak"],
    weight: 9,
    ref: "Titanic",
    title: "Roi du monde ?",
    description: "Pas vraiment. Avec {inkFloat} encres laissées à quai, ton économie ressemblait plus à un naufrage qu’à une croisière de value.",
    sourceLine: "Réf. cinéma : Titanic."
  },
  {
    buckets: ["inkLeak"],
    weight: 9,
    ref: "football",
    title: "Tempo vendangé.",
    description: "Il fallait convertir la possession en danger. Tu as gardé l’encre, perdu le rythme, puis laissé {opponentShort} respirer.",
    sourceLine: "Réf. vocabulaire football : occasion vendangée / possession stérile."
  },

  // MULLIGAN
  {
    buckets: ["mulligan"],
    weight: 13,
    ref: "Les Bronzés",
    title: "J’y vais, mais j’ai peur.",
    description: "Mulligan de {nbMulligan} cartes : déjà, l’ambiance sentait la station de ski sans visibilité. Ensuite, la curve n’a pas rassuré grand monde.",
    sourceLine: "Réf. comédie française : Les Bronzés font du ski."
  },
  {
    buckets: ["mulligan"],
    weight: 12,
    ref: "Star Wars",
    title: "Mauvais pressentiment.",
    description: "{nbMulligan} cartes renvoyées, et le deck n’a pas vraiment répondu. Le plan semblait fragile avant même le premier vrai trade.",
    sourceLine: "Réf. pop culture : Star Wars."
  },
  {
    buckets: ["mulligan"],
    weight: 11,
    ref: "Kuzco",
    title: "Mauvais levier.",
    description: "Le mulligan a tiré le mauvais levier, Kronk. Derrière, tu as passé la game à réparer une main qui voulait déjà partir.",
    sourceLine: "Réf. Disney : Kuzco."
  },
  {
    buckets: ["mulligan"],
    weight: 10,
    ref: "Kaamelott",
    title: "C’est systématiquement débile.",
    description: "Pas le mulligan en soi : le fait de garder une main sans plan clair. {nbMulligan} changements, mais pas assez de stabilité derrière.",
    sourceLine: "Réf. comédie française : Kaamelott."
  },
  {
    buckets: ["mulligan"],
    weight: 10,
    ref: "Terminator",
    title: "Viens avec moi.",
    description: "Si tu veux vivre, garde une main qui joue au tour 2. Là, la game a commencé avec un panneau danger en grand format.",
    sourceLine: "Réf. cinéma : Terminator."
  },
  {
  buckets: ["mulligan"],
  weight: 9,
  ref: "Astérix & Obélix : Mission Cléopâtre",
  title: "Bonne situation, ça, scribe ?",
  description: "{nbMulligan} cartes changées. C’est une bonne situation, ça ? Non. Le deck a regardé la curve, puis il a demandé un sarcophage.",
  sourceLine: "Réf. directe : Astérix & Obélix : Mission Cléopâtre — « C’est une bonne situation, ça, scribe ? »"
},
  {
    buckets: ["mulligan"],
    weight: 8,
    ref: "Cendrillon",
    title: "Bibbidi-brickidi-boo.",
    description: "Le mulligan devait transformer la citrouille en carrosse. Il a surtout transformé ta main en problème statistique.",
    sourceLine: "Réf. Disney : Cendrillon."
  },

  // CONTROL / LONG GAMES
  {
    buckets: ["control"],
    weight: 13,
    ref: "Nemo",
    title: "Nage droit devant.",
    description: "{nbTours} tours de bataille d’usure. Dans ce genre de game, le Card Advantage n’est pas un bonus : c’est l’oxygène.",
    sourceLine: "Réf. Disney/Pixar : Le Monde de Nemo."
  },
  {
    buckets: ["control"],
    weight: 12,
    ref: "football",
    title: "Dos rond.",
    description: "Longue séquence de contrôle : encaisser, filtrer, attendre la bonne fenêtre. Le match s’est gagné à la patience, pas au bruit.",
    sourceLine: "Réf. formule sportive : faire le dos rond."
  },
  {
    buckets: ["control"],
    weight: 11,
    ref: "Le Seigneur des Anneaux",
    title: "Tu ne passeras pas.",
    description: "Le plan Control a posé la barrière. Board ralenti, ressources étirées, et chaque tour a coûté cher à celui qui perdait l’attrition.",
    sourceLine: "Réf. cinéma : Le Seigneur des Anneaux."
  },
  {
    buckets: ["control"],
    weight: 10,
    ref: "Casablanca",
    title: "Belle amitié.",
    description: "Ton deck et l’attrition ont commencé une belle amitié. {nbTours} tours plus tard, on sait surtout qui avait le meilleur moteur.",
    sourceLine: "Réf. cinéma : Casablanca."
  },
  {
    buckets: ["control"],
    weight: 9,
    ref: "Star Wars",
    title: "Patience de Jedi.",
    description: "Pas de panique, pas d’excès : une game longue demande de choisir ses trades comme ses combats. Ici, chaque erreur restait visible.",
    sourceLine: "Réf. pop culture : Star Wars."
  },
  {
    buckets: ["control"],
    weight: 9,
    ref: "Les Tontons flingueurs",
    title: "C’est du brutal.",
    description: "Pas brutal en vitesse, brutal en usure. Les ressources se sont arrachées tour après tour, jusqu’à ce qu’un moteur fasse enfin la différence.",
    sourceLine: "Réf. cinéma français : Les Tontons flingueurs."
  },

  // PASSIVE LORE / LOCATIONS
  {
    buckets: ["passiveLore"],
    weight: 15,
    ref: "immobilier",
    title: "L’immobilier paie.",
    description: "{loreFromLocations} Lore passif via {passiveLoreCard}. Pendant que {opponentShort} gérait les personnages, tes Lieux encaissaient le loyer.",
    sourceLine: "Réf. interne InkSight : victoire par rente de Lieux."
  },
  {
    buckets: ["passiveLore"],
    weight: 13,
    ref: "Là-haut",
    title: "L’aventure est là-bas.",
    description: "Plus exactement : elle était sur tes Lieux. {loreFromLocations} points passifs, c’est une horloge que l’adversaire a oublié de casser.",
    sourceLine: "Réf. Disney/Pixar : Là-haut."
  },
  {
    buckets: ["passiveLore"],
    weight: 12,
    ref: "Le Roi Lion",
    title: "Le roi du loyer.",
    description: "Ton royaume ne partait même plus à l’aventure : il scorait tout seul. {passiveLoreCard} a transformé le board en facture mensuelle.",
    sourceLine: "Réf. Disney : Le Roi Lion."
  },
  {
    buckets: ["passiveLore"],
    weight: 11,
    ref: "football",
    title: "Il fallait défendre.",
    description: "{opponentShort} a oublié l’essentiel : attaquer la source du danger. {loreFromLocations} Lore passif, et le match s’est verrouillé sans bruit.",
    sourceLine: "Réf. commentaire sportif : erreur de marquage / défense passive."
  },
  {
    buckets: ["passiveLore"],
    weight: 10,
    ref: "Mission Cléopâtre",
    title: "Palais rentable.",
    description: "Cette fois, il y avait bien un palais. Tes Lieux ont fait le boulot de fond pendant que l’adversaire regardait ailleurs.",
    sourceLine: "Réf. comédie française : Astérix & Obélix : Mission Cléopâtre."
  },
  {
    buckets: ["passiveLore"],
    weight: 9,
    ref: "Le Livre de la jungle",
    title: "Il en faut peu pour être heureux.",
    description: "Quelques Lieux, beaucoup de pression invisible. {loreFromLocations} points gratuits, c’est rarement spectaculaire, souvent décisif.",
    sourceLine: "Réf. Disney : Le Livre de la jungle."
  },

  // MVP / CARD SOURCE LORE
  {
    buckets: ["mvp"],
    weight: 12,
    ref: "sport",
    title: "Il a pris ses responsabilités.",
    description: "{topQuester} a porté la ligne de Lore quand il fallait. Pas forcément flashy, mais décisif dans le money time.",
    sourceLine: "Réf. formule classique de commentaire sportif."
  },
  {
    buckets: ["mvp"],
    weight: 11,
    ref: "Toy Story",
    title: "Tu as un ami.",
    description: "Et il s’appelle {topQuester}. La carte a tenu le plan de jeu debout quand la partie demandait une vraie win condition.",
    sourceLine: "Réf. Disney/Pixar : Toy Story."
  },
  {
    buckets: ["mvp"],
    weight: 10,
    ref: "Pavard 2018",
    title: "Second poteau {topQuester}.",
    description: "Le MVP est arrivé dans la surface au bon moment. Une accélération de Lore, et la défense adverse a fini en retard.",
    sourceLine: "Réf. commentaire football : “Second poteau Pavard”."
  },
  {
    buckets: ["mvp"],
    weight: 10,
    ref: "The Dark Knight",
    title: "Pourquoi si sérieux ?",
    description: "{topQuester} a fait le sale boulot avec le sourire. L’adversaire cherchait une réponse, la partie cherchait déjà le générique.",
    sourceLine: "Réf. cinéma : The Dark Knight."
  },
  {
    buckets: ["mvp"],
    weight: 9,
    ref: "Marvel",
    title: "Inévitable.",
    description: "À partir du moment où {topQuester} a commencé à générer du Lore, la trajectoire du match était écrite en gros.",
    sourceLine: "Réf. pop culture : Avengers / Thanos."
  },
  {
    buckets: ["mvp"],
    weight: 9,
    ref: "Le Parrain",
    title: "Offre impossible à refuser.",
    description: "{topQuester} a mis une pression que {opponentShort} ne pouvait pas refuser. Répondre ou perdre : le genre de dilemme qu’on aime.",
    sourceLine: "Réf. cinéma : Le Parrain."
  },

  // AGGRO / FAST
  {
    buckets: ["aggro"],
    weight: 11,
    ref: "Cars",
    title: "Je suis la vitesse.",
    description: "{nbTours} tours, pas le temps de lire les petites lignes. Ton plan aggro a demandé une réponse immédiate ; elle n’est pas venue.",
    sourceLine: "Réf. Disney/Pixar : Cars."
  },
  {
    buckets: ["aggro"],
    weight: 10,
    ref: "football",
    title: "But dès l’engagement.",
    description: "Départ violent, pression directe, tempo sans politesse. Dans ce genre de game, le premier retard devient souvent fatal.",
    sourceLine: "Réf. culture football : pression d’entrée de match."
  },
  {
    buckets: ["aggro"],
    weight: 9,
    ref: "Sonic-like",
    title: "Pas le temps d'niaiser.",
    description: "La game a été trop rapide pour les plans ambitieux. Ici, curver correctement valait plus que toutes les promesses de late game.",
    sourceLine: "Réf. commentaire sportif : rythme / intensité."
  },
  {
    buckets: ["aggro"],
    weight: 8,
    ref: "Les Indestructibles",
    title: "Pas de cape.",
    description: "Pas besoin d’ornements : une sortie courte, directe, létale. Le plan a gagné parce qu’il n’a pas essayé d’être malin.",
    sourceLine: "Réf. Disney/Pixar : Les Indestructibles."
  },

  // GENERIC LOSSES
  {
    buckets: ["genericLoss"],
    weight: 10,
    ref: "football",
    title: "Le tournant du match.",
    description: "Il y a eu un moment où la partie a changé de propriétaire. Retrouve ce tour : c’est probablement là que le tempo s’est échappé.",
    sourceLine: "Réf. formule classique de commentaire sportif."
  },
  {
    buckets: ["genericLoss"],
    weight: 9,
    ref: "Dumbo",
    title: "Ce qui te plombe.",
    description: "La bonne nouvelle : les erreurs se recyclent en apprentissage. La mauvaise : cette game en fournit un joli stock.",
    sourceLine: "Réf. Disney : Dumbo, idée de transformation de la faiblesse en levier."
  },
  {
    buckets: ["genericLoss"],
    weight: 9,
    ref: "Mission Cléopâtre",
    title: "Il est bizarre, ce sol.",
    description: "Quelque chose clochait dans ta ligne de jeu. Curve, trades, pression : la base semblait instable avant même le dernier tour.",
    sourceLine: "Réf. comédie française : Astérix & Obélix : Mission Cléopâtre."
  },
  {
    buckets: ["genericLoss"],
    weight: 8,
    ref: "OSS 117",
    title: "Non je ne crois pas non.Pas envie.",
    description: "Le deck n’avait visiblement pas envie de curver aujourd’hui. Et sans tempo, même les bonnes cartes ressemblent à des excuses.",
    sourceLine: "Réf. comédie française : OSS 117."
  },
  {
    buckets: ["genericLoss"],
    weight: 8,
    ref: "Star Wars",
    title: "Rejoins le côté analyse.",
    description: "La défaite est moche, mais lisible : perte de rythme, pression insuffisante, et quelques choix qui méritent un replay au ralenti.",
    sourceLine: "Réf. pop culture : Star Wars."
  },
  {
    buckets: ["genericLoss"],
    weight: 7,
    ref: "La Cité de la peur",
    title: "Vous bluffez.",
    description: "Tu as essayé de représenter une menace que ton board ne montrait pas vraiment. {opponentShort} n’a pas acheté le bluff.",
    sourceLine: "Réf. comédie française : La Cité de la peur."
  },

  // GENERIC WINS
  {
    buckets: ["genericWin"],
    weight: 10,
    ref: "sport",
    title: "Ils ont fait le boulot.",
    description: "Pas forcément spectaculaire, mais très propre. Tu as converti tes ressources en pression, puis la pression en résultat.",
    sourceLine: "Réf. formule classique de commentaire sportif."
  },
  {
    buckets: ["genericWin"],
    weight: 9,
    ref: "Mulan",
    title: "Comme un homme.",
    description: "La game demandait de la discipline : bonne curve, bons trades, bon timing. Tu as coché les cases sans te raconter d’histoire.",
    sourceLine: "Réf. Disney : Mulan."
  },
  {
    buckets: ["genericWin"],
    weight: 9,
    ref: "Le Roi Lion",
    title: "Hakuna Matata.",
    description: "Aucun souci majeur : tu as gardé le tempo et transformé chaque fenêtre en Lore. Pas parfait, mais largement suffisant.",
    sourceLine: "Réf. Disney : Le Roi Lion."
  },
  {
    buckets: ["genericWin"],
    weight: 8,
    ref: "Kaamelott",
    title: "Le gras, c’est la value.",
    description: "Beaucoup de ressources, beaucoup de présence, et assez de matière pour étouffer la réponse adverse. Value bien lourde, victoire logique.",
    sourceLine: "Réf. comédie française : Kaamelott."
  },
  {
    buckets: ["genericWin"],
    weight: 8,
    ref: "Aladdin",
    title: "Prince du tempo.",
    description: "Tu n’as pas juste gagné la course au Lore : tu as imposé le rythme. {opponentShort} a joué en réaction trop longtemps.",
    sourceLine: "Réf. Disney : Aladdin."
  },

  // NEUTRAL / FALLBACK
  {
    buckets: ["neutral"],
    weight: 6,
    ref: "analyse",
    title: "Lecture du match.",
    description: "La partie mérite surtout une lecture froide : score {monScore}-{scoreAdverse}, {nbTours} tours, {inkFloat} encres flottées. Commence par identifier le tour où le tempo change.",
    sourceLine: "Réf. InkSight : fallback analytique."
  },
  {
    buckets: ["neutral"],
    weight: 5,
    ref: "sport",
    title: "Match à revoir.",
    description: "Il y a assez de signaux pour bosser : curve, Card Advantage, conversion du Lore. Le replay a probablement plus à dire que le score.",
    sourceLine: "Réf. formule d’analyse post-match."
  }
];

const EXTRA_VARIATIONS = [
  // These are compact extra lines, mostly original allusions, used to multiply variety without bloating UI.
  ["stompWin", "Climatisation totale.", "La salle a perdu trois degrés. {opponentShort} a subi la pression, le tempo et le générique de fin.", "Réf. argot sportif : climatisation d’un stade."],
  ["stompWin", "Promenade de santé.", "Ton board a avancé sans opposition sérieuse. À ce rythme, même le mulligan avait l’air confiant.", "Réf. commentaire sportif : domination sans danger."],
  ["cleanWin", "Victoire chirurgicale.", "Pas de miracle, juste de la précision. Tes ressources ont été converties proprement, et le lethal est arrivé à l’heure.", "Réf. formule sportive : précision chirurgicale."],
  ["closeWin", "Photo-finish.", "La course au Lore s’est jouée au dernier souffle. Tu gagnes, mais le replay mérite une vérification des trades.", "Réf. vocabulaire sportif : arrivée à la photo-finish."],
  ["closeLoss", "À un Lore près.", "La game ne s’est pas effondrée : elle t’a échappé. Ce sont les plus rageantes, donc les plus utiles à analyser.", "Réf. vocabulaire TCG : lethal manqué."],
  ["stompLoss", "Sortie de route.", "La curve n’a jamais retrouvé la voie rapide. {opponentShort} a pris le volant et tu as regardé le tableau de bord brûler.", "Réf. commentaire sportif : erreur fatale."],
  ["topDeckLoss", "Page blanche.", "Sans main, chaque tour devient une loterie. Et aujourd’hui, la loterie avait visiblement d’autres projets.", "Réf. concept TCG : top deck mode."],
  ["inkLeak", "Fuite d’encre.", "{inkFloat} encres inutilisées, c’est une fuite industrielle. La ressource était là ; la conversion, beaucoup moins.", "Réf. concept TCG : Ink Advantage mal converti."],
  ["mulligan", "Main sous enquête.", "Le mulligan voulait sauver la sortie, mais le dossier reste épais. À revoir avant de blâmer uniquement la pioche.", "Réf. vocabulaire d’audit tactique."],
  ["control", "Bataille de tranchées.", "{nbTours} tours, des ressources partout, et une seule question : qui a craqué le premier sur le Card Advantage ?", "Réf. commentaire sportif : match fermé / usure."],
  ["passiveLore", "Loyer impayable.", "{passiveLoreCard} a encaissé en silence. {loreFromLocations} Lore passif, c’est une dette que l’adversaire n’a jamais remboursée.", "Réf. InkSight : rente immobilière des Lieux."],
  ["mvp", "MVP assumé.", "{topQuester} a porté le plan au bon moment. Quand une carte transforme le tempo en Lore, on note son nom.", "Réf. vocabulaire sportif : homme du match."],
  ["genericWin", "Contrat rempli.", "Ce n’était pas toujours flamboyant, mais c’était efficace. Et en tournoi, efficace bat souvent spectaculaire.", "Réf. analyse compétitive."],
  ["genericLoss", "Replay obligatoire.", "La défaite n’est pas seulement dans le score. Elle est probablement cachée dans deux décisions de séquençage.", "Réf. analyse post-match."]
].map((line, index) => ({
  buckets: [line[0]],
  weight: 7,
  ref: "variation",
  title: line[1],
  description: line[2],
  sourceLine: line[3],
  id: `extra_${index + 1}`
}));

const ALL_LINES = [...COACH_LINES, ...EXTRA_VARIATIONS].map((line, index) => ({
  ...line,
  id: line.id || `coach_v128_${String(index + 1).padStart(3, "0")}`,
}));

function template(str, ctx) {
  return String(str || "").replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    const value = ctx[key];
    if (value === undefined || value === null || value === "") return "";
    return String(value);
  }).replace(/\s+/g, " ").trim();
}

function enrichDescription(description, ctx) {
  const text = template(description, ctx);
  const extras = [];

  if (ctx.nbTours > 0 && !/tour/i.test(text)) extras.push(`${ctx.nbTours} tours`);
  if (ctx.inkFloat >= 12 && !/encre/i.test(text)) extras.push(`${ctx.inkFloat} encres flottées`);
  if (ctx.toursTopDeck >= 4 && !/main|top deck|carte/i.test(text)) extras.push(`${ctx.toursTopDeck} tours à sec`);
  if (ctx.loreFromLocations >= 4 && !/lieu|passif|loyer|immobilier/i.test(text)) extras.push(`${ctx.loreFromLocations} Lore passif`);

  if (!extras.length) return text;
  return `${text} Signal clé : ${extras.join(" · ")}.`;
}

function chooseDominantBucket(ctx, rand) {
  // Priorité volontairement stricte: on ne veut plus de titre "joli" mais hors-sujet.
  // Les métriques les plus explicatives passent avant les catégories génériques.
  if (ctx.isLoss) {
    if (ctx.monScore === 0 && ctx.scoreAdverse >= 20) return "zeroScoreLoss";
    if (ctx.toursTopDeck >= 4) return "topDeckLoss";
    if (ctx.inkFloat >= 15) return "inkLeak";
    if (ctx.nbMulligan >= 4) return "mulligan";
    if (ctx.close || ctx.monScore >= 15) return "closeLoss";
    if (ctx.monScore <= 6 || ctx.scoreDelta <= -10) return "stompLoss";
    if (ctx.nbTours >= 13) return "control";
    return "genericLoss";
  }

  if (ctx.isWin) {
    if (ctx.monScore >= 20 && ctx.scoreAdverse === 0) return "perfectWin";
    if (ctx.scoreAdverse <= 5 || ctx.scoreDelta >= 12) return "stompWin";
    if (ctx.loreFromLocations >= 4) return "passiveLore";
    if (ctx.close || ctx.scoreAdverse >= 15) return "closeWin";
    if (ctx.nbTours >= 13) return "control";
    if (ctx.nbTours <= 6) return "aggro";
    if (ctx.topQuester && ctx.topQuester !== "votre moteur de Lore" && rand() < 0.35) return "mvp";
    return "cleanWin";
  }

  if (ctx.loreFromLocations >= 4) return "passiveLore";
  if (ctx.toursTopDeck >= 4) return "topDeckLoss";
  if (ctx.inkFloat >= 15) return "inkLeak";
  return "neutral";
}

function getCandidateLines(ctx, rand) {
  const weightedBuckets = bucketWeights(ctx);
  const chosenBucket = chooseDominantBucket(ctx, rand);

  let candidates = ALL_LINES.filter((line) => line.buckets.includes(chosenBucket));

  // Si un bucket est pauvre, on ajoute des buckets compatibles, mais sans perdre le sujet dominant.
  if (candidates.length < 6) {
    const bucketNames = weightedBuckets.map((b) => b.bucket);
    candidates = ALL_LINES.filter((line) => line.buckets.includes(chosenBucket) || line.buckets.some((bucket) => bucketNames.includes(bucket)));
  }

  // Encourage real references most of the time.
  const referenceCandidates = candidates.filter((line) => line.sourceLine && !line.sourceLine.includes("fallback"));
  const useReference = rand() < 0.86;
  if (useReference && referenceCandidates.length) return { bucket: chosenBucket, candidates: referenceCandidates };

  return { bucket: chosenBucket, candidates: candidates.length ? candidates : ALL_LINES.filter((line) => line.buckets.includes("neutral")) };
}

function buildSeed(ctx) {
  const raw = [
    ctx.replayId,
    ctx.matchId,
    ctx.scoreLabel,
    ctx.opponentName,
    ctx.monScore,
    ctx.scoreAdverse,
    ctx.nbTours,
    ctx.inkFloat,
    ctx.toursTopDeck,
    ctx.loreFromLocations,
    ctx.topQuester,
    ctx.nbMulligan,
  ].filter((v) => v !== undefined && v !== null).join("|");
  return hashString(raw || JSON.stringify(ctx));
}

export function generateLocalCoachCommentary(body = {}) {
  const ctx = normalizeBody(body);
  const seed = buildSeed(ctx);
  const rand = mulberry32(seed);

  const { bucket, candidates } = getCandidateLines(ctx, rand);
  const line = weightedPick(candidates, rand) || ALL_LINES[ALL_LINES.length - 1];

  const title = clampText(template(line.title, ctx), "Lecture du match", MAX_TITLE);
  const description = clampText(enrichDescription(line.description, ctx), "Analyse indisponible.", MAX_DESCRIPTION);
  const sourceLine = clampText(template(line.sourceLine || "", ctx), "", 180);

  return {
    title,
    description,
    sourceLine,
    source: "Coach DB Culture V128",
    bucket,
    tone: line.buckets?.includes("genericLoss") || ctx.isLoss ? "sarcastic" : "sport",
    referenceId: line.id,
    debug: {
      score: `${ctx.monScore}-${ctx.scoreAdverse}`,
      bucket,
      seed,
      ref: line.ref,
    }
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      name: "InkSight Coach Culture DB",
      version: "v128",
      entries: ALL_LINES.length,
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const commentary = generateLocalCoachCommentary(body);
    return res.status(200).json(commentary);
  } catch (error) {
    console.error("getCoachCommentary v128 error:", error);
    return res.status(200).json({
      title: "Coach muet.",
      description: "Le diagnostic local a raté son top deck. Le replay reste analysable, mais le commentaire a pris un carton rouge technique.",
      sourceLine: "Fallback InkSight.",
      source: "Coach DB Culture V128",
      reason: "local_error",
      debug: error?.message || String(error),
    });
  }
}
