# Refonte Inksight · validation du pilote

État du 19 octobre 2026. Branche `codex/inksight-ios-statistical-coach`. L’application historique à la racine et son déploiement Vercel sont conservés. Le nouveau code vit dans `apps/mobile`, l’adaptateur duels.ink dans `apps/integrations/duels`.

## Choix de produit

Une application native React Native/Expo, iOS en priorité, avec un export web issu du même code pour la prévisualisation. Interface sombre, chiffres lisibles, surfaces sobres, accents vert et violet. Pas de modèle de langage, d’API OpenAI, d’embeddings ou de dépense d’inférence. Le coach assemble des constats et questions à partir des données réellement observées. L’hébergement futur, Apple Developer et le stockage peuvent avoir leurs propres coûts ; le pilote local ne les active pas.

## Vérifié sur les données

| Sujet | Preuve | Conséquence |
|---|---|---|
| Format replay | Un replay partagé réel, gzip puis JSON `duels-replay-v1`, 119 frames | Reconstruire les états avec les patches ; aucune analyse par vidéo requise |
| Champs optionnels | Le sérialiseur omet les propriétés undefined, puis émet replace/remove dessus | Compatibilité sur les feuilles d’objet ; parents absents et indices invalides restent des erreurs |
| Retours en arrière | `FREE_UNDO:71` et `FREE_UNDO:116` dans ce replay | Exclure les actions annulées des compteurs, garder les frames pour l’alignement |
| Informations cachées | Main du joueur connue, main adverse masquée ; `deckOrder` présent dans des états internes | Le coach normalisé ne reçoit jamais l’ordre futur du deck, ni une main adverse reconstruite a posteriori |
| Courbe duels.ink | Réponse publique `available`, `version:2`, `perspective`, tableau `winProb` de 120 entrées dont 116 valeurs | Import/chargement externe facultatif ; valeurs nulles inconnues ; inversion selon perspective |
| Algorithme d’évaluation | Frontend observe `format=eval` et mode search ; aucune implémentation serveur publiée | Impossible d’affirmer le modèle, la recherche ou la calibration ; aucun score de précision interne |
| Inkdrops | Règles 2.3.0 et FAQ Hyperia City, §1.13.1.2 | Stock conservé entre tours, séparé des cartes du puits ; retrait ≠ toujours paiement d’encre |
| Catalogue | Lorcast sets 1–14 : 3 242 impressions, 2 682 noms/versions | Snapshot versionné anglais, réimpressions regroupées ; pas d’autorité fondée sur des drapeaux de légalité en retard |
| Méta publique | Contrat API : `colorPairs`, `matchups`, `activity.totalGames`, `updatedAt` | Utiliser les champs stables ; afficher date et échantillon ; deux participations par partie |
| OAuth | Application confidentielle + code PKCE, scopes profil/historique/replays | Petit backend obligatoire, pas de secret dans l’iPhone ; intégration non activée dans ce pilote |

Le vrai replay contrôlé date du set 13. Il prouve la compatibilité legacy et les annulations ; **il ne prouve pas la reconstruction d’un replay set 14 avec inkdrops réels**. Les champs `inkDrops` sont confirmés dans le client public actuel, et les variations sont testées avec des fixtures. Un replay personnel récent reste nécessaire pour valider les timings réels des nouvelles capacités.

## Statistiques retenues

- Taux de victoire par manche décisive, nuls et parties inachevées séparés, intervalle de Wilson à 95 %.
- Play/draw uniquement quand le premier joueur est connu ; aucun départ inconnu converti en premier joueur.
- Actions reconnues par tour, cartes jouées/encrées, mulligan observé, ressources encore redressées avant la transition de tour.
- Inkdrops : variations nettes entre états, y compris pendant le tour adverse. Un effet peut générer puis consommer dans une même frame : les flux bruts ne sont alors pas identifiables. Les retraits non explicitement attribués ne sont pas convertis en dépenses d’encre.
- Probabilité hypergéométrique de voir une copie, sans remise ni bonus arbitraire de mulligan.
- Une situation à revoir n’est pas une erreur certifiée. Un petit échantillon ne produit pas une recommandation de mulligan assurée.

## Suite utile, à partir des données personnelles

Après validation du lecteur sur des replays récents : ajouter le regroupement par version de deck et format, les matchups par couleurs révélées avec couverture affichée, les séquences d’ouverture effectivement observées, puis la comparaison des ressources/cartes accessibles avant les tours décisifs. L’historique officiel apporte aussi rang, file, saison et identifiants de matchs pour éviter de mélanger BO1, BO3 et environnements.

Pour comparer des choix, stratifier au minimum play/draw, version du deck, adversaire observable, période et niveau, et publier les effectifs/incertitudes. Une carte souvent jouée dans les victoires peut simplement être jouée quand la partie est déjà favorable. L’API agrégée publique ne donne pas de séquences complètes ni de contrefactuels permettant de résoudre ce biais.

Un modèle local de probabilité pourra être envisagé plus tard avec un corpus autorisé suffisant, une séparation entraînement/test par partie/joueur/période et des métriques de calibration. Il aura un coût de développement/calcul même sans facture par appel ; il n’est pas nécessaire pour le premier coach utile.

## Sources vérifiées

- [Duels developers](https://duels.ink/developers), [API Markdown](https://duels.ink/api-docs.md), [référence OAuth](https://duels.ink/api-docs#oauth).
- [Statistiques Core BO1](https://duels.ink/stats/core-bo1). Snapshot du 19 octobre 2026, 01:32 UTC, 190 109 parties ; fichiers de données sans identités.
- [FAQ officielle Hyperia City](https://www.disneylorcana.com/en-US/news/2026/10/hyperia-city-set-release-notes), [règles françaises octobre 2026](https://files.disneylorcana.com/CRUpdate_FR_Oct-2026.pdf).
- [API Lorcast](https://lorcast.com/docs/api), [cartes set 14](https://api.lorcast.com/v0/sets/14/cards).
- [Documentation Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [Expo Router](https://docs.expo.dev/router/introduction/).

## État de livraison

Le pilote fournit du code natif, un export web, un catalogue et un moteur d’analyse testés. Il ne constitue pas une livraison App Store/TestFlight. Il reste à valider visuellement sur iPhone, tester l’import/partage sur appareil et mesurer la mémoire avec une bibliothèque importante. L’outil de contrôle de navigateur requis pour la QA Sites n’étant pas disponible dans cette session, la prévisualisation n’a pas fait l’objet d’un test visuel automatisé. La compilation et les tests de domaine ne remplacent pas cette étape.

La mise en service OAuth nécessite l’infrastructure décrite dans le README du connecteur. L’ancien Supabase inactif n’a pas été réactivé. Aucun service d’IA payant n’a été ajouté.
