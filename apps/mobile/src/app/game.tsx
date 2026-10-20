import { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../state/store";
import { findings } from "../domain/statistics";
import { cardName } from "../domain/catalog";
import type { Card, Analysis } from "../domain/types";
import { evaluationForStep, parseEvaluation } from "../domain/evaluation";
import { pickFiles } from "../services/files";
import { strFromU8 } from "fflate";
import {
  Button,
  Header,
  Icon,
  Page,
  Panel,
  Pill,
  Spark,
  Txt,
  pct,
  dateLabel,
} from "../ui/components";
import { FindingCard } from "../ui/findings";
import { ProbabilityChart } from "../ui/probability";
import { C, s } from "../ui/theme";
function CardRow({ card }: { card: Card }) {
  return (
    <View
      style={{
        backgroundColor: C.raised,
        borderRadius: 12,
        padding: 12,
        gap: 5,
        minWidth: 180,
        maxWidth: 280,
        flexGrow: 1,
      }}
    >
      <Txt tone="h3">
        {card.name === "Carte non identifiée" ? cardName(card.id) : card.name}
      </Txt>
      <Txt tone="small">
        {card.cost === null ? "Coût inconnu" : `Coût ${card.cost}`} ·{" "}
        {card.exerted
          ? "Épuisée"
          : card.justPlayed
            ? "Vient d’arriver"
            : "Redressée"}
        {card.inkable === null
          ? ""
          : card.inkable
            ? " · Encrable"
            : " · Non encrable"}
      </Txt>
      {card.damage ? <Txt tone="small">{card.damage} dégâts</Txt> : null}
    </View>
  );
}
export default function Game() {
  const store = useStore();
  const params = useLocalSearchParams<{ turn?: string }>();
  const game = store.selected;
  if (!game)
    return (
      <Page>
        <Header kicker="Analyse de partie" title="Choisis une partie." />
        <Button onPress={() => router.replace("/games")}>
          Ouvrir mes parties
        </Button>
        <Button secondary onPress={() => store.demo()}>
          Explorer l’exemple
        </Button>
      </Page>
    );
  return (
    <GameView
      key={`${game.id}:${params.turn ?? ""}`}
      game={game}
      startTurn={Number(params.turn)}
    />
  );
}
function GameView({ game, startTurn }: { game: Analysis; startTurn: number }) {
  const store = useStore();
  const saved = store.games.find((g) => g.analysis.id === game.id);
  const [step, setStep] = useState(
      () =>
        game.turns.find((t) => t.index === startTurn)?.start.frameIndex ?? 0,
    ),
    [tab, setTab] = useState("position"),
    [note, setNote] = useState(saved?.note ?? ""),
    [notice, setNotice] = useState(""),
    [removeArmed, setRemoveArmed] = useState(false);
  const comments = useMemo(() => findings(game), [game]);
  const position = game.positions[Math.min(step, game.positions.length - 1)],
    action = game.actions[step - 1];
  const probability = evaluationForStep(game.evaluation, step);
  const currentTurn = game.turns.find(
    (t) => step >= t.start.frameIndex && step <= t.end.frameIndex,
  );
  function goTurn(index: number) {
    const t = game?.turns.find((t) => t.index === index);
    if (t) {
      setStep(t.start.frameIndex);
      setTab("position");
    }
  }
  async function saveAnalysis(next: Analysis) {
    if (saved) await store.update({ ...saved, analysis: next });
    else store.select(next);
  }
  async function loadEvaluation(manual = false) {
    store.setBusy(true);
    setNotice("");
    try {
      let raw: unknown;
      if (manual) {
        const files = await pickFiles();
        if (!files.length) return;
        raw = JSON.parse(strFromU8(files[0].bytes));
      } else {
        if (!game?.replayId)
          throw new Error(
            "Ce replay ne contient pas d’identifiant d’évaluation.",
          );
        const response = await fetch(
          `https://duels.ink/api/replay/${encodeURIComponent(game.replayId)}?format=eval`,
          { credentials: "omit", signal: AbortSignal.timeout(15000) },
        );
        if (!response.ok)
          throw new Error(
            "Évaluation non accessible publiquement pour ce replay. L’accès OAuth aux évaluations n’est pas documenté.",
          );
        raw = await response.json();
      }
      const evaluation = parseEvaluation(raw, game!);
      await saveAnalysis({ ...game!, evaluation });
      setNotice(
        manual
          ? "Évaluation importée. Vérifie qu’elle provient bien de cette partie : le format ne contient pas d’identifiant permettant de le certifier."
          : "Évaluation externe chargée. Son algorithme et sa calibration ne sont pas publiés.",
      );
    } catch (e) {
      store.setError((e as Error).message);
    } finally {
      store.setBusy(false);
    }
  }
  async function saveNote() {
    if (!saved) return;
    try {
      await store.update({ ...saved, note });
      setNotice("Note enregistrée sur cet appareil.");
    } catch (e) {
      store.setError((e as Error).message);
    }
  }
  async function removeGame() {
    if (!removeArmed) {
      setRemoveArmed(true);
      return;
    }
    try {
      await store.remove(game.id);
      router.replace("/games");
    } catch (e) {
      store.setError((e as Error).message);
    }
  }
  return (
    <Page>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/games")
        }
        style={[s.row, { minHeight: 44 }]}
      >
        <Icon name="back" />
        <Txt>Mes parties</Txt>
      </Pressable>
      <Header
        kicker={
          game.demo ? "Démonstration · données fictives" : "Analyse de partie"
        }
        title={
          game.demo ? "Lire les ressources." : `Face à ${game.opponentName}`
        }
        detail={`${dateLabel(game.createdAt)} · ${game.wentFirst === null ? "Départ inconnu" : game.wentFirst ? "Tu commences" : "Tu joues en second"} · ${{ win: "Victoire", loss: "Défaite", draw: "Nul", unfinished: "Inachevée" }[game.result]}`}
      />
      {game.demo ? (
        <Panel style={{ borderColor: "#50452C" }}>
          <Txt color={C.gold}>
            Exemple pédagogique : les cartes sont fictives. Ce scénario illustre
            les variations de ressources ; il ne représente pas une ligne de jeu
            à copier.
          </Txt>
          <Txt tone="small">
            Il n’est ni sauvegardé ni inclus dans tes statistiques personnelles.
          </Txt>
        </Panel>
      ) : null}
      <Panel>
        <View style={s.between}>
          <Txt tone="eyebrow">La course aux 20 lore</Txt>
          <View style={s.row}>
            <Txt tone="small" color={C.mint}>
              Toi
            </Txt>
            <Txt tone="small" color={C.purple}>
              Adversaire
            </Txt>
          </View>
        </View>
        <Spark
          values={game.positions.map((p) => p.mine.lore)}
          second={game.positions.map((p) => p.opponent.lore)}
          selected={step}
        />
        <Txt tone="small">
          Chaque point suit un état du replay, y compris les retours en arrière.
          La courbe représente le lore, pas la probabilité de victoire.
        </Txt>
      </Panel>
      <View style={s.wrap}>
        {[
          ["position", "Lecture"],
          ["coach", "Débrief"],
          ["cards", "Cartes & mulligan"],
          ["notes", "Notes"],
        ].map(([key, label]) => (
          <Pill key={key} active={tab === key} onPress={() => setTab(key)}>
            {label}
          </Pill>
        ))}
      </View>
      {tab === "position" ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            <Pill active={step === 0} onPress={() => setStep(0)}>
              Début
            </Pill>
            {game.turns.map((t) => (
              <Pill
                key={t.index}
                active={currentTurn?.index === t.index}
                onPress={() => goTurn(t.index)}
              >{`${t.side === "mine" ? "Toi" : "Adv."} · ${t.ownTurn}`}</Pill>
            ))}
          </ScrollView>
          <Panel>
            <View style={s.between}>
              <Txt tone="h3">
                {step === 0
                  ? "État initial"
                  : `Étape ${step} / ${game.actions.length}`}
              </Txt>
              <Pill color={action?.cancelled ? C.gold : C.mint}>
                {action?.cancelled
                  ? "ANNULÉE"
                  : `MANCHE · TOUR ${position.round}`}
              </Pill>
            </View>
            <Txt>
              {action
                ? `${action.side === "mine" ? "Toi" : action.side === "opponent" ? "Adversaire" : "Jeu"} · ${action.label}${action.cardName ? ` · ${action.cardName}` : ""}`
                : "Avant la première action enregistrée."}
            </Txt>
            <View style={s.row}>
              <View style={s.flex}>
                <Button
                  secondary
                  disabled={step === 0}
                  onPress={() => setStep(Math.max(0, step - 1))}
                >
                  Précédent
                </Button>
              </View>
              <View style={s.flex}>
                <Button
                  disabled={step === game.actions.length}
                  onPress={() =>
                    setStep(Math.min(game.actions.length, step + 1))
                  }
                >
                  Suivant
                </Button>
              </View>
            </View>
          </Panel>
          <View style={s.row}>
            <Panel style={s.flex}>
              <Txt tone="eyebrow">Toi</Txt>
              <Txt tone="number" color={C.mint}>
                {position.mine.lore}
              </Txt>
              <Txt tone="small">
                {position.mine.ready} / {position.mine.permanent} encres
                redressées
              </Txt>
              <Txt color={C.gold}>{position.mine.drops} inkdrop(s)</Txt>
              <Txt tone="small">{position.mine.handCount} cartes en main</Txt>
            </Panel>
            <Panel style={s.flex}>
              <Txt tone="eyebrow">Adversaire</Txt>
              <Txt tone="number" color={C.purple}>
                {position.opponent.lore}
              </Txt>
              <Txt tone="small">
                {position.opponent.ready} / {position.opponent.permanent} encres
                redressées
              </Txt>
              <Txt color={C.gold}>{position.opponent.drops} inkdrop(s)</Txt>
              <Txt tone="small">
                {position.opponent.handCount} cartes en main
              </Txt>
            </Panel>
          </View>
          <Txt tone="h2">Ta main à cet instant</Txt>
          <View style={s.wrap}>
            {position.mine.hand.length ? (
              position.mine.hand.map((c, i) => (
                <CardRow key={`${c.instanceId}:${i}`} card={c} />
              ))
            ) : (
              <Txt>Aucune carte dans la main connue.</Txt>
            )}
          </View>
          <Txt tone="h2">Ton plateau</Txt>
          <View style={s.wrap}>
            {position.mine.field.length ? (
              position.mine.field.map((c, i) => (
                <CardRow key={`${c.instanceId}:${i}`} card={c} />
              ))
            ) : (
              <Txt>Aucun permanent connu en jeu.</Txt>
            )}
          </View>
          <Txt tone="h2">Plateau adverse</Txt>
          <View style={s.wrap}>
            {position.opponent.field.length ? (
              position.opponent.field.map((c, i) => (
                <CardRow key={`${c.instanceId}:${i}`} card={c} />
              ))
            ) : (
              <Txt>Aucun permanent adverse connu en jeu.</Txt>
            )}
          </View>
          <Panel>
            <View style={s.between}>
              <Txt tone="h3">Évaluation duels.ink</Txt>
              <Txt tone="h2" color={C.mint}>
                {pct(probability)}
              </Txt>
            </View>
            {game.evaluation ? (
              <ProbabilityChart evaluation={game.evaluation} selected={step} />
            ) : null}
            <Txt>
              {game.evaluation
                ? "Valeur externe pour cette étape, du point de vue de ton replay. Une étape vide reste inconnue. Une variation ne constitue pas une preuve d’erreur."
                : "Aucune évaluation chargée. Inksight ne fabrique pas de pourcentage de victoire."}
            </Txt>
            <Txt tone="small">
              L’algorithme et sa calibration ne sont pas publiés. L’endpoint
              observé sur un replay public n’est pas un engagement d’API stable
              ni une garantie d’accès aux parties privées.
            </Txt>
            {!game.demo ? (
              <View style={s.wrap}>
                {game.replayId ? (
                  <Button
                    secondary
                    onPress={() => void loadEvaluation()}
                    disabled={store.busy}
                  >
                    Chercher l’évaluation publique
                  </Button>
                ) : null}
                <Button
                  secondary
                  onPress={() => void loadEvaluation(true)}
                  disabled={store.busy}
                >
                  Importer un JSON d’évaluation
                </Button>
              </View>
            ) : null}
          </Panel>
        </>
      ) : null}
      {tab === "coach"
        ? comments.map((f) => (
            <FindingCard key={f.id} finding={f} onTurn={goTurn} />
          ))
        : null}
      {tab === "cards" ? (
        <>
          <Panel>
            <Txt tone="h3">Main de départ</Txt>
            {game.opening.known ? (
              <>
                <Txt tone="small">Conservées</Txt>
                {game.opening.kept.map((c, i) => (
                  <Txt key={`k${i}`} color={C.mint}>
                    {c.name}
                  </Txt>
                ))}
                <Txt tone="small">Remplacées</Txt>
                {game.opening.returned.map((c, i) => (
                  <Txt key={`r${i}`}>{c.name}</Txt>
                ))}
                <Txt tone="small">Main après le mulligan</Txt>
                {game.opening.resolved.map((c, i) => (
                  <Txt key={`s${i}`}>{c.name}</Txt>
                ))}
              </>
            ) : (
              <Txt>
                Le mulligan n’est pas observable dans ce replay. Aucune
                recommandation de garder ou remplacer n’est calculée.
              </Txt>
            )}
          </Panel>
          <Panel>
            <Txt tone="h3">Usage observé des cartes</Txt>
            <View style={s.between}>
              <Txt tone="small" style={s.flex}>
                Carte
              </Txt>
              <Txt tone="small">Jouée · Encrée</Txt>
            </View>
            {game.cardUse.map((c) => (
              <View key={c.id} style={s.between}>
                <Txt style={s.flex}>
                  {c.name === c.id ? cardName(c.id) : c.name}
                </Txt>
                <Txt color={C.text}>
                  {c.played} · {c.inked}
                </Txt>
              </View>
            ))}
            <Txt tone="small">
              Comptage des actions reconnues, après annulations. Les cartes
              jouées par un effet sans action explicite ne sont pas déduites du
              seul changement de zone.
            </Txt>
          </Panel>
        </>
      ) : null}
      {tab === "notes" ? (
        <Panel>
          <Txt tone="h3">À garder pour la prochaine.</Txt>
          <TextInput
            accessibilityLabel="Note personnelle de partie"
            multiline
            maxLength={10000}
            value={note}
            onChangeText={setNote}
            style={[s.input, { minHeight: 160, textAlignVertical: "top" }]}
            placeholder="Mon plan de mulligan, un tour à revoir, une carte à tester…"
            placeholderTextColor={C.muted}
          />
          <Button onPress={saveNote} disabled={!saved}>
            Enregistrer ma note
          </Button>
          {saved ? (
            <>
              <Button secondary onPress={removeGame}>
                {removeArmed
                  ? "Confirmer le retrait de cette partie"
                  : "Retirer de cet appareil"}
              </Button>
              {removeArmed ? (
                <>
                  <Txt tone="small">
                    Le replay et sa note seront retirés de cette bibliothèque
                    locale. Les fichiers d’origine restent disponibles à
                    l’endroit où tu les as conservés.
                  </Txt>
                  <Button secondary onPress={() => setRemoveArmed(false)}>
                    Conserver la partie
                  </Button>
                </>
              ) : null}
            </>
          ) : null}
          {!saved ? (
            <Txt tone="small">
              Les notes sont disponibles pour les parties réellement importées.
            </Txt>
          ) : null}
        </Panel>
      ) : null}
      {notice ? (
        <Panel>
          <Txt color={C.mint}>{notice}</Txt>
        </Panel>
      ) : null}
    </Page>
  );
}
