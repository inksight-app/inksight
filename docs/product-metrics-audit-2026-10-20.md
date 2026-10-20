# Inksight : audit fonctionnel et statistique

Revue du code de l’application existante et du contrat public Duels.ink, 20 octobre 2026. Pas de vérification visuelle ni de connexion authentifiée de bout en bout : le navigateur cloud refuse encore l’origine, même après modification annoncée des permissions. Les résultats ci-dessous distinguent les changements de cette branche des travaux ultérieurs.

## Parcours retenu dans cette version

1. Connexion Inksight ; compte personnel et données d’équipe isolés.
2. Chapitre actuel et Core BO1 classé par défaut ; Core BO3 séparé, Archives explicites.
3. Connexion Duels.ink par jeton existant, scan du contexte choisi, ordre d’import du plus récent au plus ancien et contrôle des doublons.
4. Statistiques générales de ce contexte, puis une liste précise pour les cartes et le mulligan.
5. Historique et ouverture d’une manche pour relire ses événements et ses ressources.

Le contexte est commun à l’import, aux statistiques, à l’historique et aux adversaires. Le changement de contexte est bloqué pendant un scan/import actif. Les filtres secondaires sont remis à zéro lors du changement pour éviter une sélection invisible devenue incompatible. Les archives restent dans la base et ne sont pas réécrites.

## Revue des fonctions

| Fonction | Fiabilité / problème | Décision et état |
|---|---|---|
| Import Duels.ink | Historique classé par dernière mise à jour ; libellés de files modifiables. | Corrigé : contexte natif, contrôle local du chapitre, tri par date de partie, pas de sélection aléatoire. |
| Import manuel / ZIP | Pas toujours de saison/file classée vérifiable. | Conservé ; contexte inconnu à vérifier, pas d’assimilation automatique à la saison du jour. |
| Doublons / file d’import | IDs de manche, replay, empreintes et hash ; répétition de scans possible. | Conservé ; l’API ne garantit pas un historique mondial exhaustif. |
| Choix de chapitre | Anciennes étiquettes manuelles de deck assimilées au chapitre du match. | Remplacé par saison/date native ; filtres de set redondants masqués ; étiquettes de deck 13/14 ajoutées. |
| BO1 / BO3 | Une ligne d’historique API est une manche ; compter chaque ligne comme un match fausse le BO3. | Corrigé pour les indicateurs principaux et matchups : résultats par manche et matchs confirmés distincts ; séries incomplètes signalées. |
| Résultats absents / abandons / nuls | Boolean `isWin` ancien : tout autre résultat pouvait devenir une défaite. | Résultat natif conservé dans le contexte. Nuls distingués dans le bilan ; résultats non exploitables exclus des stats. Les mesures détaillées historiques à issue binaire utilisent seulement victoires/défaites. |
| Résumé / coach de partie | Phrases scénarisées prétendant déduire « erreur », cause de défaite ou niveau depuis un score. | Remplacé dans le parcours principal par un résumé factuel local gratuit. Aucun modèle payant appelé. |
| Santé du deck / plan d’action | Verdict arbitraire et recommandations répétées dans plusieurs blocs. | Verdict retiré de l’affichage ; conseils de lecture et contexte factuel. Anciennes fonctions inutilisées à nettoyer lors d’une extraction en modules. |
| Course au lore / événements | Relevés observés ; les fluctuations ne prouvent pas une probabilité de victoire. | Conservés ; lecture par manche et perspective, annulations connues prises en compte. |
| Encre permanente | Maximum incliné et réserve disponible ne sont pas exactement dépenses et gaspillage. | Libellés neutres et rappel de limite ; retrait des accusations automatiques dans les résumés principaux. |
| Inkdrops | Ressource persistante, gains possibles pendant les deux tours, retraits parfois non attribuables à un paiement. | Nouveau graphique séparé et compteurs distincts : obtenues, retirées, paiements déclarés, autres retraits, stock final. Ancienne analyse ≠ zéro mesuré. |
| Cartes en main / board | Valeur de fin de tour observée ; main adverse souvent partiellement masquée. | Conservés avec perspective et couverture ; aucune reconstruction de main cachée. |
| Lore par carte / encrage / séquence / défis | Comptages utiles pour relire une partie. Lore total sensible à la fréquence d’utilisation et à la durée. | Conservés ; ne prouvent pas la meilleure décision ni l’efficacité causale de la carte. |
| Cartes restées longtemps en main | Durée observée utile, mais une carte de réponse peut être gardée intentionnellement. | Conservée comme signal descriptif ; pas de recommandation automatique de retirer le slot. |
| Statistiques par carte | Mélange de listes, survivance des cartes jouées et biais de durée. Une bicolorité n’est pas un archétype. | Cohorte verrouillée sur le hash de liste enregistrée, pas simplement un profil ou des couleurs. Badges « top performer / slot flexible » retirés. Taux conditionnels conservés comme associations descriptives. |
| Mulligan | Choix du joueur non randomisé ; garder une carte corrélé à la qualité du reste de la main. | Fréquences gardées/renvoyées et effectifs ; consignes automatiques et tri « priorité » retirés du bloc principal. |
| Pioche théorique | Ancien raccourci « mulligan = +7 cartes vues » incorrect. | Supprimé ; calcul hypergéométrique sans mulligan, tuteur, sélection ni mélange. |
| Profondeur de deck | Nombre de cartes vues ne signifie pas nombre de cartes distinctes ; projection linéaire de la pioche n’est pas une probabilité validée. | Grille prédictive et « tour de deck » retirés du bloc principal ; volume observé/estimé et couverture conservés. |
| OTP / OTD | Différences par manche, fortement dépendantes du deck/matchup et de l’effectif. | Conservé à l’intérieur du contexte, avec effectifs. Ne pas interpréter une manche BO3 comme le résultat du match. |
| Matchups personnels | Encres adverses disponibles ; pas de liste adverse ni d’archétype certain. | Vue par encres et unités explicites, Wilson 95% descriptif. Série BO3 incomplète exclue du taux par match. |
| Courbes moyennes / victoires vs défaites | Effets de durée et de survivance : les longues parties contribuent différemment aux tours tardifs. | Conservées pour une liste cohérente ; une comparaison causale demanderait une nouvelle étude. |
| Adversaires / notes | Agrégation par pseudonyme, pas d’identifiant adverse stable dans l’historique documenté. | Contexte global appliqué ; risque d’homonymes/changement de pseudo à garder en tête. Notes privées conservées, pas d’identité certifiée. |
| Versions de decks | Regroupement de listes identiques utile ; profil externe éditable ne garantit pas une liste constante. | Hash de liste par partie utilisé pour la cohérence des détails. Pas de fusion destructive automatique. |
| Équipe | Données privées et explicitement partagées doivent rester distinctes. | RLS et contrôle parent/enfant corrigés et testés en transaction ; descriptions HTML sécurisées. |
| Partage / export | Doit rester un choix explicite ; pseudonymes et cartes peuvent apparaître dans une capture. | Conservé ; pas de publication de données privées dans cet audit. |
| Communauté | API stable par paire d’encres/matchup ; date, rangs, ère et unité indispensables. | Repères contextualisés et mis en cache. Aucun écart personnel automatique ni score de niveau ajouté. |

