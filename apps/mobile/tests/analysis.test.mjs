import test from "node:test";
import assert from "node:assert/strict";
import { zipSync, gzipSync, strToU8 } from "fflate";
import { applyPatch } from "../src/domain/patch.ts";
import { analyseReplay } from "../src/domain/replay.ts";
import { demoReplay } from "../src/domain/demo.ts";
import {
  chanceAtLeastOne,
  findings,
  summary,
  dropFlow,
  wilson,
} from "../src/domain/statistics.ts";
import {
  parseEvaluation,
  evaluationForStep,
} from "../src/domain/evaluation.ts";
import {
  importReplayBytes,
  toBase64,
  fromBase64,
} from "../src/domain/files.ts";

test("JSON Patch inserts arrays and rejects unsafe or missing paths", () => {
  const state = { a: ["A", "C"] };
  assert.deepEqual(
    applyPatch(state, { op: "add", path: "/a/1", value: "B" }).a,
    ["A", "B", "C"],
  );
  assert.throws(() =>
    applyPatch({}, { op: "add", path: "/__proto__/polluted", value: true }),
  );
  assert.throws(() =>
    applyPatch({}, { op: "replace", path: "/missing", value: 1 }),
  );
  assert.equal({}.polluted, undefined);
  assert.deepEqual(
    applyPatch({}, { op: "replace", path: "/optional", value: 2 }, true),
    { optional: 2 },
  );
  assert.throws(() =>
    applyPatch({}, { op: "replace", path: "/missing/child", value: 2 }, true),
  );
});
test("inkdrops stay separate, survive turns, and include gains during the opponent turn", () => {
  const game = analyseReplay(demoReplay());
  assert.equal(game.positions[1].mine.permanent, 5);
  assert.equal(game.positions[1].mine.ready, 2);
  assert.equal(game.positions[1].mine.drops, 3);
  assert.equal(game.turns[0].dropsPaid, null);
  assert.equal(game.turns[0].end.mine.ready, 2);
  assert.equal(game.turns[2].start.mine.ready, 5);
  assert.equal(game.turns[2].start.mine.drops, 4);
  assert.deepEqual(dropFlow(game), { gained: 3, removed: 4 });
  assert.ok(game.issues.some((s) => s.includes("non attribué")));
  assert.equal(game.startsMidGame, true);
  assert.ok(
    findings(game).every((f) => f.id !== "ink"),
    "a midgame excerpt must not be treated as an opening",
  );
});
test("draw, unknown first player, and perspective 2 are represented truthfully", () => {
  const raw = demoReplay();
  raw.perspective = 2;
  raw.baseSnapshot.viewingAs = 2;
  const g = analyseReplay(raw);
  assert.equal(g.result, "loss");
  assert.equal(g.wentFirst, true);
  raw.winner = 0;
  delete raw.baseSnapshot.firstPlayer;
  const draw = analyseReplay(raw);
  assert.equal(draw.result, "draw");
  assert.equal(draw.wentFirst, null);
  const s = summary([draw]);
  assert.equal(s.rate, null);
  assert.equal(s.draws, 1);
});
test("undo excludes a quest from counters without losing raw alignment", () => {
  const raw = demoReplay();
  raw.frames = raw.frames.slice(0, 6);
  raw.frames.push({
    seq: 7,
    player: 1,
    actionType: "FREE_UNDO:6",
    patch: [
      { op: "replace", path: "/myPlayer/lore", value: 16 },
      { op: "replace", path: "/myPlayer/field/0/exerted", value: false },
    ],
  });
  delete raw.winner;
  const g = analyseReplay(raw);
  assert.equal(
    g.turns.flatMap((t) => t.actions).filter((a) => a.type === "QUEST").length,
    0,
  );
  assert.equal(g.cancelledActions, 1);
  assert.equal(g.positions.length, 8);
  assert.equal(g.result, "unfinished");
});
test("evaluations align exactly, invert perspective, and keep missing values unknown", () => {
  const g = analyseReplay(demoReplay());
  const e = parseEvaluation(
    {
      available: true,
      perspective: 2,
      version: 2,
      winProb: g.positions.map((_, i) => (i === 0 ? null : 0.8)),
    },
    g,
  );
  assert.equal(evaluationForStep(e, 0), null);
  assert.ok(Math.abs(evaluationForStep(e, 1) - 0.2) < 1e-10);
  assert.throws(() =>
    parseEvaluation({ available: true, perspective: 1, winProb: [0.5] }, g),
  );
  assert.equal(evaluationForStep(undefined, 1), null);
});
test("small samples show uncertainty and never produce a confident mulligan verdict", () => {
  const g = analyseReplay(demoReplay());
  const s = summary([g, g]);
  assert.ok(s.interval[0] < 0.4);
  assert.equal(s.second.total, 2);
  assert.equal(s.first.rate, null);
  assert.equal(wilson(0, 0), null);
  assert.ok(findings(g).every((f) => !f.text.includes("tu aurais dû")));
  assert.ok(Math.abs(chanceAtLeastOne(60, 4, 7) - 0.3994996257440235) < 1e-10);
  assert.equal(chanceAtLeastOne(60, 0, 7), 0);
});
test("gzip and archive imports preserve raw replays and notes", () => {
  const raw = strToU8(JSON.stringify(demoReplay()));
  const gz = gzipSync(raw);
  assert.deepEqual(fromBase64(toBase64(gz)), gz);
  const initial = importReplayBytes(gz, "example.replay.gz")[0];
  const zip = zipSync({
    "example.replay.gz": gz,
    "manifest.json": strToU8(
      JSON.stringify({
        format: "inksight-archive-v1",
        notes: [{ id: initial.analysis.id, note: "À revoir tour 6" }],
      }),
    ),
  });
  const restored = importReplayBytes(zip, "backup.zip");
  assert.equal(restored.length, 1);
  assert.equal(restored[0].note, "À revoir tour 6");
  assert.equal(restored[0].analysis.result, "win");
});
