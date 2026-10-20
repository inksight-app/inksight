import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import Svg, { Path, Circle, Rect, Line, Polyline } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, s } from "./theme";
import { useStore } from "../state/store";
export type IconName =
  | "home"
  | "games"
  | "cards"
  | "coach"
  | "plus"
  | "arrow"
  | "drop"
  | "close"
  | "back"
  | "download";
const paths: Record<string, string> = {
  home: "M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  games: "M4 4h16v16H4ZM8 8h8M8 12h8M8 16h4",
  cards: "m6 3 14 2-2 17-14-2ZM9 8l6 1M8 12l6 1",
  coach: "M5 5h14v11H9l-4 4ZM9 9h6M9 12h4",
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  drop: "M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12Z",
  close: "m6 6 12 12M6 18 18 6",
  back: "m15 5-7 7 7 7",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
};
export function Icon({
  name,
  size = 22,
  color = C.muted,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d={paths[name]} />
    </Svg>
  );
}
export function Txt({
  children,
  tone = "body",
  color,
  style,
}: {
  children: React.ReactNode;
  tone?: "title" | "h2" | "h3" | "body" | "small" | "eyebrow" | "number";
  color?: string;
  style?: StyleProp<import("react-native").TextStyle>;
}) {
  return (
    <Text style={[s[tone], color ? { color } : null, style]}>{children}</Text>
  );
}
export function Panel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[s.panel, style]}>{children}</View>;
}
export function Button({
  children,
  onPress,
  secondary = false,
  disabled = false,
  icon,
}: {
  children: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingVertical: 13,
        paddingHorizontal: 18,
        borderRadius: 14,
        backgroundColor: secondary ? C.raised : C.mint,
        opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
      })}
    >
      {icon ? (
        <Icon name={icon} size={18} color={secondary ? C.text : C.bg} />
      ) : null}
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: secondary ? C.text : C.bg,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
export function Pill({
  children,
  active = false,
  onPress,
  color,
}: {
  children: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  const body = (
    <Text
      style={{
        fontSize: 12,
        fontWeight: "600",
        color: color ?? (active ? C.bg : C.muted),
      }}
    >
      {children}
    </Text>
  );
  const style = {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 20,
    backgroundColor: active ? C.mint : C.raised,
  };
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={style}
    >
      {body}
    </Pressable>
  ) : (
    <View style={style}>{body}</View>
  );
}
export function Page({ children }: { children: React.ReactNode }) {
  const { error, setError, loaded } = useStore();
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.page}>
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        {error ? (
          <Panel style={{ borderColor: C.red }}>
            <Txt color={C.red}>{error}</Txt>
            <Button secondary onPress={() => setError("")}>
              Fermer le message
            </Button>
          </Panel>
        ) : null}
        {!loaded ? <ActivityIndicator color={C.mint} /> : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Header({
  kicker,
  title,
  detail,
  right,
}: {
  kicker: string;
  title: string;
  detail?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={{ gap: 12, paddingTop: 8, paddingBottom: 5 }}>
      <View style={s.between}>
        <Txt tone="eyebrow">{kicker}</Txt>
        {right}
      </View>
      <Txt tone="title">{title}</Txt>
      {detail ? <Txt>{detail}</Txt> : null}
    </View>
  );
}
export const pct = (n: number | null) =>
  n === null ? "—" : `${Math.round(n * 100)} %`;
export const dateLabel = (date: string | null) =>
  date
    ? new Date(date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      })
    : "Date inconnue";
export function Spark({
  values,
  color = C.mint,
  second,
  selected,
}: {
  values: number[];
  color?: string;
  second?: number[];
  selected?: number;
}) {
  const width = 600,
    height = 145,
    pad = 10,
    max = Math.max(20, ...values, ...(second ?? []));
  const points = (a: number[]) =>
    a
      .map(
        (v, i) =>
          `${pad + (i * (width - 2 * pad)) / Math.max(1, a.length - 1)},${height - pad - (v / max) * (height - 2 * pad)}`,
      )
      .join(" ");
  return (
    <View
      accessible
      accessibilityLabel="Évolution des points de lore, toi en vert et adversaire en violet"
      style={{ height: 145, width: "100%" }}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        <Line
          x1={pad}
          x2={width - pad}
          y1={height / 2}
          y2={height / 2}
          stroke={C.line}
          strokeDasharray="4 7"
        />
        <Line
          x1={pad}
          x2={width - pad}
          y1={height - pad}
          y2={height - pad}
          stroke={C.line}
        />
        {second ? (
          <Polyline
            points={points(second)}
            fill="none"
            stroke={C.purple}
            strokeWidth={3}
          />
        ) : null}
        <Polyline
          points={points(values)}
          fill="none"
          stroke={color}
          strokeWidth={3}
        />
        {selected !== undefined ? (
          <Line
            x1={
              pad +
              (selected * (width - 2 * pad)) / Math.max(1, values.length - 1)
            }
            x2={
              pad +
              (selected * (width - 2 * pad)) / Math.max(1, values.length - 1)
            }
            y1={pad}
            y2={height - pad}
            stroke={C.muted}
            strokeDasharray="3 5"
          />
        ) : null}
      </Svg>
    </View>
  );
}
export function Ring({ value }: { value: number | null }) {
  const r = 40,
    c = 2 * Math.PI * r;
  return (
    <Svg width={100} height={100} viewBox="0 0 100 100">
      <Circle
        cx={50}
        cy={50}
        r={r}
        stroke={C.line}
        strokeWidth={7}
        fill="none"
      />
      <Circle
        cx={50}
        cy={50}
        r={r}
        stroke={C.mint}
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${c * (value ?? 0)} ${c}`}
        rotation={-90}
        origin="50,50"
      />
      <Rect x={47} y={38} width={6} height={24} rx={3} fill={C.mint} />
    </Svg>
  );
}
