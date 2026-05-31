# Audit UX/UI — InkSight

> Audit mené en conditions réelles : compte de test peuplé (120 matchs + games/cartes/tours
> copiés depuis un compte réel), app buildée localement (`vite build` + `preview`), parcours
> capturé via Playwright en **desktop 1440px** et **mobile 390px**. Captures dans `audit/shots/`.

## 0. Cadre & personas

| Persona | Besoin clé | Lecture de l'audit |
|---|---|---|
| **Le Compétiteur** | Winrate & matchups lisibles en 1 seconde, densité type dashboard de trading | Pénalisé par l'enfouissement de la donnée sous les filtres |
| **Le Joueur Passionné** | UI premium, immersive, « screenshotable » | Pénalisé par l'empilement de cadres (glass dans glass) qui salit le rendu |

Vocabulaire : l'app est **bien alignée** sur la communauté Lorcana (bicolorité, archétype
Aggro/Midrange/Control, matchup, OTP/OTD, WR match vs WR game, encré/inkable, mulligan). Rien à
corriger côté lexique — c'est un atout de crédibilité à préserver.

Sévérités : **P0** (casse l'expérience, à traiter d'abord) · **P1** (fort impact) · **P2** (polish).

---

## 1. Constats transverses (toutes vues stats)

### P0 — La donnée est enterrée sous le « chrome »
Avant d'atteindre le **winrate**, l'utilisateur traverse **4 blocs empilés** :
1. Héro `Statistiques & historique` (énorme, répété sur chaque onglet) ;
2. Onglets `Mes statistiques / Historique` ;
3. **Barre de filtres géante, toujours dépliée** (≈ 960px de haut sur mobile à elle seule) ;
4. Onglets de détail (`Vue d'ensemble / Cartes / …`).

Conséquence mesurée sur mobile : le winrate apparaît à **y ≈ 1480px**, soit **~2 écrans** de
scroll (cf. `m-overview-s00..s02`). Pour le Compétiteur qui veut « la donnée en 1 seconde »,
c'est l'anti-pattern absolu. Même « Masquer les filtres » laisse toutes les rangées de pills
visibles (cf. `m-cards-s01`).
→ **Divulgation progressive** : montrer d'abord le résultat, plier les filtres par défaut.

### P0 — Filtre : densité ingérable au pouce
La barre empile 9 groupes de pills (Bicolorité, Archétype, Adversaire, Résultat, Format,
Départ, Période, Set, Action) toujours ouverts. Sur mobile chaque groupe prend une ligne
pleine → un mur de boutons (cf. `m-cards-s00/s01`). Référence fintech : les filtres complexes
vivent dans un **tiroir/bottom-sheet** déclenché par un bouton « Filtrer (n) », pas en
permanence au-dessus de la donnée.

### P1 — Hiérarchie typographique : aucun chiffre ne domine
Dans la vue d'ensemble, `120`, `53%`, `Données solides` sont **3 KPIs de poids égal**
(`desktop-02`). Le winrate — la métrique reine — ne ressort pas. Un dashboard de trading fait
l'inverse : **un** chiffre massif (winrate) domine, le reste est secondaire et muted.

### P1 — Winrate affiché en double
Sur le même écran filtré : KPI `Winrate filtré 53%` **et** héro `Santé du deck 53%`
(`desktop-03`). Deux fois la même info, concurrentes. À fusionner en une seule source de vérité.

### P1 — Empilement de glass (« cadre-dans-cadre »)
Chaque KPI, carte coach, carte plan d'action, mini-signal, carte matchup est un **panneau glass
bordé** distinct. Résultat : séparation par cadres au lieu d'espace → bruit visuel, rendu
« sale » que le brief veut bannir. Référence : séparer par la **respiration** (marges
généreuses), réserver le glass à **un** niveau (le bloc héro), aplatir les sous-éléments.

### P1 — Redondance des blocs de « conseil »
Trois dispositifs de guidage se chevauchent : `Santé du deck` (tags + jauges), le coach
`À retenir / Point fort / À surveiller`, et le `Plan d'action` (`Priorité / Ressource /
Deckbuilding`). Le Compétiteur n'a pas besoin de trois reformulations ; le Passionné se perd.
→ Fusionner en **un** bloc diagnostic compact.

### P2 — Numérique non tabulaire
Les chiffres clés utilisent bien JetBrains Mono mais sans `font-variant-numeric: tabular-nums`
systématique → légers décalages de colonnes dans les listes/tokens (cf. tuiles cartes).

---

## 2. Audit par vue

