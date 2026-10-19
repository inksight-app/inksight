import { applyPatch } from "./patch.ts";
import type {
  Action,
  Analysis,
  Card,
  CardUse,
  Opening,
  Position,
  Resources,
  Turn,
} from "./types.ts";

const list = (v: any): any[] => (Array.isArray(v) ? v : []);
const num = (v: any, fallback = 0): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;
const player = (v: any): number | null => (v === 1 || v === 2 ? v : null);
const text = (v: any, fallback = ""): string =>
  typeof v === "string" ? v : fallback;
export function card(raw: any): Card {
  return {
    id: text(raw?.id),
    instanceId: text(raw?.instanceId),
    name:
      text(
        raw?.fullName,
        [raw?.name, raw?.title].filter(Boolean).join(" — "),
      ) || "Carte non identifiée",
    cost: typeof raw?.cost === "number" ? raw.cost : null,
    type: text(raw?.type).toLowerCase(),
    inkable: typeof raw?.inkable === "boolean" ? raw.inkable : null,
    colors: list(raw?.colors).filter((x) => typeof x === "string"),
    lore: num(raw?.lore),
    strength: num(raw?.strength),
    willpower: num(raw?.willpower),
    damage: num(raw?.damage),
    exerted: raw?.exerted === true,
    justPlayed: raw?.justPlayed === true,
    rulesText: text(raw?.rulesText),
    image: text(raw?.imageSmallUrl) || undefined,
  };
}
export function resources(zone: any): Resources {
  if (!Array.isArray(zone?.inkwell))
    throw new Error("Réserve d’encre absente du replay.");
  const drops = zone.inkDrops ?? 0; // The public Duels serializer omits a zero count, including legacy replays.
  if (!Number.isSafeInteger(drops) || drops < 0)
    throw new Error("Nombre d’inkdrops invalide.");
  return {
    permanent: zone.inkwell.length,
    ready: zone.inkwell.filter((entry: any) => !(entry?.card ?? entry)?.exerted)
      .length,
    drops,
  };
}
function position(s: any, frameIndex: number, seq: number): Position {
  const mine = s.myPlayer,
    opp = s.opponent;
  if (!mine || !opp || !Array.isArray(mine.hand))
    throw new Error("Point de vue du replay incomplet.");
  return {
    frameIndex,
    seq,
    player: player(s.currentPlayer),
    round: num(s.turnNumber, 1),
    mine: {
      ...resources(mine),
      lore: num(mine.lore),
      handCount: mine.hand.length,
      hand: mine.hand.map(card),
      field: [...list(mine.field), ...list(mine.items)].map(card),
    },
    opponent: {
      ...resources(opp),
      lore: num(opp.lore),
      handCount: Array.isArray(opp.hand) ? opp.hand.length : num(opp.handCount),
      field: [...list(opp.field), ...list(opp.items)].map(card),
    },
  };
}
const labels: Record<string, string> = {
  ADD_TO_INK: "Encrer",
  PLAY_CARD: "Jouer",
  QUEST: "Partir à l’aventure",
  ATTACK: "Défier",
  CHALLENGE: "Défier",
  SHIFT: "Alterner",
  SING: "Chanter",
  SING_SONG: "Chanter",
  MOVE_CHARACTER: "Déplacer",
  MOVE_TO_LOCATION: "Déplacer",
  USE_ABILITY: "Activer une capacité",
  RESPOND_TO_PROMPT: "Résoudre un effet",
  END_TURN: "Terminer le tour",
  CONCEDE: "Concéder",
  GAME_FINISH: "Fin de partie",
};
function isoDate(value: any): string | null {
  if (value == null) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
function exertedIds(zone: any): Set<string> {
  return new Set(
    list(zone?.inkwell)
      .filter((e) => (e.card ?? e).exerted)
      .map((e, i) => text((e.card ?? e).instanceId, `slot:${i}`)),
  );
}
export function analyseReplay(
  input: unknown,
  fileName = "partie.replay",
): Analysis {
  const data = input as any;
  if (
    data?.format !== "duels-replay-v1" ||
    !data?.baseSnapshot ||
    !Array.isArray(data?.frames)
  )
    throw new Error(
      "Ce fichier n’est pas un replay Duels.ink v1 pris en charge.",
    );
  const perspective = player(data.perspective ?? data.baseSnapshot.viewingAs);
  if (!text(data.gameId))
    throw new Error("L’identifiant de partie manque dans ce replay.");
  if (!perspective)
    throw new Error("Le point de vue du replay n’est pas renseigné.");
  if (
    Array.isArray(data.baseSnapshot.opponents) &&
    data.baseSnapshot.opponents.length > 1
  )
    throw new Error(
      "Les replays multijoueurs ne sont pas encore pris en charge.",
    );
  if (data.frames.length > 15000)
    throw new Error("Ce replay dépasse la taille prise en charge.");
  const frames = [...data.frames].sort((a, b) => a.seq - b.seq);
  if (
    frames.some(
      (f, i) =>
        !Number.isSafeInteger(f.seq) ||
        f.seq <= 0 ||
        (i > 0 && f.seq === frames[i - 1].seq),
    )
  )
    throw new Error("La séquence du replay est invalide.");
  let state = JSON.parse(JSON.stringify(data.baseSnapshot));
  const positions = [position(state, 0, 0)];
  const opening: Opening = {
    initial: [],
    kept: [],
    returned: [],
    resolved: [],
    known: false,
  };
  const events: Action[] = [];
  const cancelled = new Set<number>();
  const issues: string[] = [];
  let firstPlayer = player(state.firstPlayer);
  let started = state.status === "playing";
  let startIndex = started ? 0 : -1;
  if (started)
    issues.push("Le replay débute en cours de partie : mulligan non observé.");
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (!Array.isArray(f.patch))
      throw new Error(`État manquant à l’étape ${f.seq}.`);
    const before = positions.at(-1)!;
    const actor =
      player(f.player ?? f.takenAction?.player) ??
      (labels[f.actionType] ? player(state.currentPlayer) : null);
    const side =
      actor == null ? null : actor === perspective ? "mine" : "opponent";
    const beforeHand = list(state.myPlayer.hand).map(card);
    const beforeExerted = exertedIds(
      side === "opponent" ? state.opponent : state.myPlayer,
    );
    for (const patch of f.patch) state = applyPatch(state, patch, true);
    const after = position(state, i + 1, f.seq);
    positions.push(after);
    firstPlayer ??= player(state.firstPlayer);
    if (f.actionType === "MULLIGAN" && actor === perspective) {
      const afterHand = after.mine.hand,
        ids = new Set(afterHand.map((c) => c.instanceId));
      const initialIds = new Set(beforeHand.map((c) => c.instanceId));
      opening.initial = beforeHand;
      opening.kept = beforeHand.filter(
        (c) => c.instanceId && ids.has(c.instanceId),
      );
      opening.returned = beforeHand.filter(
        (c) => c.instanceId && !ids.has(c.instanceId),
      );
      opening.resolved = afterHand;
      opening.known =
        beforeHand.every((c) => !!c.instanceId) &&
        afterHand.every((c) => !!c.instanceId) &&
        initialIds.size === beforeHand.length;
    }
    if (!started && state.status === "playing") {
      started = true;
      startIndex = i + 1;
      if (opening.known) opening.resolved = after.mine.hand;
    }
    const undo = /^FREE_UNDO:(\d+)$/.exec(text(f.actionType));
    if (undo) {
      const target = Number(undo[1]);
      if (!frames.some((x) => x.seq === target && target < f.seq))
        throw new Error(
          "Le replay contient un retour en arrière sans origine.",
        );
      for (const prior of frames)
        if (prior.seq >= target && prior.seq < f.seq) cancelled.add(prior.seq);
    } else if (/UNDO|REWIND/.test(text(f.actionType))) {
      throw new Error(
        "Ce format de retour en arrière n’est pas encore pris en charge.",
      );
    }
    const beforeR = side ? before[side] : null,
      afterR = side ? after[side] : null;
    const afterExerted = exertedIds(
      side === "opponent" ? state.opponent : state.myPlayer,
    );
    const dropsRemoved =
      beforeR && afterR ? Math.max(0, beforeR.drops - afterR.drops) : 0;
    const explicitPaid = f.takenAction?.inkDropsToSpend;
    // A removed drop may be an alternate cost, not a payment of ink. Never conflate the two.
    const dropsPaid =
      Number.isSafeInteger(explicitPaid) && explicitPaid >= 0
        ? explicitPaid
        : dropsRemoved
          ? null
          : 0;
    events.push({
      seq: f.seq,
      frameIndex: i + 1,
      player: actor,
      side,
      type: text(f.actionType),
      label:
        labels[f.actionType] ??
        (undo ? "Action annulée" : "Mise à jour du jeu"),
      cardId:
        text(f.takenAction?.cardId ?? f.takenAction?.attackerCardId) || null,
      cardName:
        text(f.takenAction?.cardName ?? f.takenAction?.attackerName) || null,
      permanentExerted:
        beforeR && afterR && !undo
          ? [...afterExerted].filter((id) => !beforeExerted.has(id)).length
          : 0,
      dropsGained:
        beforeR && afterR && !undo
          ? Math.max(0, afterR.drops - beforeR.drops)
          : 0,
      dropsRemoved: undo ? 0 : dropsRemoved,
      dropsPaid: undo ? 0 : dropsPaid,
      cancelled: false,
      position: after,
    });
  }
  events.forEach((e) => {
    e.cancelled = cancelled.has(e.seq);
  });
  if (!started)
    throw new Error("Le début de jeu n’est pas présent dans ce replay.");
  const effective = events.filter(
    (e) => !e.cancelled && e.frameIndex > startIndex,
  );
  const turns: Turn[] = [];
  const ownTurnCounts: Record<number, number> = { 1: 0, 2: 0 };
  let active: Turn | null = null;
  const startPosition = startIndex >= 0 ? positions[startIndex] : positions[0];
  let previous = startPosition;
  for (const event of effective) {
    if (/^(MULLIGAN|CHOOSE_STARTING_PLAYER|FREE_UNDO:)/.test(event.type)) {
      previous = event.position;
      continue;
    }
    const currentPlayer = previous.player;
    if (currentPlayer && (!active || active.player !== currentPlayer)) {
      ownTurnCounts[currentPlayer]++;
      active = {
        index: turns.length + 1,
        ownTurn: ownTurnCounts[currentPlayer],
        player: currentPlayer,
        side: currentPlayer === perspective ? "mine" : "opponent",
        round: previous.round,
        start: previous,
        end: previous,
        actions: [],
        inked: 0,
        played: 0,
        quests: 0,
        challenges: 0,
        permanentExerted: 0,
        dropsGained: 0,
        dropsRemoved: 0,
        dropsPaid: 0,
      };
      turns.push(active);
    }
    if (active) {
      // END_TURN's patch already readies the next player. Keep the outgoing player's pre-transition resources.
      active.end = event.type === "END_TURN" ? previous : event.position;
      active.actions.push(event);
      if (event.player === active.player) {
        active.inked += Number(event.type === "ADD_TO_INK");
        active.played += Number(["PLAY_CARD", "SHIFT"].includes(event.type));
        active.quests += Number(event.type === "QUEST");
        active.challenges += Number(
          ["ATTACK", "CHALLENGE"].includes(event.type),
        );
        active.permanentExerted += event.permanentExerted;
        active.dropsGained += event.dropsGained;
        active.dropsRemoved += event.dropsRemoved;
        active.dropsPaid =
          active.dropsPaid === null || event.dropsPaid === null
            ? null
            : active.dropsPaid + event.dropsPaid;
      }
    }
    previous = event.position;
  }
  const uses = new Map<string, CardUse>();
  const ensure = (id: string, name: string): CardUse => {
    if (!uses.has(id))
      uses.set(id, {
        id,
        name,
        played: 0,
        inked: 0,
        openingKept: 0,
        openingReturned: 0,
      });
    return uses.get(id)!;
  };
  for (const e of effective)
    if (e.side === "mine" && e.cardId && !e.type.startsWith("FREE_UNDO")) {
      const u = ensure(e.cardId, e.cardName ?? e.cardId);
      u.played += Number(["PLAY_CARD", "SHIFT"].includes(e.type));
      u.inked += Number(e.type === "ADD_TO_INK");
    }
  for (const c of opening.kept) ensure(c.id, c.name).openingKept++;
  for (const c of opening.returned) ensure(c.id, c.name).openingReturned++;
  const final = positions.at(-1)!;
  const winner = player(data.winner ?? state.winner);
  const finished = state.status === "finished";
  const result = winner
    ? winner === perspective
      ? "win"
      : "loss"
    : finished && (data.winner === 0 || state.winner === 0)
      ? "draw"
      : "unfinished";
  if (!opening.known)
    issues.push(
      "Mulligan non exploitable : aucune recommandation de conservation n’en sera déduite.",
    );
  if (events.some((e) => !e.cancelled && e.dropsPaid === null))
    issues.push(
      "Des inkdrops ont été retirés sans détail de paiement : leur usage reste non attribué.",
    );
  if (!firstPlayer) issues.push("Premier joueur inconnu.");
  if (!finished)
    issues.push("Le replay ne contient pas de fin de partie confirmée.");
  const createdAt = isoDate(data.createdAt);
  if (!createdAt) issues.push("Date de partie inconnue.");
  const id =
    text(data.gameId) ||
    `local:${fileName}:${frames.length}:${final.mine.lore}:${final.opponent.lore}`;
  const replayId = text(data.baseSnapshot.replayId) || null;
  return {
    schema: 1,
    startsMidGame: data.baseSnapshot.status === "playing",
    id: `${id}:${perspective}`,
    replayId,
    fileName,
    createdAt,
    perspective,
    myName: text(data.playerNames?.[perspective], "Moi"),
    opponentName: text(
      data.playerNames?.[perspective === 1 ? 2 : 1],
      "Adversaire",
    ),
    firstPlayer,
    wentFirst: firstPlayer ? firstPlayer === perspective : null,
    winner,
    result,
    reason: text(data.victoryReason),
    deck: list(data.decklist)
      .map((x) => (typeof x === "string" ? x : x?.id))
      .filter((x) => typeof x === "string"),
    colors: [
      ...new Set(
        positions.flatMap((p) => p.mine.hand.flatMap((c) => c.colors)),
      ),
    ].sort(),
    opening,
    turns,
    actions: events,
    positions,
    cardUse: [...uses.values()],
    cancelledActions: events.filter(
      (e) => e.cancelled && !!labels[e.type] && e.type !== "RESPOND_TO_PROMPT",
    ).length,
    issues,
  };
}
