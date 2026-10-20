import type { Analysis, Evaluation } from "./types.ts";
export function parseEvaluation(input: unknown, game: Analysis): Evaluation {
  const data = input as any;
  if (
    data?.available !== true ||
    !Array.isArray(data.winProb) ||
    ![1, 2].includes(data.perspective)
  )
    throw new Error(
      "Aucune évaluation Duels.ink disponible dans cette réponse.",
    );
  if (data.winProb.length !== game.positions.length)
    throw new Error(
      "Cette évaluation ne correspond pas au nombre d’étapes du replay.",
    );
  const values = data.winProb.map((v: unknown) => {
    if (v === null) return null;
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1)
      throw new Error("Une probabilité du fichier est invalide.");
    return data.perspective === game.perspective ? v : 1 - v;
  });
  return {
    source: "duels.ink",
    version: Number.isInteger(data.version) ? data.version : null,
    perspective: game.perspective,
    values,
    fetchedAt: new Date().toISOString(),
  };
}
export function evaluationForStep(
  evaluation: Evaluation | undefined,
  frameIndex: number,
): number | null {
  return evaluation?.values[frameIndex] ?? null; // Missing means unknown; do not display a fabricated 50%.
}
