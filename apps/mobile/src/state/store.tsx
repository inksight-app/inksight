import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Analysis, StoredGame } from "../domain/types";
import { demoAnalysis } from "../domain/demo";
import { fromBase64, importReplayBytes } from "../domain/files";
const KEY = "inksight.local.v1";
type Store = {
  games: StoredGame[];
  selected: Analysis | null;
  loaded: boolean;
  busy: boolean;
  error: string;
  setError: (s: string) => void;
  add: (g: StoredGame[]) => Promise<void>;
  update: (g: StoredGame) => Promise<void>;
  remove: (id: string) => Promise<void>;
  select: (g: Analysis) => void;
  demo: () => void;
  setBusy: (b: boolean) => void;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [games, setGames] = useState<StoredGame[]>([]),
    [selected, select] = useState<Analysis | null>(null);
  const [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const current = useRef<StoredGame[]>([]);
  const readable = useRef(true);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY)
      .then((value) => {
        if (!active || !value) return;
        const data = JSON.parse(value);
        if (
          !Array.isArray(data) ||
          data.some((g) => typeof g.replayGzip !== "string")
        )
          throw new Error("Archive locale non reconnue.");
        const restored = data.map((g) => {
          const result = importReplayBytes(
            fromBase64(g.replayGzip),
            g.fileName ?? g.analysis?.fileName ?? "partie.replay",
          )[0];
          return {
            ...result,
            note: typeof g.note === "string" ? g.note : "",
            analysis: {
              ...result.analysis,
              evaluation: g.evaluation ?? g.analysis?.evaluation,
            },
          };
        });
        current.current = restored;
        setGames(restored);
      })
      .catch(() => {
        readable.current = false;
        if (active)
          setError(
            "La sauvegarde locale n’a pas pu être lue. Elle est conservée ; l’écriture est bloquée pour la protéger.",
          );
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const persist = async (next: StoredGame[]) => {
    if (!loaded)
      throw new Error("La sauvegarde locale est encore en cours de lecture.");
    if (!readable.current)
      throw new Error(
        "La sauvegarde existante est illisible. L’écriture est bloquée pour la protéger.",
      );
    try {
      await AsyncStorage.setItem(
        KEY,
        JSON.stringify(
          next.map((g) => ({
            replayGzip: g.replayGzip,
            fileName: g.analysis.fileName,
            evaluation: g.analysis.evaluation,
            note: g.note,
          })),
        ),
      );
    } catch {
      throw new Error(
        "Sauvegarde impossible sur cet appareil. Exporte ton archive et vérifie l’espace disponible.",
      );
    }
    current.current = next;
    setGames(next);
  };
  const add = async (incoming: StoredGame[]) => {
    const map = new Map(current.current.map((g) => [g.analysis.id, g]));
    incoming.forEach((g) => {
      const old = map.get(g.analysis.id);
      map.set(g.analysis.id, {
        ...g,
        note: old?.note ?? g.note,
        analysis: {
          ...g.analysis,
          evaluation: old?.analysis.evaluation ?? g.analysis.evaluation,
        },
      });
    });
    await persist(
      [...map.values()].sort((a, b) =>
        (b.analysis.createdAt ?? "").localeCompare(a.analysis.createdAt ?? ""),
      ),
    );
    if (incoming.length) select(map.get(incoming[0].analysis.id)!.analysis);
  };
  const update = async (game: StoredGame) => {
    await persist(
      current.current.map((g) =>
        g.analysis.id === game.analysis.id ? game : g,
      ),
    );
    select(game.analysis);
  };
  const remove = async (id: string) => {
    await persist(current.current.filter((g) => g.analysis.id !== id));
    if (selected?.id === id) select(null);
  };
  return (
    <Context.Provider
      value={{
        games,
        selected,
        loaded,
        busy,
        error,
        setError,
        add,
        update,
        remove,
        select,
        demo: () => select(demoAnalysis()),
        setBusy,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error("Store unavailable");
  return value;
}
