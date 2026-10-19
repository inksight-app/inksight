import { useMemo } from "react";
import { Linking, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../../state/store";
import { findings } from "../../domain/statistics";
import {
  Button,
  Header,
  Page,
  Panel,
  Pill,
  Txt,
  dateLabel,
} from "../../ui/components";
import { FindingCard } from "../../ui/findings";
import { C, s } from "../../ui/theme";
import meta from "../../data/meta.json";
const inkNames: Record<string, string> = {
  amber: "Ambre",
  amethyst: "Améthyste",
  emerald: "Émeraude",
  ruby: "Rubis",
  sapphire: "Saphir",
  steel: "Acier",
};
export default function Coach() {
  const store = useStore();
  const game = store.selected ?? store.games[0]?.analysis;
  const rows = useMemo(() => (game ? findings(game) : []), [game]);
  const pairs = [...meta.pairs].sort((a, b) => b.games - a.games).slice(0, 6);
  return (
    <Page>
      <Header
        kicker="Le débrief, sans abonnement IA"
        title="Un regard de plus."
        detail="Des constats vérifiables et des questions utiles. Chaque commentaire vient d’une règle statistique locale."
      />
      <View style={s.wrap}>
        <Pill color={C.mint}>0 APPEL À UNE IA</Pill>
        <Pill>COACH STATISTIQUE V1</Pill>
      </View>
      {game ? (
        <>
          <View style={s.between}>
            <Txt tone="h2">
              {game.demo ? "Exemple fictif" : `Face à ${game.opponentName}`}
            </Txt>
            <Pill>{dateLabel(game.createdAt)}</Pill>
          </View>
          {rows.map((f) => (
            <FindingCard
              key={f.id}
              finding={f}
              onTurn={(turn) => {
                store.select(game);
                router.push({ pathname: "/game", params: { turn } });
              }}
            />
          ))}
        </>
      ) : (
        <Panel>
          <Txt tone="h3">Le coach part de tes parties.</Txt>
          <Txt>
            Importe un replay pour retrouver les choix d’encrage, le mulligan
            connu et les ressources restantes à la fin des tours.
          </Txt>
          <Button
            secondary
            onPress={() => {
              store.demo();
              router.push("/game");
            }}
          >
            Découvrir sur l’exemple
          </Button>
        </Panel>
      )}
      <Panel style={{ borderColor: "#39465D" }}>
        <Txt tone="eyebrow" color={C.purple}>
          Nouvelles mécaniques
        </Txt>
        <Txt tone="h3">Les inkdrops restent en réserve.</Txt>
        <Txt>
          Ils ne disparaissent pas à la fin du tour. Un inkdrop retiré peut
          payer une encre, mais un retrait peut aussi être un autre coût. Garder
          des gouttes peut donc faire partie du plan de jeu.
        </Txt>
        <Txt tone="small">
          Règles 2.3.0, §1.13.1.2 et FAQ Hyperia City · 16 octobre 2026.
        </Txt>
        <Button
          secondary
          onPress={() =>
            void Linking.openURL(
              "https://www.disneylorcana.com/en-US/news/2026/10/hyperia-city-set-release-notes",
            )
          }
        >
          Lire la source officielle
        </Button>
      </Panel>
      <Txt tone="h2">Repères de la communauté</Txt>
      <Panel>
        <Txt tone="small">
          {meta.scope} · {meta.games.toLocaleString("fr-FR")} parties · calcul
          du {dateLabel(meta.updatedAt)}. Instantané, sans mise à jour
          automatique.
        </Txt>
        {pairs.map((pair) => (
          <View key={pair.colors.join("/")} style={s.between}>
            <View style={s.flex}>
              <Txt color={C.text}>
                {pair.colors.map((c) => inkNames[c] ?? c).join(" / ")}
              </Txt>
              <Txt tone="small">
                {pair.games.toLocaleString("fr-FR")} participations
              </Txt>
            </View>
            <Txt tone="h3">{pair.winRate.toFixed(1)} %</Txt>
          </View>
        ))}
        <Txt tone="small">
          Chaque partie compte deux participations. Ces moyennes par couleurs ne
          désignent pas les meilleures listes et ne prouvent pas qu’une carte
          cause une victoire.
        </Txt>
        <Button secondary onPress={() => void Linking.openURL(meta.source)}>
          Voir les statistiques duels.ink
        </Button>
      </Panel>
      <Panel>
        <Txt tone="h3">Ce qu’on ne peut pas encore noter.</Txt>
        <Txt>
          Attribuer une « erreur » à chaque action demande de comparer les
          alternatives légales, sans connaître la main adverse ni les futures
          pioches. Une baisse d’évaluation seule ne suffit pas : aucune
          précision globale ni « meilleur coup » n’est inventé ici.
        </Txt>
        <Txt tone="small">
          Les statistiques d’archétypes et de mulligan de duels.ink ne font pas
          partie du contrat public stable de leur API. La première version
          s’appuie sur tes imports et les agrégats par couleurs documentés.
        </Txt>
      </Panel>
    </Page>
  );
}
