import { Tabs } from "expo-router";
import { C } from "../../ui/theme";
import { Icon, type IconName } from "../../ui/components";
const icons: Record<string, IconName> = {
  index: "home",
  games: "games",
  decks: "cards",
  coach: "coach",
};
export default function Layout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: C.bg },
        tabBarActiveTintColor: C.mint,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: {
          backgroundColor: "#10151D",
          borderTopColor: C.line,
          paddingTop: 10,
          height: 82,
          paddingBottom: 18,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
        tabBarIcon: ({ color }) => (
          <Icon
            name={icons[route.name] ?? "home"}
            color={typeof color === "string" ? color : C.muted}
            size={21}
          />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Aujourd’hui" }} />
      <Tabs.Screen name="games" options={{ title: "Parties" }} />
      <Tabs.Screen name="decks" options={{ title: "Cartes" }} />
      <Tabs.Screen name="coach" options={{ title: "Coach" }} />
    </Tabs>
  );
}