### 2.1 Analyse / Landing (`desktop-01`, `mobile-01`) — **Bon**
Hiérarchie claire (titre InkSight massif, CTA, dropzone). Rien d'urgent. P2 : la dropzone et le
panneau « Replays importés » pourraient partager une grille plus respirante sur desktop.

### 2.2 Stats — Vue d'ensemble (`desktop-02/03`, `m-overview-*`) — **P0/P1**
Cœur du problème transverse (cf. §1). Refonte cible :
- Bandeau résultat **sticky compact** en tête : winrate dominant + V/D + taille d'échantillon +
  contexte deck, en **un** bloc héro. C'est la « hero stat ».
- Filtres repliés dans un tiroir « Filtrer (n) ».
- Diagnostic fusionné (1 bloc) au lieu de coach + plan + santé.
- KPIs secondaires (durée, main critique, lore) en ligne de **jauges plates**, sans cadres.

### 2.3 Stats — Cartes & Mulligan Lab (`desktop-04-cards/mulligan`, `m-cards-*`) — **P1/P2**
Tuiles riches et lisibles (art + badges + tokens + barres keep/mulligan vert/rouge correctes).
Points : bordures lourdes (carte-dans-carte), et l'accès est plombé par le filtre géant au-dessus.
P2 : harmoniser tuiles cartes / mulligan / dead-weight (même DOM, classes différentes).

### 2.4 Stats — Matchups (`desktop-04-matchups`, `m-matchups`) — **Bon/P2**
Cartes par bicolorité adverse claires (WR match / V·total / WR game + barre). Très proche du
« winrate matrix » communautaire. P2 : passer en **matrice/tableau dense** trierait mieux le
besoin Compétiteur (comparaison rapide). Réserver les dots d'encre pour l'identité visuelle.

### 2.5 Stats — Courbes (`desktop-04-curves`) — **Bon**
Graphiques Chart.js soignés (lore/main, plan par tour). P2 : readout chiffré en `tabular-nums`.

### 2.6 Stats — Données (`desktop-04-data`) — **Bon**
4 KPIs + « Données détaillées » repliable. Cohérent. P2 : même traitement de hiérarchie que §2.2.

### 2.7 Historique (`desktop-05`, `m-history-*`) — **Bon**
Très réussi : cartes de match denses, rail de résultat vert/rouge à gauche, badges
(Duels.ink API / matchmaking / core-bo1 / COMPLÈTE), menu ⋯, détail déplié riche. Modèle de
densité « screenshotable ». P2 : le même héro répété + filtre lourd au-dessus.

### 2.8 Compte / Équipe (`desktop-06`, `m-account-*`) — **P2**
Cartes empilées très aérées (Connecté, Connecter Duels.ink, Rejoindre une équipe). Sur mobile,
le bouton **« Mémoriser la clé chiffrée » déborde/se coupe** dans sa pill (`m-account-s01`) →
petit bug à corriger. Sinon RAS.

---

## 3. Plan de refonte priorisé

| Lot | Contenu | Sévérité | Personas | Effort |
|---|---|---|---|---|
| **L1 — Respiration & divulgation progressive** | Filtres repliés par défaut dans un tiroir « Filtrer (n) » ; héro de page compacté ; le winrate remonte au-dessus de la ligne de flottaison | P0 | Les deux | M |
| **L2 — Hiérarchie de la vue d'ensemble** | Un seul héro winrate dominant ; suppression du winrate dupliqué ; KPIs secondaires en jauges plates ; fusion coach/plan/santé en 1 diagnostic | P1 | Compétiteur++ | M |
| **L3 — Aplatissement glass** | Un seul niveau de glass par zone ; sous-éléments sans bordure, séparés par l'espace ; `tabular-nums` généralisé | P1 | Passionné++ | M |
| **L4 — Matchups en matrice + polish** | Vue matchups dense triable ; harmonisation des tuiles ; fix bouton mobile « Mémoriser la clé » | P2 | Compétiteur | S |

Chaque lot est livré **isolément** (captures avant/après, build vérifié) et validé avant le
suivant. Réutilisation du design system existant (`--theme-color-1/2`, `--good/--bad/--muted`,
`--font-mono`, `--radius-*`, `.glass`) — pas de nouvelles couleurs.

## 4. Méthode de vérification (rejouable)
`node scripts/audit-shots.mjs` (MODE=capture desktop+mobile, MODE=mslice tranches mobiles) avec
`SR`/`ANON` en env. Comparaison avant/après sur les mêmes vues. `npm run build` doit rester vert
(contrainte Rolldown : pas de quote simple dans les `${}`).
