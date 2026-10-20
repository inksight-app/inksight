import { useDeferredValue, useMemo, useState } from "react";
import { Linking, TextInput, View } from "react-native";
import { allCards, catalog, coreCards } from "../../domain/catalog";
import { chanceAtLeastOne } from "../../domain/statistics";
import {
  Button,
  Header,
  Page,
  Panel,
  Pill,
  Txt,
  pct,
  dateLabel,
} from "../../ui/components";
import { C, s } from "../../ui/theme";
export default function Decks() {
  const [query, setQuery] = useState(""),
    [core, setCore] = useState(true),
    [limit, setLimit] = useState(20);
  const [deck, setDeck] = useState("60"),
    [copies, setCopies] = useState("4"),
    [seen, setSeen] = useState("7");
  const search = useDeferredValue(query.toLowerCase());
  const pool = core ? coreCards : allCards;
  const rows = useMemo(
    () =>
      pool.filter((c) => `${c.name} ${c.text}`.toLowerCase().includes(search)),
    [pool, search],
  );
  let probability: number | null = null;
  try {
    if (deck && copies && seen)
      probability = chanceAtLeastOne(
        Number(deck),
        Number(copies),
        Number(seen),
      );
  } catch {}
  return (
    <Page>
      <Header
        kicker="Le bon outil, au bon tour"
        title="Connaître ses cartes."
        detail="Catalogue à jour du set 14. Noms et textes anglais de la source, sans traduction inventée."
      />
      <Panel>
        <Txt tone="eyebrow">Probabilité de pioche</Txt>
        <Txt tone="h3">Trouver au moins une copie.</Txt>
        <View style={s.row}>
          {[
            [deck, setDeck, "Deck"],
            [copies, setCopies, "Copies"],
            [seen, setSeen, "Cartes vues"],
          ].map(([value, set, label]) => (
            <View style={s.flex} key={label as string}>
              <Txt tone="small">{label as string}</Txt>
              <TextInput
                accessibilityLabel={label as string}
                style={s.input}
                value={value as string}
                onChangeText={set as (s: string) => void}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
          ))}
        </View>
        <Txt tone="number" color={C.mint}>
          {pct(probability)}
        </Txt>
        <Txt tone="small">
          Tirage sans remise, deck mélangé uniformément. Pas de mulligan, de
          pioche supplémentaire ou d’information cachée supposée. Ce calcul
          n’est pas une recommandation de garder une main.
        </Txt>
      </Panel>
      <View style={s.between}>
        <Txt tone="h2">Bibliothèque</Txt>
        <Pill>{`${rows.length} cartes`}</Pill>
      </View>
      <View style={s.wrap}>
        <Pill
          active={core}
          onPress={() => {
            setCore(true);
            setLimit(20);
          }}
        >
          Pool Core · sets 9 à 14
        </Pill>
        <Pill
          active={!core}
          onPress={() => {
            setCore(false);
            setLimit(20);
          }}
        >
          Tous les sets
        </Pill>
      </View>
      <TextInput
        accessibilityLabel="Rechercher une carte"
        value={query}
        onChangeText={(q) => {
          setQuery(q);
          setLimit(20);
        }}
        style={s.input}
        placeholder="Nom ou texte de carte, en anglais…"
        placeholderTextColor={C.muted}
      />
      <Txt tone="small">
        {catalog.cards.length.toLocaleString("fr-FR")} impressions ·{" "}
        {allCards.length.toLocaleString("fr-FR")} noms/versions · synchronisé le{" "}
        {dateLabel(catalog.fetchedAt)}. Réimpressions regroupées. Le filtre Core
        couvre les impressions des sets 9 à 14 ; les bannissements et règles de
        tournoi restent à vérifier.
      </Txt>
      {rows.slice(0, limit).map((c) => (
        <Panel key={c.canonical}>
          <View style={s.between}>
            <View style={s.flex}>
              <Txt tone="h3">{c.name}</Txt>
              <Txt tone="small">
                {c.colors.join(" / ")} · {c.type.join(" · ")} · Set {c.set} #
                {c.number}
              </Txt>
            </View>
            <View
              style={{
                backgroundColor: C.raised,
                borderRadius: 14,
                padding: 12,
                minWidth: 44,
                alignItems: "center",
              }}
            >
              <Txt color={C.mint} tone="h2">
                {String(c.cost)}
              </Txt>
            </View>
          </View>
          <Txt>{c.text || "Aucun texte de capacité."}</Txt>
          <View style={s.between}>
            <Txt tone="small">
              {c.inkable ? "Encrable" : "Non encrable"}
                {typeof c.lore === "number" ? ` · Lore ${c.lore}` : ""}
            </Txt>
            <Txt tone="small">EN · Lorcast</Txt>
          </View>
        </Panel>
      ))}
      {rows.length > limit ? (
        <Button secondary onPress={() => setLimit(limit + 20)}>
          Afficher 20 cartes de plus
        </Button>
      ) : null}
      <Button
        secondary
        onPress={() =>
          void Linking.openURL("https://www.disneylorcana.com/en-US/resources")
        }
      >
        Règles et documents officiels
      </Button>
    </Page>
  );
}
