import { View } from "react-native";
import { router } from "expo-router";
import { useMemo } from "react";
import { useStore } from "../../state/store";
import { summary } from "../../domain/statistics";
import {
  Button,
  Header,
  Page,
  Panel,
  Pill,
  Ring,
  Txt,
  pct,
} from "../../ui/components";
import { C, s } from "../../ui/theme";
import { useImport } from "../../ui/actions";
export default function Home() {
  const store = useStore(),
    importGames = useImport();
  const data = useMemo(
    () => summary(store.games.map((g) => g.analysis)),
    [store.games],
  );
  return (
    <Page>
      <Header
        kicker="Inksight / ton espace de jeu"
        title={"Chaque partie,\nun peu plus claire."}
        right={<Pill color={C.mint}>VERSION PILOTE</Pill>}
      />
      <Panel style={{ backgroundColor: "#19271F", borderColor: "#324A3B" }}>
        <View style={s.between}>
          <View style={s.flex}>
            <Txt tone="eyebrow" color={C.mint}>
              Ta progression
            </Txt>
            <Txt tone="number" style={{ marginTop: 14 }}>
              {pct(data.rate)}
            </Txt>
            <Txt>Taux de victoire · manches importées</Txt>
          </View>
          <Ring value={data.rate} />
        </View>
        <Txt tone="small">
          {data.completed
            ? `${data.wins} victoire(s) · ${data.losses} défaite(s) · ${data.draws} nul(s)`
            : "Ton historique commence avec ta première partie."}
        </Txt>
        {data.interval ? (
          <Txt tone="small">
            Intervalle à 95 % : {pct(data.interval[0])} à{" "}
            {pct(data.interval[1])}.{" "}
            {data.completed < 30 ? "Échantillon encore limité." : ""}
          </Txt>
        ) : null}
        <Button
          onPress={importGames}
          disabled={store.busy || !store.loaded}
          icon="plus"
        >
          {store.busy ? "Lecture du replay…" : "Importer mes replays"}
        </Button>
      </Panel>
      <View style={s.row}>
        <Panel style={s.flex}>
          <Txt tone="eyebrow">Manches</Txt>
          <Txt tone="number">{data.total}</Txt>
          <Txt tone="small">{data.unfinished} inachevée(s)</Txt>
        </Panel>
        <Panel style={s.flex}>
          <Txt tone="eyebrow">Tours joués</Txt>
          <Txt tone="number">{data.averageTurns?.toFixed(1) ?? "—"}</Txt>
          <Txt tone="small">Moyenne observée</Txt>
        </Panel>
      </View>
      <View style={s.between}>
        <Txt tone="h2">Le départ compte.</Txt>
        <Pill>PLAY / DRAW</Pill>
      </View>
      <Panel>
        <View style={s.row}>
          <View style={s.flex}>
            <Txt tone="small">Tu commences</Txt>
            <Txt tone="h2" color={C.mint}>
              {pct(data.first.rate)}
            </Txt>
            <Txt tone="small">{data.first.total} manches décisives</Txt>
          </View>
          <View style={s.flex}>
            <Txt tone="small">Tu joues en second</Txt>
            <Txt tone="h2" color={C.purple}>
              {pct(data.second.rate)}
            </Txt>
            <Txt tone="small">{data.second.total} manches décisives</Txt>
          </View>
        </View>
        <Txt tone="small">
          Les départs inconnus sont exclus des deux groupes. Les nuls sont
          exclus du taux de victoire.
        </Txt>
      </Panel>
      <View style={s.between}>
        <Txt tone="h2">Une lecture plus utile.</Txt>
      </View>
      <Panel>
        <Txt tone="h3">Revoir la décision, garder le contexte.</Txt>
        <Txt>
          Ta main connue, tes ressources et tes actions, tour après tour. Le
          coach relève des situations à revoir et explique les chiffres sans
          facturer d’analyse IA.
        </Txt>
        <Button
          secondary
          onPress={() => {
            store.demo();
            router.push("/game");
          }}
          icon="arrow"
        >
          Explorer un exemple fictif
        </Button>
        <Txt tone="small">
          L’exemple illustre les ressources. Il n’entre jamais dans tes
          statistiques.
        </Txt>
      </Panel>
      <Txt tone="small">
        Tes imports restent sur cet appareil. Exporte une archive depuis Parties
        pour conserver tes replays et tes notes. La connexion OAuth à duels.ink
        sera activée après configuration du serveur.
      </Txt>
    </Page>
  );
}
