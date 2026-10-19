import { analyseReplay } from "./replay.ts";
const makeCard = (id: string, name: string, cost: number) => ({
  id,
  instanceId: `example-${id}`,
  fullName: name,
  type: "character",
  colors: ["amethyst"],
  cost,
  inkable: true,
  lore: 2,
});
export function demoReplay() {
  const hand = [
    makeCard("ex-a", "Personnage A · exemple", 5),
    makeCard("ex-b", "Personnage B · exemple", 3),
    makeCard("ex-c", "Carte C · exemple", 2),
  ];
  const ink = Array.from({ length: 5 }, (_, i) => ({
    card: { instanceId: `ink-${i}`, exerted: false },
  }));
  const r: any = {
    format: "duels-replay-v1",
    gameId: "pedagogical-example",
    createdAt: "2026-10-19T12:00:00.000Z",
    perspective: 1,
    playerNames: { 1: "Exemple", 2: "Adversaire fictif" },
    winner: 1,
    victoryReason: "lore",
    decklist: [],
    baseSnapshot: {
      viewingAs: 1,
      currentPlayer: 1,
      firstPlayer: 2,
      turnNumber: 6,
      status: "playing",
      myPlayer: {
        hand,
        field: [makeCard("ex-d", "Personnage D · exemple", 2)],
        items: [],
        discard: [],
        inkwell: ink,
        inkDrops: 5,
        lore: 16,
      },
      opponent: {
        handCount: 3,
        field: [],
        items: [],
        discard: [],
        inkwell: [],
        inkDrops: 0,
        lore: 17,
      },
    },
    frames: [],
  };
  const push = (type: string, actor: number, patch: any[], takenAction?: any) =>
    r.frames.push({
      seq: r.frames.length + 1,
      actionType: type,
      player: actor,
      turnNumber: 6,
      patch,
      takenAction,
    });
  push(
    "PLAY_CARD",
    1,
    [
      { op: "remove", path: "/myPlayer/hand/0" },
      {
        op: "add",
        path: "/myPlayer/field/0",
        value: { ...hand[0], justPlayed: true },
      },
      ...[0, 1, 2].map((i) => ({
        op: "replace",
        path: `/myPlayer/inkwell/${i}/card/exerted`,
        value: true,
      })),
      { op: "replace", path: "/myPlayer/inkDrops", value: 3 },
    ],
    { cardId: "ex-a", cardName: hand[0].fullName, inkDropsToSpend: 2 },
  );
  push("USE_ABILITY", 1, [
    { op: "replace", path: "/myPlayer/inkDrops", value: 1 },
  ]);
  push("END_TURN", 1, [{ op: "replace", path: "/currentPlayer", value: 2 }]);
  push("USE_ABILITY", 2, [
    { op: "replace", path: "/myPlayer/inkDrops", value: 4 },
    { op: "replace", path: "/opponent/lore", value: 18 },
  ]);
  push("END_TURN", 2, [
    { op: "replace", path: "/currentPlayer", value: 1 },
    { op: "replace", path: "/turnNumber", value: 7 },
    ...[0, 1, 2].map((i) => ({
      op: "replace",
      path: `/myPlayer/inkwell/${i}/card/exerted`,
      value: false,
    })),
    { op: "replace", path: "/myPlayer/field/0/justPlayed", value: false },
  ]);
  push(
    "QUEST",
    1,
    [
      { op: "replace", path: "/myPlayer/lore", value: 18 },
      { op: "add", path: "/myPlayer/field/0/exerted", value: true },
    ],
    { cardId: "ex-a", cardName: hand[0].fullName },
  );
  push(
    "QUEST",
    1,
    [
      { op: "replace", path: "/myPlayer/lore", value: 20 },
      { op: "add", path: "/myPlayer/field/1/exerted", value: true },
      { op: "replace", path: "/status", value: "finished" },
    ],
    { cardId: "ex-d", cardName: "Personnage D · exemple" },
  );
  return r;
}
export function demoAnalysis() {
  return { ...analyseReplay(demoReplay(), "Exemple pédagogique"), demo: true };
}
