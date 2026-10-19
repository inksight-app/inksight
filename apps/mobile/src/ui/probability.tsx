import { View } from "react-native";
import Svg, { Line, Polyline } from "react-native-svg";
import type { Evaluation } from "../domain/types";
import { C } from "./theme";
export function ProbabilityChart({
  evaluation,
  selected,
}: {
  evaluation: Evaluation;
  selected: number;
}) {
  const w = 600,
    h = 145,
    p = 10,
    segments: string[][] = [];
  let active: string[] = [];
  evaluation.values.forEach((v, i) => {
    if (v === null) {
      if (active.length) segments.push(active);
      active = [];
    } else
      active.push(
        `${p + (i * (w - 2 * p)) / Math.max(1, evaluation.values.length - 1)},${h - p - v * (h - 2 * p)}`,
      );
  });
  if (active.length) segments.push(active);
  const x =
    p + (selected * (w - 2 * p)) / Math.max(1, evaluation.values.length - 1);
  return (
    <View
      accessible
      accessibilityLabel="Évaluation externe duels.ink, les étapes sans valeur sont laissées vides"
      style={{ height: h }}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`}>
        <Line
          x1={p}
          x2={w - p}
          y1={h / 2}
          y2={h / 2}
          stroke={C.line}
          strokeDasharray="4 7"
        />
        {segments.map((segment, i) => (
          <Polyline
            key={i}
            points={segment.join(" ")}
            stroke={C.mint}
            strokeWidth={3}
            fill="none"
          />
        ))}
        <Line x1={x} x2={x} y1={p} y2={h - p} stroke={C.muted} />
      </Svg>
    </View>
  );
}