## Données à exploiter ensuite, par ordre d’utilité

| Priorité | Fonction proposée | Données disponibles et condition |
|---|---|---|
| P1 | Repère personnel vs communauté par matchup | `/api/stats/meta`, même ère/file/rangs/période, orientation A/B correcte ; BO3 sur matchs confirmés. Afficher les deux effectifs et l’incertitude. |
| P1 | Suivi de progression / MMR | MMR avant/après, delta, placement, dates de l’historique personnel. Séparer placements et rang, changements de saison et files. |
| P1 | Import incrémental | Curseur / dernière mise à jour avec recouvrement et déduplication, puis classement par saison réelle. Conserver la possibilité d’un rescan. |
| P1 | Sorties T1–T4 de sa liste | Séquences de ses replays, départ, matchup, mulligan et hash de liste ; tableau de fréquences, pas « meilleure sortie » prouvée. |
| P2 | Comparaison de deux versions | Listes canoniques, même chapitre/file et opposition comparable ; effectifs, intervalles et changements exacts de cartes. |
| P2 | Usage des inkdrops | Gains/retraits/stock, tour actif, paiement explicitement déclaré ; mesure de conversion distincte des retraits alternatifs et inconnus. Jeux d’essai Set 14 réels nécessaires. |
| P2 | Connexion OAuth multiutilisateur | Application inscrite sur `/developers`, consentement, state, PKCE et stockage serveur. Trois scopes de lecture seulement. |
| P3 | Sessions d’entraînement privées | Tables privées et suivi autorisés ; c’est une fonction d’écriture supplémentaire, pas une condition des statistiques. |
| Recherche | Probabilité de victoire par position | Aucun endpoint stable public documenté dans la référence consultée. Nécessite un modèle autorisé, données sans fuite d’information cachée, validation hors échantillon et calibration par chapitre. |

## Limites à conserver visibles

- Les anciennes analyses ne gagnent pas rétroactivement une chronologie d’inkdrops ou des champs manquants : réimport requis.
- L’historique léger personnel est actuellement limité aux 1 000 sauvegardes les plus récentes. Une pagination de base sera nécessaire pour des archives plus volumineuses ; les données plus anciennes ne sont pas supprimées.
- Les règles officielles actuelles priment sur les PDF 2025 et les notes non officielles transmis. Le lecteur de replay n’est pas un moteur complet de règles ou de recherche de coups.
- Les nouvelles cartes Set 14 sont ajoutées au catalogue ; les bannissements et errata de toutes les anciennes cartes ne sont pas certifiés par le badge de pool Core.
- Une suite de tests et un build réussi ne valident pas le rendu Safari/iPhone, le consentement Discord ou un import authentifié réel. Ces trois contrôles restent à faire lorsque l’accès sera disponible.

Référence détaillée des routes et des règles : [duels-api-and-set14.md](duels-api-and-set14.md). Sécurité : [security-audit-2026-10-20.md](security-audit-2026-10-20.md).
