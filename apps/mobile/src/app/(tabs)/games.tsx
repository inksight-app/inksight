import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../../state/store";
import { exportArchive } from "../../services/files";
import {
  Button,
  Header,
  Icon,
  Page,
  Panel,
  Pill,
  Txt,
  dateLabel,
} from "../../ui/components";
import { C, s } from "../../ui/theme";
import { useImport } from "../../ui/actions";
export default function Games() {
  const store = useStore(),
    importGames = useImport();
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all");
  const rows = store.games.filter(
    (g) =>
      (filter === "all" || g.analysis.result === filter) &&
      `${g.analysis.opponentName} ${g.note} ${g.analysis.fileName}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  async function backup() {
    try {
      await exportArchive(store.games);
    } catch (e) {
      store.setError((e as Error).message);
    }
  }
  return (
    <Page>
      <Header
        kicker="Bibliothèque personnelle"
        title="Tes parties."
        detail="Retrouve une décision, une main, une idée à tester."
      />
      <View style={s.wrap}>
        <Button
          icon="plus"
          onPress={importGames}
          disabled={store.busy || !store.loaded}
        >
          Importer
        </Button>
        <Button
          secondary
          icon="download"
          onPress={backup}
          disabled={!store.games.length}
        >
          Exporter l’archive
        </Button>
      </View>
      <TextInput
        accessibilityLabel="Rechercher une partie"
        placeholder="Adversaire, note ou fichier…"
        placeholderTextColor={C.muted}
        value={query}
        onChangeText={setQuery}
        style={s.input}
      />
      <View style={s.wrap}>
        {[
          ["all", "Toutes"],
          ["win", "Victoires"],
          ["loss", "Défaites"],
        ].map(([key, label]) => (
          <Pill
            key={key}
            active={filter === key}
            onPress={() => setFilter(key)}
          >
            {label}
          </Pill>
        ))}
      </View>
      {rows.length ? (
        rows.map((g) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Analyser la partie contre ${g.analysis.opponentName}`}
            key={g.analysis.id}
            onPress={() => {
              store.select(g.analysis);
              router.push("/game");
            }}
          >
            <Panel>
              <View style={s.between}>
                <View style={s.flex}>
                  <Txt tone="h3">{g.analysis.opponentName}</Txt>
                  <Txt tone="small">
                    {dateLabel(g.analysis.createdAt)} ·{" "}
                    {g.analysis.wentFirst === null
                      ? "Départ inconnu"
                      : g.analysis.wentFirst
                        ? "Sur le play"
                        : "Sur la draw"}
                  </Txt>
                </View>
                <Pill
                  color={
                    g.analysis.result === "win"
                      ? C.mint
                      : g.analysis.result === "loss"
                        ? C.red
                        : C.muted
                  }
                >
                  {
                    {
                      win: "Victoire",
                      loss: "Défaite",
                      draw: "Nul",
                      unfinished: "Inachevée",
                    }[g.analysis.result]
                  }
                </Pill>
                <Icon name="arrow" />
              </View>
              {g.note ? <Txt>{g.note}</Txt> : null}
            </Panel>
          </Pressable>
        ))
      ) : (
        <Panel>
          <Icon name="games" size={30} color={C.mint} />
          <Txt tone="h3">
            {store.games.length
              ? "Aucun résultat."
              : "Une partie suffit pour commencer."}
          </Txt>
          <Txt>
            Importe un fichier .replay, .replay.gz, JSON ou une archive ZIP
            issue de duels.ink. Réimporter le même replay ne crée pas de
            doublon.
          </Txt>
          {!store.games.length ? (
            <Button
              secondary
              onPress={() => {
                store.demo();
                router.push("/game");
              }}
            >
              Voir l’exemple
            </Button>
          ) : null}
        </Panel>
      )}
      <Panel>
        <Txt tone="eyebrow">Connexion duels.ink</Txt>
        <Txt tone="h3">OAuth officiel identifié.</Txt>
        <Txt>
          La connexion demandera uniquement le profil, l’historique et les
          replays. Le serveur doit encore être configuré pour conserver le
          secret et les jetons hors de l’iPhone.
        </Txt>
        <Pill>NON CONFIGURÉE</Pill>
      </Panel>
    </Page>
  );
}
