/**
 * InkSight V129.2 — Coach Culture DB
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
    title: "Je crois qu'après avoir vu ça, on peut mourir tranquille.",
    description: "Enfin, le plus tard possible, mais on peut ! Victoire nette, score verrouillé, board sous contrôle. {opponentShort} a surtout servi de plot d’entraînement pendant que {topQuester} faisait le travail.",
    sourceLine: "Réf. commentaire football : Thierry Roland, France-Brésil 1998."
  },
  {
    buckets: ["perfectWin", "stompWin"],
    weight: 10,
    ref: "France 98",
    title: "Ah quel pied ! Ah quel pied ! Oh putain !",
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
    title: "Vers l'infini, et au-delà !",
    description: "La course au Lore n’était même plus une course. {topQuester} a appuyé sur l’accélérateur et ton adversaire a découvert la vitesse en différé.",
    sourceLine: "Réf. Disney/Pixar : Toy Story."
  },
  {
    buckets: ["perfectWin", "stompWin"],
    weight: 9,
    ref: "Cars",
    title: "Vitesse. Je suis rapide. Ka-chow !",
    description: "Sortie éclair, tempo propre, lethal sans trembler. Ce n’était pas une partie, c’était une démonstration de Piston Cup.",
    sourceLine: "Réf. Disney/Pixar : Cars."
  },
  {
    buckets: ["perfectWin", "stompWin"],
    weight: 8,
    ref: "Le Roi Lion",
    title: "Longue vie... au roi.",
    description: "Tu as lâché {opponentShort} dans le ravin des gnous. Il a perdu le tempo au moment exact où ton plan de jeu devenait inévitable.",
    sourceLine: "Réf. Disney : Le Roi Lion."
  },
  {
    buckets: ["stompWin", "cleanWin"],
    weight: 8,
    ref: "Les Tontons flingueurs",
    title: "On va le dynamiter, le disperser, le ventiler !",
    description: "Façon puzzle ! Chaque tour a retiré une pièce de son plan. À la fin, il restait surtout des fragments de board et un lethal proprement emballé.",
    sourceLine: "Réf. cinéma français : Les Tontons flingueurs."
  },
  {
    buckets: ["stompWin", "cleanWin"],
    weight: 7,
    ref: "OSS 117",
    title: "Habile, Bill.",
    description: "J'aime me beurrer la biscotte avec un bon lethal. Curve solide, ressources propres, pression constante. Exactement ce qu’il faut pour faire paraître l’adversaire très lent.",
    sourceLine: "Réf. comédie française : OSS 117."
  },
  {
    buckets: ["stompWin", "cleanWin"],
    weight: 7,
    ref: "Ratatouille",
    title: "Tout le monde peut cuisiner.",
    description: "Mais tout le monde ne peut pas curver comme ça ! Tu as servi une partie bien dressée : tempo, value, lethal, addition payée pour {opponentShort}.",
    sourceLine: "Réf. Disney/Pixar : Ratatouille."
  },
  {
    buckets: ["stompWin", "genericWin"],
    weight: 7,
    ref: "Gladiator",
    title: "N'êtes-vous pas divertis ?!",
    description: "Est-ce que vous n'êtes pas là pour ça ?! La foule voulait du spectacle, tu as livré un audit tactique. {topQuester} a pris ses responsabilités et la game a plié.",
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
    title: "Ce rêve bleeeeeeu !",
    description: "La ligne de Lore a déroulé sans trembler. Pioche, encre, pression : le tapis volant n’a fait aucun détour.",
    sourceLine: "Réf. Disney : Aladdin."
  },
  {
    buckets: ["cleanWin", "genericWin"],
    weight: 8,
    ref: "Le Livre de la jungle",
    title: "Il en faut peu pour être heureux.",
    description: "Vraiment très peu pour être heureux ! Il suffisait de curver correctement et de ne pas offrir le board. Simple, efficace, vexant pour {opponentShort}.",
    sourceLine: "Réf. Disney : Le Livre de la jungle."
  },
  {
    buckets: ["cleanWin", "genericWin"],
    weight: 7,
    ref: "Star Wars",
    title: "Que la Force soit avec toi.",
    description: "Et elle y était. Pas de top deck miraculeux : juste une vraie maîtrise des ressources. Le côté clair du tempo, en somme.",
    sourceLine: "Réf. pop culture : Star Wars."
  },
  {
    buckets: ["cleanWin", "genericWin"],
    weight: 7,
    ref: "Le Parrain",
    title: "Je vais lui faire une offre qu'il ne pourra pas refuser.",
    description: "Et {opponentShort} n'a pas pu la refuser. Gérer le board tout de suite ou mourir au Lore deux tours plus tard : l'étau était parfait.",
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
    title: "C'est pas voler, c'est tomber avec panache.",
    description: "Même quand la partie a ralenti, tu as gardé le plan. Buzz l'Éclair approuve ce lethal qui a fini par toucher sa cible avec style.",
    sourceLine: "Réf. Disney/Pixar : Toy Story."
  },

  // CLOSE WINS
  {
    buckets: ["closeWin"],
    weight: 12,
    ref: "football 1966",
    title: "They think it's all over... it is now!",
    description: "Ils croyaient que ce n’était pas fini. Puis le dernier point de Lore est tombé. Victoire au forceps, mais victoire quand même.",
    sourceLine: "Réf. commentaire sportif : Kenneth Wolstenholme, Mondial 1966."
  },
  {
    buckets: ["closeWin"],
    weight: 11,
    ref: "Pavard 2018",
    title: "Second poteau {topQuester} !!!",
    description: "Je ne le crois pas ! La game était tendue, puis la frappe est partie de nulle part. Un lethal qui claque, et {opponentShort} n’a plus revu le ballon.",
    sourceLine: "Réf. commentaire football : Grégoire Margotton, France-Argentine 2018."
  },
  {
    buckets: ["closeWin"],
    weight: 10,
    ref: "Aguero 2012",
    title: "AGUEROOOOOOOO !!!",
    description: "Je vous jure que vous ne reverrez jamais rien de tel ! Fin de partie irrespirable : tu as trouvé le lethal au moment exact où tout basculait.",
    sourceLine: "Réf. commentaire football : Martin Tyler, Manchester City-QPR 2012."
  },
  {
    buckets: ["closeWin"],
    weight: 9,
    ref: "Star Wars",
    title: "It's a trap !",
    description: "{opponentShort} pensait tenir la course. Mauvaise lecture : l'Amiral Ackbar avait prévenu, tu gardais juste assez de pression pour fermer la porte au dernier tour.",
    sourceLine: "Réf. pop culture : Star Wars."
  },
  {
    buckets: ["closeWin"],
    weight: 9,
    ref: "Jurassic Park",
    title: "La vie trouve toujours un chemin.",
    description: "Le lethal aussi. La partie semblait totalement bloquée, puis ton plan a percé l'enclos. Un peu sale, très efficace, et impossible à contester.",
    sourceLine: "Réf. cinéma : Jurassic Park."
  },
  {
    buckets: ["closeWin"],
    weight: 8,
    ref: "Les Bronzés",
    title: "Oublie que t'as aucune chance, vas-y, fonce !",
    description: "Sur un malentendu, ça peut marcher. Et bingo : la fenêtre de lethal était minuscule, tu as forcé le destin et le plan improbable a payé.",
    sourceLine: "Réf. comédie française : Les Bronzés font du ski."
  },
  {
    buckets: ["closeWin"],
    weight: 8,
    ref: "Nemo",
    title: "Nage droit devant toi, nage droit devant toi...",
    description: "Tu as gardé le cap malgré la pression. Pas de panique, pas de détour inutile : juste assez de Lore pour sortir vivant du filet.",
    sourceLine: "Réf. Disney/Pixar : Le Monde de Nemo."
  },
  {
    buckets: ["closeWin"],
    weight: 7,
    ref: "Dirty Dancing",
    title: "On ne laisse pas Bébé dans un coin.",
    description: "Ton lethal n’est pas resté dans un coin. Il est sorti au milieu de la piste au bon moment, et {opponentShort} n’avait plus le rythme pour répondre.",
    sourceLine: "Réf. cinéma : Dirty Dancing."
  },

  // CLOSE LOSSES
  {
    buckets: ["closeLoss"],
    weight: 12,
    ref: "Thierry Gilardi 2006",
    title: "Oh Zinédine, pas ça... Pas ça Zinédine !",
    description: "Pas après tout ce que tu as fait ! Tu étais à portée de lethal, puis la game a basculé sur un coup de tête. La défaite la plus douloureuse.",
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
    title: "J'ai un très mauvais pressentiment.",
    description: "La fin sentait le piège à plein nez, et tu as quand même marché dedans. Il manquait une carte, un trade ou un simple tour de respiration.",
    sourceLine: "Réf. pop culture : Star Wars."
  },
  {
    buckets: ["closeLoss"],
    weight: 9,
    ref: "Forrest Gump",
    title: "Cours Forrest, cours !",
    description: "Tu as couru derrière le score jusqu’au bout, mais {opponentShort} courait juste un peu plus vite. Frustrant, mais la remontée était belle.",
    sourceLine: "Réf. cinéma : Forrest Gump."
  },
  {
    buckets: ["closeLoss"],
    weight: 9,
    ref: "Kaamelott",
    title: "On en a gros, Sire !",
    description: "Perdre aussi près du lethal, ça laisse des traces sur le moral des troupes. Le plan était presque là, mais \"presque\" ne rapporte aucun point.",
    sourceLine: "Réf. comédie française : Kaamelott."
  },
  {
    buckets: ["closeLoss"],
    weight: 8,
    ref: "Toy Story",
    title: "Adieu, partenaire.",
    description: "Ton dernier espoir est parti avec la pioche, direction la décharge. La game se perd sur un détail qui s'appelle souvent le Card Advantage.",
    sourceLine: "Réf. Disney/Pixar : Toy Story 3."
  },
  {
    buckets: ["closeLoss"],
    weight: 8,
    ref: "football",
    title: "Il fallait tuer le match.",
    description: "Tu avais une fenêtre béante pour fermer la partie. Tu l’as laissée ouverte, et {opponentShort} a logiquement mis le but en contre-attaque.",
    sourceLine: "Réf. formule classique de commentaire sportif."
  },

  // STOMP / ZERO LOSSES
  {
    buckets: ["zeroScoreLoss", "stompLoss"],
    weight: 12,
    ref: "Le Roi Lion",
    title: "Simba... Tu m'as oublié.",
    description: "Parce que là, on t’a surtout vu subir. {monScore}-{scoreAdverse}, c’est moins une game qu’un rappel brutal à la théorie de la chaîne alimentaire.",
    sourceLine: "Réf. Disney : Le Roi Lion."
  },
  {
    buckets: ["zeroScoreLoss", "stompLoss"],
    weight: 11,
    ref: "Les Tontons flingueurs",
    title: "Touche pas au grisbi, salope !",
    description: "Et ça a fait du vilain. Ton board s'est fait dynamiter, ton tempo a disparu, et {opponentShort} a joué tout seul pendant {nbTours} tours.",
    sourceLine: "Réf. cinéma français : Les Tontons flingueurs."
  },
  {
    buckets: ["zeroScoreLoss", "stompLoss"],
    weight: 10,
    ref: "Terminator 2",
    title: "Hasta la vista, baby.",
    description: "Ta curve s'est fait liquider dans la lave. Trop peu de pression, trop peu de réponses, et beaucoup trop de dégâts structurels.",
    sourceLine: "Réf. cinéma : Terminator 2."
  },
  {
    buckets: ["zeroScoreLoss", "stompLoss"],
    weight: 10,
    ref: "Les Bronzés",
    title: "Quand tu te plantes le bâton...",
    description: "Tu te plantes le bâton ! Main compliquée, tempo absent, et une sensation de pente noire verglacée de bout en bout.",
    sourceLine: "Réf. comédie française : Les Bronzés font du ski."
  },
  {
    buckets: ["zeroScoreLoss", "stompLoss"],
    weight: 9,
    ref: "Kaamelott",
    title: "C'est pas faux.",
    description: "Surtout parce qu’il n’y avait pas grand-chose de vrai dans ton plan de jeu. Perceval aurait mieux géré les trades que ça.",
    sourceLine: "Réf. comédie française : Kaamelott."
  },
  {
    buckets: ["zeroScoreLoss", "stompLoss"],
    weight: 9,
    ref: "Star Wars",
    title: "La puissance du côté obscur.",
    description: "Tu as subi les éclairs de Force en plein visage : pas de curve, pas de board, pas de lethal. Juste une leçon magistrale de tempo.",
    sourceLine: "Réf. pop culture : Star Wars."
  },
  {
    buckets: ["zeroScoreLoss", "stompLoss"],
    weight: 8,
    ref: "La Classe américaine",
    title: "Monde de merde.",
    description: "Rien n’a vraiment respiré dans cette game. George Abitbol lui-même n'aurait pas trouvé de Card Advantage dans ce désastre.",
    sourceLine: "Réf. comédie : La Classe américaine."
  },
  {
    buckets: ["zeroScoreLoss", "stompLoss"],
    weight: 8,
    ref: "Le Roi Lion",
    title: "Je suis entouré d'idiots.",
    description: "C'est exactement ce que ton deck a dû penser de ton mulligan. Mauvais trades, mauvaises fenêtres, et aucune pression durable.",
    sourceLine: "Réf. Disney : Le Roi Lion."
  },
  {
    buckets: ["stompLoss"],
    weight: 8,
    ref: "football",
    title: "La sanction est immédiate.",
    description: "Tu as laissé une faille, {opponentShort} s'est engouffré. À ce niveau, chaque encre flottée se paie cash sur le tableau d'affichage.",
    sourceLine: "Réf. formule classique de commentaire sportif."
  },

  // TOPDECK / CARD ADVANTAGE LOSS
  {
    buckets: ["topDeckLoss"],
    weight: 14,
    ref: "Nemo",
    title: "Il a touché la barque !",
    description: "Et paf, kidnappé. {toursTopDeck} tours à sec, c’est beaucoup trop long. Sans main, tu regardes le dentiste jouer à ta place.",
    sourceLine: "Réf. Disney/Pixar : Le Monde de Nemo."
  },
  {
    buckets: ["topDeckLoss"],
    weight: 13,
    ref: "football",
    title: "Ils courent après le ballon.",
    description: "On ne gagne pas sans la possession. {toursTopDeck} tours en top deck mode, ton Card Advantage est resté dans les vestiaires.",
    sourceLine: "Réf. culture football : contrôle du ballon / possession."
  },
  {
    buckets: ["topDeckLoss"],
    weight: 12,
    ref: "Les Dents de la mer",
    title: "Il va nous falloir un plus gros bateau.",
    description: "Ou un plus gros moteur de pioche. La main était vide, le requin rodait, et chaque tour ressemblait à un appel de détresse.",
    sourceLine: "Réf. cinéma : Les Dents de la mer."
  },
  {
    buckets: ["topDeckLoss"],
    weight: 11,
    ref: "Star Wars",
    title: "Fais-le, ou ne le fais pas. Il n'y a pas d'essai.",
    description: "En top deck, ton deck a choisi de ne pas le faire. Yoda serait très déçu de la Force qui émanait de tes pioches.",
    sourceLine: "Réf. pop culture : Star Wars / Yoda."
  },
  {
    buckets: ["topDeckLoss"],
    weight: 10,
    ref: "Le Père Noël est une ordure",
    title: "C'est cela oui...",
    description: "Tu voulais stabiliser la main avec la prochaine carte ? C'est cela oui... Résultat : {toursTopDeck} tours de misère absolue.",
    sourceLine: "Réf. comédie française : Le Père Noël est une ordure."
  },
  {
    buckets: ["topDeckLoss"],
    weight: 10,
    ref: "E.T.",
    title: "Main téléphone maison.",
    description: "Ta pioche est partie loin, et elle n’est jamais revenue. Le top deck absolu a pris les commandes de la bicyclette.",
    sourceLine: "Réf. cinéma : E.T."
  },
  {
    buckets: ["topDeckLoss"],
    weight: 9,
    ref: "Kaamelott",
    title: "J'apprécie les fruits au sirop.",
    description: "C'est à peu près tout ce qu'il te restait à dire après {toursTopDeck} tours sans rien jouer. Subir en silence n'a jamais été une stratégie.",
    sourceLine: "Réf. comédie française : Kaamelott."
  },
  {
    buckets: ["topDeckLoss"],
    weight: 9,
    ref: "Toy Story",
    title: "Tu es un jouet !!!",
    description: "Tu n’avais plus rien à poser, plus rien à menacer. Même Woody aurait réclamé de retourner dans sa boîte d'origine.",
    sourceLine: "Réf. Disney/Pixar : Toy Story."
  },

  // INK LEAK / TEMPO
  {
    buckets: ["inkLeak"],
    weight: 14,
    ref: "La Petite Sirène",
    title: "Sous l'océan... Sous l'océan...",
    description: "{inkFloat} encres flottées : à ce stade, ce n’est plus une réserve, c’est Atlantica. Le tempo a fini complètement noyé.",
    sourceLine: "Réf. Disney : La Petite Sirène."
  },
  {
    buckets: ["inkLeak"],
    weight: 13,
    ref: "football",
    title: "Ils ont vendangé ! Oh c'est vendangé !",
    description: "Chaque encre non dépensée est une frappe à côté du cadre. Avec {inkFloat} encres flottées, tu as raté la cage vide.",
    sourceLine: "Réf. formule classique de commentaire sportif."
  },
  {
    buckets: ["inkLeak"],
    weight: 12,
    ref: "Aladdin",
    title: "La Caverne aux Merveilles.",
    description: "Tu avais les joyaux de l'encrier, mais pas le droit d'y toucher. Ton économie brillait de mille feux, ton board restait de sable.",
    sourceLine: "Réf. Disney : Aladdin."
  },
  {
    buckets: ["inkLeak"],
    weight: 11,
    ref: "Mission Cléopâtre",
    title: "Pas de pierres, pas de construction. Pas de construction, pas de palais.",
    description: "Pas de tempo, pas de palais. Amonbofis aurait pété un câble en voyant {inkFloat} encres ne servir à rien sur le chantier.",
    sourceLine: "Réf. comédie française : Astérix & Obélix : Mission Cléopâtre."
  },
  {
    buckets: ["inkLeak"],
    weight: 10,
    ref: "Cars",
    title: "Pit stop !",
    description: "L’encre était dans le réservoir, mais Guido est resté bloqué au stand. La curve voulait accélérer, le séquençage a calé.",
    sourceLine: "Réf. Disney/Pixar : Cars."
  },
  {
    buckets: ["inkLeak"],
    weight: 9,
    ref: "Titanic",
    title: "Je suis le roi du monde !",
    description: "Pas vraiment Jack. Avec {inkFloat} encres laissées à quai, ton économie a foncé tout droit vers l'iceberg du late game.",
    sourceLine: "Réf. cinéma : Titanic."
  },

  // MULLIGAN
  {
    buckets: ["mulligan"],
    weight: 13,
    ref: "Les Bronzés",
    title: "Quand te reverrai-je, pays merveilleux ?",
    description: "Mulligan de {nbMulligan} cartes : l’ambiance sentait le télésiège bloqué. Derrière, la curve n’a pas du tout rattrapé le coup.",
    sourceLine: "Réf. comédie française : Les Bronzés font du ski."
  },
  {
    buckets: ["mulligan"],
    weight: 12,
    ref: "Star Wars",
    title: "J'ai un très mauvais pressentiment.",
    description: "{nbMulligan} cartes renvoyées, et le deck a répondu par l'Étoile de la Mort. Le plan sentait le roussi avant le premier trade.",
    sourceLine: "Réf. pop culture : Star Wars."
  },
  {
    buckets: ["mulligan"],
    weight: 11,
    ref: "Kuzco",
    title: "Flingue-le Kronk !... Mauvais levier Kronk !",
    description: "Pourquoi on a ce levier ? Le mulligan a empiré la situation, et tu as passé la game à essayer de remonter du labo secret.",
    sourceLine: "Réf. Disney : Kuzco."
  },
  {
    buckets: ["mulligan"],
    weight: 10,
    ref: "Kaamelott",
    title: "C’est systématiquement débile, mais c'est toujours inattendu.",
    description: "Garder une main pareille après {nbMulligan} changements, c'est de l'art abstrait. Malheureusement, l'adversaire n'était pas sensible à ton audace.",
    sourceLine: "Réf. comédie française : Kaamelott."
  },
  {
    buckets: ["mulligan"],
    weight: 10,
    ref: "Terminator",
    title: "Viens avec moi si tu veux vivre.",
    description: "C'est ce que les bonnes cartes de ta main t'ont crié pendant le mulligan. Tu ne les as pas écoutées, et le T-1000 t'a rattrapé.",
    sourceLine: "Réf. cinéma : Terminator."
  },
  {
    buckets: ["mulligan"],
    weight: 9,
    ref: "Mission Cléopâtre",
    title: "Vous savez, moi je ne crois pas qu'il y ait de bonne ou de mauvaise situation.",
    description: "Moi si : {nbMulligan} cartes jetées et une curve éclatée, c'est une très mauvaise situation. Otitis aurait fait mieux.",
    sourceLine: "Réf. comédie française : Astérix & Obélix : Mission Cléopâtre."
  },
  {
    buckets: ["mulligan"],
    weight: 8,
    ref: "Cendrillon",
    title: "Salagadoola mechicka boola, Bibbidi-bobbidi-boo.",
    description: "Le mulligan devait transformer la citrouille en carrosse. Il a surtout transformé ta main de départ en tas de compost.",
    sourceLine: "Réf. Disney : Cendrillon."
  },

  // CONTROL / LONG GAMES
  {
    buckets: ["control"],
    weight: 13,
    ref: "Nemo",
    title: "Nage droit devant toi, nage droit devant toi...",
    description: "{nbTours} tours de survie absolue. Dans cette tranchée sous-marine, le Card Advantage n’est plus un bonus, c’est de l’oxygène.",
    sourceLine: "Réf. Disney/Pixar : Le Monde de Nemo."
  },
  {
    buckets: ["control"],
    weight: 12,
    ref: "football",
    title: "Ils font le dos rond.",
    description: "Longue séquence de contrôle tactique : encaisser, filtrer la relance, attendre. Le match s’est gagné au mental dans le temps additionnel.",
    sourceLine: "Réf. formule sportive : faire le dos rond."
  },
  {
    buckets: ["control"],
    weight: 11,
    ref: "Le Seigneur des Anneaux",
    title: "Vous ne passerez paaaaaas !",
    description: "Gandalf a posé le bâton sur ton board. Ressources étirées, agression neutralisée, et chaque tour est devenu un cauchemar d'attrition.",
    sourceLine: "Réf. cinéma : Le Seigneur des Anneaux."
  },
  {
    buckets: ["control"],
    weight: 10,
    ref: "Casablanca",
    title: "Louis, je crois que c'est le début d'une belle amitié.",
    description: "Ton deck et l’attrition se sont très bien entendus. {nbTours} tours plus tard, on sait définitivement qui avait le plus gros moteur.",
    sourceLine: "Réf. cinéma : Casablanca."
  },
  {
    buckets: ["control"],
    weight: 9,
    ref: "Star Wars",
    title: "La patience, tu dois avoir, mon jeune Padawan.",
    description: "Une game aussi longue exige de choisir ses combats au sabre laser. La précipitation a été punie, le contrôle a récompensé.",
    sourceLine: "Réf. pop culture : Star Wars."
  },
  {
    buckets: ["control"],
    weight: 9,
    ref: "Les Tontons flingueurs",
    title: "C'est du brutal.",
    description: "Pas brutal en vitesse, brutal en usure. Les ressources se sont arrachées tour après tour, un vrai carnage de Card Advantage.",
    sourceLine: "Réf. cinéma français : Les Tontons flingueurs."
  },

  // PASSIVE LORE / LOCATIONS
  {
    buckets: ["passiveLore"],
    weight: 15,
    ref: "immobilier",
    title: "L'immobilier, il n'y a que ça de vrai.",
    description: "{loreFromLocations} Lore passif via tes Lieux. Stéphane Plaza valide : pendant que {opponentShort} gérait les personnages, tu encaissais les loyers.",
    sourceLine: "Réf. interne InkSight : victoire par rente de Lieux."
  },
  {
    buckets: ["passiveLore"],
    weight: 13,
    ref: "Là-haut",
    title: "L'aventure est là-bas !",
    description: "Et elle était fermement accrochée à tes Lieux. {loreFromLocations} points passifs, c’est une maison volante que l’adversaire n'a pas su crever.",
    sourceLine: "Réf. Disney/Pixar : Là-haut."
  },
  {
    buckets: ["passiveLore"],
    weight: 12,
    ref: "Le Roi Lion",
    title: "Tout ce qui est dans la lumière est notre royaume.",
    description: "Ton royaume n'avait même plus besoin d'aventuriers : il scorait tout seul. Mufasa t'a offert {loreFromLocations} de Lore depuis les étoiles.",
    sourceLine: "Réf. Disney : Le Roi Lion."
  },
  {
    buckets: ["passiveLore"],
    weight: 11,
    ref: "football",
    title: "Erreur de marquage dans la surface !",
    description: "{opponentShort} a complètement oublié l’essentiel : attaquer la source du danger. {loreFromLocations} Lore passif dans le dos de la défense.",
    sourceLine: "Réf. commentaire sportif : erreur de marquage."
  },
  {
    buckets: ["passiveLore"],
    weight: 10,
    ref: "Mission Cléopâtre",
    title: "C'est une bonne situation ça, scribe ?",
    description: "Avoir des lieux intouchables ? Oui, c'est une excellente situation. Les ouvriers ont bâti du {loreFromLocations} passif dans le calme absolu.",
    sourceLine: "Réf. comédie française : Astérix & Obélix : Mission Cléopâtre."
  },
  {
    buckets: ["passiveLore"],
    weight: 9,
    ref: "Le Livre de la jungle",
    title: "Il en faut peu pour être heureux.",
    description: "Quelques Lieux posés là, et la magie opère. {loreFromLocations} points gratuits en chantant avec Baloo, c'est l'essence même de l'oisiveté compétitive.",
    sourceLine: "Réf. Disney : Le Livre de la jungle."
  },

  // MVP / CARD SOURCE LORE
  {
    buckets: ["mvp"],
    weight: 12,
    ref: "sport",
    title: "C'est l'homme du match.",
    description: "{topQuester} a assumé le brassard de capitaine quand il le fallait. Une masterclass individuelle au milieu du collectif.",
    sourceLine: "Réf. formule classique de commentaire sportif."
  },
  {
    buckets: ["mvp"],
    weight: 11,
    ref: "Toy Story",
    title: "Tu as un ami en moi !",
    description: "Et cet ami s’appelle {topQuester}. La carte t'a sorti du pétrin en portant l'équipe sur son dos jusqu'au coup de sifflet final.",
    sourceLine: "Réf. Disney/Pixar : Toy Story."
  },
  {
    buckets: ["mvp"],
    weight: 10,
    ref: "Pavard 2018",
    title: "La frappe de {topQuester} !!!",
    description: "Le boulet de canon ! Le MVP est sorti du bois pour planter la stat décisive. L'adversaire est resté cloué sur place.",
    sourceLine: "Réf. commentaire football : “Second poteau Pavard”."
  },
  {
    buckets: ["mvp"],
    weight: 10,
    ref: "The Dark Knight",
    title: "Pourquoi cet air si sérieux ?",
    description: "{topQuester} a mis le chaos dans le plan adverse avec un grand sourire. Le Joker du deck a frappé là où ça fait mal.",
    sourceLine: "Réf. cinéma : The Dark Knight."
  },
  {
    buckets: ["mvp"],
    weight: 9,
    ref: "Marvel",
    title: "Je suis... inéluctable.",
    description: "Claquement de doigts. À partir du moment où {topQuester} a atterri sur le board, la fin de la partie était déjà gravée dans la pierre.",
    sourceLine: "Réf. pop culture : Avengers / Thanos."
  },
  {
    buckets: ["mvp"],
    weight: 9,
    ref: "Le Parrain",
    title: "Je vais lui faire une offre qu'il ne pourra pas refuser.",
    description: "{topQuester} est venu toquer à la porte avec des arguments très lourds. Mafia ou Lorcana, la pression reste la même.",
    sourceLine: "Réf. cinéma : Le Parrain."
  },

  // AGGRO / FAST
  {
    buckets: ["aggro"],
    weight: 11,
    ref: "Cars",
    title: "Vitesse. Je suis rapide.",
    description: "Flash McQueen n'a pas fait dans la dentelle. {nbTours} tours pour plier le match : la ligne droite a été fatale.",
    sourceLine: "Réf. Disney/Pixar : Cars."
  },
  {
    buckets: ["aggro"],
    weight: 10,
    ref: "football",
    title: "But sur l'engagement !",
    description: "Le match a à peine commencé que le tableau d'affichage s'affole. {opponentShort} n'avait même pas eu le temps de lacer ses crampons.",
    sourceLine: "Réf. culture football : pression d’entrée de match."
  },
  {
    buckets: ["aggro"],
    weight: 9,
    ref: "Sonic-like",
    title: "Trop lent !",
    description: "La game a tourné au sprint olympique. Face à cette agressivité, la théorie du late game de {opponentShort} est restée dans son deck.",
    sourceLine: "Réf. culture jeu vidéo : Sonic / Vitesse."
  },
  {
    buckets: ["aggro"],
    weight: 8,
    ref: "Les Indestructibles",
    title: "Pas de cape !!!",
    description: "Edna Mode l'a dit : pas de fioritures. Une sortie ultra agressive, courte, tranchante. Ne jamais se prendre les pieds dans le tapis du late game.",
    sourceLine: "Réf. Disney/Pixar : Les Indestructibles."
  },

  // GENERIC LOSSES
  {
    buckets: ["genericLoss"],
    weight: 10,
    ref: "football",
    title: "C'est le tournant du match.",
    description: "Il y a eu une minute où la possession a tourné au vinaigre. Retrouve ce tour critique : c'est là que les trois points se sont envolés.",
    sourceLine: "Réf. formule classique de commentaire sportif."
  },
  {
    buckets: ["genericLoss"],
    weight: 9,
    ref: "Dumbo",
    title: "La plume magique n'a pas marché.",
    description: "Tu croyais pouvoir voler, mais la gravité TCG t'a rappelé à l'ordre. La chute fait mal, mais les erreurs se recyclent en VOD.",
    sourceLine: "Réf. Disney : Dumbo."
  },
  {
    buckets: ["genericLoss"],
    weight: 9,
    ref: "Mission Cléopâtre",
    title: "Il est bizarre ce sol, il est pas palpable.",
    description: "C'est tout ton plan de jeu qui n'était pas palpable. Curve, trades, encre : la fondation de la partie était tremblante depuis le tour 2.",
    sourceLine: "Réf. comédie française : Astérix & Obélix : Mission Cléopâtre."
  },
  {
    buckets: ["genericLoss"],
    weight: 8,
    ref: "OSS 117",
    title: "J'ai pas envie.",
    description: "Le deck t'a regardé dans les yeux et a dit non. Et sans l'envie de curver, même les meilleures cartes du monde ne sauvent pas le Président.",
    sourceLine: "Réf. comédie française : OSS 117."
  },
  {
    buckets: ["genericLoss"],
    weight: 8,
    ref: "Star Wars",
    title: "Je suis ton père.",
    description: "Et aujourd'hui, {opponentShort} t'a renvoyé dans ta chambre. Perte de rythme, punition immédiate. Un coup de sabre qui fait réfléchir.",
    sourceLine: "Réf. pop culture : Star Wars."
  },
  {
    buckets: ["genericLoss"],
    weight: 7,
    ref: "La Cité de la peur",
    title: "Vous bluffez Martoni.",
    description: "Tu as essayé d'imposer un tempo que tu n'avais pas. {opponentShort} n'a pas cligné des yeux, et tes cartes en main n'ont dupé personne.",
    sourceLine: "Réf. comédie française : La Cité de la peur."
  },

  // GENERIC WINS
  {
    buckets: ["genericWin"],
    weight: 10,
    ref: "sport",
    title: "Le contrat est rempli.",
    description: "Pas de chichi, pas de panique, trois points pris proprement. Tu as fait le job sans te mettre dans le rouge tactiquement.",
    sourceLine: "Réf. formule classique de commentaire sportif."
  },
  {
    buckets: ["genericWin"],
    weight: 9,
    ref: "Mulan",
    title: "Attaquez, comme un homme !",
    description: "De la discipline militaire : bonne curve, bons trades, rythme implacable. Les Huns ont été repoussés avec une précision glaçante.",
    sourceLine: "Réf. Disney : Mulan."
  },
  {
    buckets: ["genericWin"],
    weight: 9,
    ref: "Le Roi Lion",
    title: "Hakuna Matata.",
    description: "Ces mots signifient que tu as géré ton match sans aucun souci philosophie ! Pas parfait, mais le tempo est resté du bon côté.",
    sourceLine: "Réf. Disney : Le Roi Lion."
  },
  {
    buckets: ["genericWin"],
    weight: 8,
    ref: "Kaamelott",
    title: "Le gras, c’est la value.",
    description: "Karadoc est fier : beaucoup de ressources pesantes, beaucoup de présence, et la partie étouffée sous le poids de ton board.",
    sourceLine: "Réf. comédie française : Kaamelott."
  },
  {
    buckets: ["genericWin"],
    weight: 8,
    ref: "Aladdin",
    title: "Faites place au Prince Ali !",
    description: "Tu as débarqué avec toute la parade. La course au Lore s'est effacée devant un tempo royal qui a contraint l'adversaire à l'agenouillement.",
    sourceLine: "Réf. Disney : Aladdin."
  },

  // NEUTRAL / FALLBACK
  {
    buckets: ["neutral"],
    weight: 6,
    ref: "analyse",
    title: "Lecture du match.",
    description: "La partie demande un coup de VAR : score {monScore}-{scoreAdverse}, {nbTours} tours, {inkFloat} encres flottées. Vérifie l'historique des trades.",
    sourceLine: "Réf. InkSight : fallback analytique."
  },
  {
    buckets: ["neutral"],
    weight: 5,
    ref: "sport",
    title: "Retour aux vestiaires.",
    description: "Il faut débriefer cette séquence : curve instable, conversion floue. Le replay a le mot de la fin sur ce qui s'est passé.",
    sourceLine: "Réf. formule d’analyse post-match."
  }
];

const EXTRA_VARIATIONS = [
  ["stompWin", "Climatisation totale du stade.", "La salle a perdu dix degrés quand tu as verrouillé le score. {opponentShort} a subi la pression dans un silence absolu.", "Réf. argot sportif : climatisation d’un stade."],
  ["stompWin", "Une vraie promenade de santé.", "À ce rythme-là, tu pouvais jouer en tongs. Ton plan a marché de A à Z sans aucune sueur.", "Réf. commentaire sportif : domination sans danger."],
  ["cleanWin", "Précision chirurgicale.", "On aurait dit du travail d'horloger suisse. Zéro déchet, ressources optimisées, lethal livré avec la facture.", "Réf. formule sportive : précision chirurgicale."],
  ["closeWin", "Victoire à la photo-finish !", "La ligne d'arrivée franchie au millimètre. Tu as eu chaud, le public a eu chaud, mais les points sont là.", "Réf. vocabulaire sportif : arrivée à la photo-finish."],
  ["closeLoss", "Le montant repousse la frappe !", "Tu as tapé le poteau à la 90ème minute. Ce n'est pas un manque de niveau, c'est un manque de réussite finale.", "Réf. vocabulaire sportif : le poteau sortant."],
  ["stompLoss", "Faux départ, drapeau noir.", "Tu es resté scotché sur la grille de départ, et {opponentShort} a pris un tour d'avance. Dur de rivaliser sans moteur.", "Réf. commentaire sportif : sport mécanique."],
  ["topDeckLoss", "Il n'y a plus rien à voir, circulez.", "Quand la main est vide, la magie s'éteint. Le top deck mode a transformé la stratégie en loto de quartier.", "Réf. concept TCG : top deck mode."],
  ["inkLeak", "Le robinet était resté ouvert.", "{inkFloat} encres gaspillées, le plombier va hurler. L'économie était là, la plomberie du tempo était percée.", "Réf. concept TCG : Ink Advantage mal converti."],
  ["mulligan", "Demande de remplacement refusée.", "Le banc a mal réagi après le changement. Garder cette main de départ était audacieux, la suite l'a cruellement puni.", "Réf. vocabulaire sportif : coaching perdant."],
  ["control", "Bataille au milieu de terrain.", "{nbTours} tours de tacles à la gorge. Il fallait avoir le cœur bien accroché pour gagner ce bras de fer tactique.", "Réf. commentaire sportif : match fermé / usure."],
  ["passiveLore", "La rente tombe à la fin du mois.", "{passiveLoreCard} a encaissé {loreFromLocations} de Lore sans forcer. Pourquoi s'épuiser à attaquer quand la banque fait les virements ?", "Réf. InkSight : rente immobilière des Lieux."],
  ["mvp", "On va lui ériger une statue.", "{topQuester} a régalé la foule. Quand tu trouves le porteur de balle parfait, il suffit de lui laisser la place.", "Réf. vocabulaire sportif : joueur idolâtré."],
  ["genericWin", "Le strict minimum syndical.", "Tu as pris les points sans régaler la tribune, mais la victoire compte quand même. Un match de vieux briscard.", "Réf. analyse compétitive."],
  ["genericLoss", "Passez-moi la VAR s'il vous plaît.", "Rien n'a marché comme prévu. Un revisionnage du replay pour pointer du doigt les erreurs d'encre est prescrit.", "Réf. analyse post-match."]
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
    source: "Coach DB Culture V129.2",
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
      version: "v129.2",
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
    console.error("getCoachCommentary v129.2 error:", error);
    return res.status(200).json({
      title: "Coach muet.",
      description: "Le diagnostic local a raté son top deck. Le replay reste analysable, mais le commentaire a pris un carton rouge technique.",
      sourceLine: "Fallback InkSight.",
      source: "Coach DB Culture V129.2",
      reason: "local_error",
      debug: error?.message || String(error),
    });
  }
}
