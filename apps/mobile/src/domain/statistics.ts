import type { Analysis, Finding } from "./types.ts";
export function dropFlow(game: Analysis) {
  let previous = game.positions[0],
    gained = 0,
    removed = 0;
  for (const action of game.actions) {
    if (action.cancelled) continue;
    if (!action.type.startsWith("FREE_UNDO:")) {
      const delta = action.position.mine.drops - previous.mine.drops;
      gained += Math.max(0, delta);
      removed += Math.max(0, -delta);
    }
    previous = action.position;
  }
  return { gained, removed }; // Net observable variations; includes effects during the opponent's turn.
}
export function wilson(
  wins: number,
  total: number,
  z = 1.96,
): [number, number] | null {
  if (
    !Number.isInteger(total) ||
    !Number.isInteger(wins) ||
    total <= 0 ||
    wins < 0 ||
    wins > total
  )
    return null;
  const p = wins / total,
    d = 1 + (z * z) / total;
  const center = (p + (z * z) / (2 * total)) / d;
  const half =
    (z / d) * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total));
  return [Math.max(0, center - half), Math.min(1, center + half)];
}
export function chanceAtLeastOne(
  deck: number,
  targets: number,
  draws: number,
): number {
  if (
    ![deck, targets, draws].every(Number.isInteger) ||
    deck < 1 ||
    targets < 0 ||
    targets > deck ||
    draws < 0 ||
    draws > deck
  )
    throw new Error("Paramètres de pioche invalides.");
  let miss = 1;
  for (let i = 0; i < draws; i++)
    miss *= Math.max(0, deck - targets - i) / (deck - i);
  return 1 - miss;
}
export function summary(games: Analysis[]) {
  const completed = games.filter((g) =>
    ["win", "loss", "draw"].includes(g.result),
  );
  const decisive = completed.filter((g) => g.result !== "draw");
  const wins = decisive.filter((g) => g.result === "win").length;
  const split = (wentFirst: boolean) => {
    const rows = decisive.filter((g) => g.wentFirst === wentFirst);
    const w = rows.filter((g) => g.result === "win").length;
    return {
      total: rows.length,
      wins: w,
      rate: rows.length ? w / rows.length : null,
      interval: wilson(w, rows.length),
    };
  };
  const mineTurns = games.flatMap((g) =>
    g.turns.filter((t) => t.side === "mine"),
  );
  return {
    total: games.length,
    completed: completed.length,
    wins,
    losses: decisive.length - wins,
    draws: completed.length - decisive.length,
    unfinished: games.length - completed.length,
    rate: decisive.length ? wins / decisive.length : null,
    interval: wilson(wins, decisive.length),
    first: split(true),
    second: split(false),
    mineTurns,
    averageTurns: games.length ? mineTurns.length / games.length : null,
    dropsGained: games.reduce((n, g) => n + dropFlow(g).gained, 0),
    dropsRemoved: games.reduce((n, g) => n + dropFlow(g).removed, 0),
  };
}
export function findings(game: Analysis): Finding[] {
  const rows: Finding[] = [];
  const mine = game.turns.filter((t) => t.side === "mine");
  const add = (f: Finding) => rows.push(f);
  const { gained: drops, removed } = dropFlow(game);
  if (drops || removed)
    add({
      id: "drops",
      kind: "fact",
      title: "Deux réserves, deux usages",
      text: `Ton stock d’inkdrops augmente de ${drops} et diminue de ${removed} au fil des états observés, y compris pendant les tours adverses. Les gouttes restantes restent disponibles : les conserver ne constitue pas un gaspillage. Un retrait n’est pas toujours un paiement d’encre.`,
      source: "Variations nettes entre états · Règles 2.3.0, §1.13.1.2",
    });
  const early = mine.find(
    (t) =>
      !game.startsMidGame &&
      t.ownTurn <= 4 &&
      !t.inked &&
      t.start.mine.hand.some((c) => c.inkable) &&
      t.end.mine.permanent <= t.start.mine.permanent,
  );
  if (early)
    add({
      id: "ink",
      kind: "review",
      title: `Ton tour ${early.ownTurn} : revoir le choix d’encrage`,
      text: `Aucune action d’encrage manuelle n’a été enregistrée, alors qu’une carte encrable était connue au début du tour. Ce constat ne prouve pas une erreur : quelle carte souhaitais-tu conserver, et pour quel tour ?`,
      turnIndex: early.index,
      source: "Action ADD_TO_INK et main connue avant le tour",
    });
  const reserve = mine.filter((t) => t.end.mine.ready >= 2);
  if (reserve.length)
    add({
      id: "ready",
      kind: "review",
      title: "Comprendre tes ressources restantes",
      text: `${reserve.length} de tes tours se terminent avec au moins 2 encres permanentes disponibles. Revois les cartes et capacités accessibles à ces moments. Ce chiffre décrit une réserve disponible, pas une quantité d’encre « gaspillée ».`,
      turnIndex: reserve[0].index,
      source: "Réserve du joueur avant la transition de fin de tour",
    });
  if (game.opening.known)
    add({
      id: "mulligan",
      kind: "fact",
      title: "Repartir de la main de départ",
      text: `${game.opening.kept.length} carte${game.opening.kept.length > 1 ? "s" : ""} conservée${game.opening.kept.length > 1 ? "s" : ""} et ${game.opening.returned.length} remplacée${game.opening.returned.length > 1 ? "s" : ""}. Le débrief conserve les cartes ensemble ; il ne déduit pas un bon mulligan du résultat final.`,
      source: "Main avant et après le mulligan",
    });
  if (game.cancelledActions)
    add({
      id: "undo",
      kind: "coverage",
      title: "Les actions annulées sont exclues",
      text: `${game.cancelledActions} action${game.cancelledActions > 1 ? "s" : ""} annulée${game.cancelledActions > 1 ? "s" : ""} dans le replay. Elles restent repérables dans la lecture, mais ne gonflent pas tes compteurs de cartes jouées, de quêtes ou de paiements.`,
      source: "Marqueurs FREE_UNDO et séquences restaurées",
    });
  if (game.issues.length)
    add({
      id: "coverage",
      kind: "coverage",
      title: "Ce que les données permettent de conclure",
      text: game.issues.join(" "),
      source: "Contrôles du lecteur de replay",
    });
  if (!rows.length)
    add({
      id: "quiet",
      kind: "fact",
      title: "Une partie à relire avec son contexte",
      text: "Aucun signal ciblé n’a été détecté par les règles actuelles. Cela ne signifie pas que la partie était parfaite. Sélectionne un tour pour revoir ta main et les ressources connues.",
      source: "Coach statistique v1 · aucun modèle de langage",
    });
  return rows;
}
