import { View } from "react-native";
import type { Finding } from "../domain/types";
import { Button, Panel, Pill, Txt } from "./components";
import { C, s } from "./theme";
export function FindingCard({
  finding,
  onTurn,
}: {
  finding: Finding;
  onTurn?: (n: number) => void;
}) {
  return (
    <Panel>
      <View style={s.wrap}>
        <Pill
          color={
            finding.kind === "review"
              ? C.gold
              : finding.kind === "fact"
                ? C.mint
                : C.purple
          }
        >
          {finding.kind === "review"
            ? "À REVOIR"
            : finding.kind === "fact"
              ? "CONSTAT"
              : "DONNÉES"}
        </Pill>
      </View>
      <Txt tone="h3">{finding.title}</Txt>
      <Txt>{finding.text}</Txt>
      <Txt tone="small">{finding.source}</Txt>
      {finding.turnIndex !== undefined && onTurn ? (
        <Button secondary onPress={() => onTurn(finding.turnIndex!)}>
          Revoir ce tour
        </Button>
      ) : null}
    </Panel>
  );
}
