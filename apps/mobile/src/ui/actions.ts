import { router } from "expo-router";
import { pickReplays } from "../services/files";
import { useStore } from "../state/store";
export function useImport() {
  const store = useStore();
  return async () => {
    store.setBusy(true);
    store.setError("");
    try {
      const games = await pickReplays();
      if (games.length) {
        await store.add(games);
        router.push("/game");
      }
    } catch (e) {
      store.setError(e instanceof Error ? e.message : "Import impossible.");
    } finally {
      store.setBusy(false);
    }
  };
}
