# duels.ink et Lorcana Set 14 — contrat retenu

Vérification : 20 octobre 2026. Référence développeur : https://duels.ink/api-docs.md ; inscription : https://duels.ink/developers

## API et décisions

| Fonction officielle | Dans cette livraison |
|---|---|
| GET /api/me | Validation d’un jeton avant stockage ; identifiant stable, scopes et expiration du fournisseur conservés. Pas de lien basé sur un pseudonyme. |
| GET /api/me/match-history | Résultats sauvegardés par pages de 250, indépendamment du replay. Fenêtre de mise à jour fixe, reprise signée, checkpoint atomique après la dernière page, recouvrement de 5 minutes. Core classé Set 14 validé côté serveur. |
| POST /api/me/bulk-replays | Lots de 1 000 maximum ; URLs limitées aux domaines documentés ; téléchargements cadencés. |
| Replays /r et CDN | Redirections HTTPS bornées ; aucun Bearer transféré au CDN ; fichiers bornés et validation locale du replay. |
| GET /api/stats/meta | Repères communautaires repliables dans Mes statistiques : ère actuelle découverte, champs stables, date/effectif, cache par file ET chapitre, ETag local. Rang et semaines restent à intégrer. Refus d’une réponse d’un autre contexte. |
| OAuth authorization code + PKCE | À activer après inscription et accès à la configuration serveur. Non implémenté comme connexion active dans cette livraison. |
| POST /api/me/bulk-gamelogs | Piste utile pour compléter la traçabilité des actions ; non nécessaire au parseur actuel et non branché. |
| GET /api/stats/coconut et /card/{cardId} | Données exclusivement du format Coconut. Aucune extrapolation au Core ; pas de taux de victoire mondial par carte Core disponible dans ces routes. |
| Tables privées / cups | Hors périmètre : l’outil d’analyse n’a pas besoin de permissions d’organisation ou d’écriture. |

Les nouveaux jetons OAuth sont confidentiels côté serveur, en lecture seule, avec `profile match_history:read replays:read`. Pas de refresh token : reconnexion à expiration/révocation. Une nouvelle autorisation remplace le jeton précédent du même joueur pour la même application. Le code d’échange expire en 60 secondes.

Pour l’utilisation personnelle d’Inksight, le jeton personnel existant suffit : passer par `/developers` n’est pas obligatoire. L’inscription devient pertinente pour une connexion multiutilisateur « Autoriser Inksight », avec consentement et scopes limités. La documentation indique que les identifiants sont fournis dès l’inscription ; l’application en attente de revue porte un avertissement de non-vérification. Aucune application OAuth ni nouveau secret n’a été créé pour cette livraison.

Configuration future à enregistrer chez duels.ink : homepage HTTPS du site, callback exact du backend, trois scopes ci-dessus, durée limitée. Le client_secret ne doit jamais aller dans le frontend, Git, un préfixe VITE_ ou le chat. Il faudra state lié à la session, PKCE S256, consommation atomique unique, traitement du refus et stockage chiffré. Cette version n’ajoute pas une demi-connexion OAuth non sécurisée.

Les champs internes des pages de statistiques (archétypes, ouvertures, profils) ne sont pas un contrat API. Des essais anonymes du 20 octobre ont donné tantôt des champs internes vides, tantôt remplis, malgré une documentation annonçant qu’ils sont vides. Ils ne sont donc pas une dépendance exploitable de façon fiable. Le calcul du pourcentage de victoire du lecteur de replay n’est pas documenté dans la référence publique consultée : pas d’intégration promise sur un endpoint interne.

## Audit d’intégration complémentaire

- **Connexion officielle** : le stockage chiffré accepte déjà un jeton OAuth, mais il manque le départ d’autorisation, le callback et l’échange serveur. Le parcours recommandé est de lier Duels.ink au compte Inksight existant, en conservant d’abord Discord. Une connexion unique via un fournisseur OAuth personnalisé Supabase est une piste, pas un parcours testé : correspondance `id`/`name`/`image`, absence d’e-mail, liaison de l’identité existante et confidentialité du jeton fournisseur doivent être vérifiées. Référence : https://supabase.com/docs/guides/auth/custom-oauth-providers
- **Revue de l’application** : la documentation est contradictoire sur la possibilité d’autoriser une app avant approbation (introduction restrictive, détail `pending` avec avertissement). Tester avec le propriétaire, puis faire valider avant ouverture à d’autres joueurs. Aucun client OAuth ni secret n’a été créé pendant l’audit.
- **Résultats d’abord — livré** : table privée `duelink_game_results`, fusion par `game_id` avec les analyses existantes. Les résultats sans replay restent inclus ; les statistiques de cartes, mulligan et Tempo utilisent seulement les parties analysées. Bouton « Analyser » par partie ; les lots restent facultatifs. Aucun lecteur embarqué ajouté.
- **Synchronisation incrémentale — livré** : premier passage sur le set actuel, puis `last_sync_at` moins 5 minutes. Bornes fixées côté serveur, curseur opaque dans une continuation HMAC liée à l’utilisateur et au jeton, détection des cycles, pas de checkpoint en cas d’échec. La version d’observation est la borne haute : le contrat ne donne pas de `updated_at` par ligne. Le checkpoint et la dernière page sont écrits dans une même transaction. Un remplacement de clé invalide les reprises et réinitialise le scan. Les suppressions restent masquées après resynchronisation.
- **Données sous-exploitées** : MMR avant/après, MMR adverse, durée, motif de fin et URL de journal sont déjà présents dans les métadonnées importées examinées. Ils permettent progression, résultats par niveau adverse, durée et concessions sans modèle IA. Distinguer placements, bots, données manquantes et formats.
- **Manifestes et CDN — livré** : chaque téléchargement utilise l’URL du manifeste autorisé, limitée aux hôtes documentés ; un replay manquant n’est pas recherché par une autre route. Bearer supprimé vers le CDN. Les lots sont espacés d’au moins 6,1 secondes, car l’URL peut être un lien public `/r` à 10/minute, même avec OAuth. Le proxy borné conserve la CSP et n’ajoute aucune autorisation navigateur externe.
- **Gamelogs** : `/bulk-gamelogs` et `/g` sont complémentaires, propres au participant. Tester leur schéma réel sur Set 14, annulations et Inkdrops avant rapprochement avec les replays ; pas d’accès à la main cachée adverse.
- **Méta comparable** : ajouter rang/période seulement si utile, avec cache par tous les paramètres et confirmation du contexte appliqué. Le filtre `ranks` impose le rang aux deux joueurs. Un essai Set 14 BO1, semaine du 18 octobre, Iconic ne contenait que 32 parties : éviter de multiplier les filtres par défaut. Deux essais conditionnels ont renvoyé 200 avec le même ETag et contenu au lieu du 304 annoncé ; le cache local ne doit pas dépendre de cette optimisation amont.
- **Déconnexion** : supprimer le lien Inksight efface son jeton stocké, sans révoquer automatiquement le jeton chez Duels.ink. La révocation reste une action du compte Duels.ink tant qu’aucune route de révocation pour l’app n’est documentée.

Le delta MMR natif est affiché discrètement dans l’historique, hors placements ; zéro et absence ne sont pas confondus. Priorité suivante : OAuth de liaison, puis progression et comparaisons communautaires cohérentes. Tables privées/coupes peuvent servir à l’entraînement plus tard, avec une autorité d’organisation distincte des scopes OAuth de lecture. L’option privée expérimentale `otdInkDrop` ne représente pas une règle générale du Core classé et ne doit pas polluer ses statistiques.

Migration additive appliquée : `20261020145806_duelink_native_results_sync` ; source SQL : `docs/sql/duels-results-sync.sql`. RLS propriétaire, privilèges explicites (aucun accès anonyme), fonctions SECURITY INVOKER. Tests en transaction annulée : accès croisé refusé, ingestion atomique, anciennes observations ignorées, suppressions conservées ; aucun enregistrement de test conservé et aucune analyse historique supprimée. La validation navigateur authentifiée reste bloquée par la permission d’origine enregistrée : elle n’est pas remplacée par une session administrateur ou un autre outil.

Migration complémentaire `20261020150607_duelink_analysis_identity` : unicité utilisateur + identifiant natif (aucun doublon existant avant application), pour éviter une double analyse concurrente dans deux onglets. Un conflit renvoie l’analyse du propriétaire sans l’écraser. Checkpoint lié à la connexion courante, annulation sur échec et suppression atomique également vérifiés en transaction annulée.

## Activation OAuth et analyse coup par coup

Pas d’action requise du propriétaire pour cette livraison : le jeton personnel mémorisé reste utilisable. Pour une future connexion « Autoriser Inksight » :

1. Enregistrer Inksight dans `/developers`, avec sa homepage de production et les trois scopes de lecture.
2. Implémenter et tester les routes de départ/callback côté serveur et le stockage à usage unique de state/PKCE avant de fournir une URL de callback définitive à enregistrer. Ne pas enregistrer une route seulement imaginée.
3. Configurer le client ID et le client secret côté serveur via Vercel ; jamais dans le chat, Git ou une variable `VITE_`. Conserver le compte Inksight/Discord existant et y lier Duels.ink.
4. Tester refus, expiration, rejeu de callback, changement de compte et absence d’e-mail. Vérifier le statut de revue auprès de Duels.ink avant ouverture publique. Aucun coût de modèle IA nécessaire.

Les échanges Discord fournis par le propriétaire (Lyuz, 25 juillet et 30 septembre 2026) indiquent que Duels.ink emploie du MCTS et un modèle entraîné pour certaines évaluations, avec un état de plateau complet. Ils ne fournissent ni moteur open source ni contrat d’évaluation public. Le MCTS explore des actions via un simulateur : ce n’est pas une API que l’on peut brancher directement sur les logs. Avec la perspective du joueur, il faudrait en plus échantillonner l’information adverse inconnue, sans réutiliser une connaissance acquise plus tard dans la partie. Aucune probabilité ni verdict de « meilleur coup » n’est donc fabriqué dans cette version.

Prochaine investigation utile : relier les événements du journal aux états/annulations du replay, mesurer la couverture des Inkdrops et séparer mesures observées, motifs heuristiques et évaluations nécessitant un moteur. Une analyse après partie ne doit jamais prétendre connaître la main ou la liste complète cachée de l’adversaire.

## Interprétation des statistiques

- Les matchups BO3 agrégés comptent des matchs terminés, pas des manches.
- Cette garantie BO3 porte explicitement sur `matchups` ; le contrat ne justifie pas d’assimiler le `winRate` de `colorPairs` à un taux par match. Ce taux n’est donc pas affiché comme référence BO3.
- Les volumes par couleurs sont des apparitions de decks ; les additionner ne donne pas le nombre de parties uniques.
- Un matchup est une paire non ordonnée ; winsA décrit le côté A. Les égalités empêchent de déduire les victoires B par games − winsA.
- Afficher effectif, date, format et ère. Les données communautaires ne sont ni les résultats personnels ni la probabilité de gagner une position précise.
- Le coach reste un système de phrases locales : aucun appel OpenAI ou coût de modèle ajouté.

## Inventaire des autres fonctions documentées

| Famille | Données / usage | Décision pour Inksight |
|---|---|---|
| GET/POST/DELETE `/api/me/api-tokens` | Administration des jetons du compte ; création/révocation depuis une session navigateur, pas par un jeton API. | Ne pas demander cette autorité pour analyser des parties. |
| GET/POST/DELETE `/api/me/oauth-apps`, POST `rotate-secret` | Enregistrer, lister, supprimer une application et faire tourner son secret, depuis la session Duels.ink du développeur. | Configuration ponctuelle future ; pas une API de données de jeu. |
| GET `/oauth/authorize`, POST `/api/oauth/token` | Consentement, code éphémère et échange serveur avec PKCE. | Recommandé lors d’une ouverture à plusieurs joueurs ; backend dédié requis. |
| POST `/api/table/create`, GET `/api/table/{tableId}/view` | Créer une table privée, réserver des joueurs/listes et suivre son démarrage. | Piste future de sessions d’entraînement, avec permission d’écriture séparée. Inutile pour importer l’historique. |
| POST `/api/cup/host` | Organiser une coupe privée, inscriptions et listes verrouillées. | Hors périmètre de l’analyse individuelle. |
| GET `/draft/new?cubecana=…` | Lien de création d’un draft Cubecana. | Hors périmètre Core classé. |
| GET `/decks/new?import=…`, GET `/d/{code}` | Liens d’import ou partage de deck ; IDs de cartes canoniques `set-number`. | Utile pour exporter une liste exacte et fusionner les variantes d’illustration, sans prétendre lire les decks privés adverses. |
| POST `/api/me/bulk-gamelogs`, GET `/g/{game_id}` | Manifeste et journal de partie autorisé. | À utiliser si une mesure exige des actions absentes du replay, après rapprochement des événements/annulations. |
| GET `/api/stats/coconut`, GET `/api/stats/coconut/card/{id}` | Utilisation, synergies, agrégats anonymisés et listes publiques du format Coconut ; filtres de fenêtre. | Ne pas les présenter comme méta Core ou comme historique exhaustif de tous les joueurs. |

`match-history` fournit une ligne par **manche terminée**, pas par match BO3. Les champs utiles comprennent : `game_id`, `match_id`, numéro de manche, format, source/mode, identifiant de file, indicateur classé, saison, dates, résultat, motif de fin, durée/tours, départ, lore final, MMR avant/après/delta et placements, liste/identifiant/encres du deck personnel, nom/encres/MMR adverse, références de replay et de gamelog. La liste complète du deck adverse n’est pas fournie.

Les champs natifs `your_decklist` et `opp_display_name` sont explicitement pris en charge par l’import. Les listes personnelles déjà présentes dans les anciennes données brutes sont relues par projection ciblée : pas de réimport ou de réécriture des sauvegardes pour récupérer ces informations. L’identité d’une liste inclut les identifiants et quantités, indépendamment de l’ordre ou de lignes dupliquées, pour comparer exactement les cohortes disponibles.

Attention : `from` inclusif et `to` exclusif portent sur la **dernière mise à jour**, pas sur le début de partie. La borne basse réduit le scan ; la saison et `started_at` doivent encore être contrôlés côté Inksight. Une borne haute fondée sur le chapitre pourrait exclure une ancienne partie mise à jour tardivement ; elle n’est pas utilisée pour les archives. Les imports choisissent les parties admissibles les plus récentes dans un ordre déterministe.

Les manifestes groupés limitent les appels ; les liens CDN documentés se téléchargent sans Bearer. Les quotas ne doivent pas être contournés par parallélisme : historique 20 requêtes/minute/utilisateur, 250 lignes/page ; lot de manifeste 1 000 identifiants au maximum ; statistiques publiques 60 requêtes/minute/IP et cache quotidien recommandé. Les limites propres aux autres routes restent celles du fournisseur.

## Comparaisons personnelles : ce qui est faisable

Les comparaisons défendables utilisent la même ère, file, unité, période, population de rangs et bicolorité. Les endpoints publics permettent des repères par paire d’encres et matchup, pas une comparaison exacte d’archétypes/listes. En BO3, il faut regrouper par `match_id` et disposer d’une conclusion confirmée ; une série incomplète ne devient pas automatiquement une défaite.

Cette livraison affiche les repères publics et les résultats personnels contextualisés. Le calcul automatique de l’écart personnel/communauté, le filtrage des rangs et des semaines, la correction du biais d’opposition et les intervalles sur cet écart restent à développer. Il faut conserver les deux effectifs et ne jamais convertir cet écart en « niveau du joueur ».

## Règles et cartes

Core actuel : sets 9–14 et réimpressions de même identité. L’arrivée du set 14 n’est pas une nouvelle rotation. Sources :
https://duels.ink/release-notes/2026-10-08-set-14-release
https://www.disneylorcana.com/en-US/news/2026/08/rotation

Le catalogue historique est conservé et 242 références imprimées du set 14 sont ajoutées (cartes/variantes, pas 242 designs uniques), source Lorcast, langue anglaise, relevé du 19 octobre. Ce complément n’est pas une validation exhaustive de tous les anciens textes ou des cartes bannies. Le badge « Pool Core » indique le pool de sets, pas une certification de légalité de deck.

Le périmètre personnel est désormais le set actuel, Core BO1 et BO3 classés ensemble. Le filtre habituel BO1/BO3 est facultatif. L’interface n’ajoute pas de sélecteur de chapitre ; le nettoyage historique explicitement demandé a été traité séparément. Par défaut, tous les decks sont inclus : choisir une bicolorité révèle ses versions pour affiner. Une absence de partie dans le périmètre affiche zéro, sans repli sur d’anciennes parties.

Les statistiques descriptives de cartes et de mulligan restent consultables après sélection explicite d’un deck même si ce profil a été modifié entre des parties. Cela ne rend pas ses listes identiques : les calculs qui supposent un nombre fixe de copies exigent toujours une liste cohérente. Un profil modifié n’est plus fusionné avec une autre version sur la seule foi de son premier instantané.

La saison native et l’identifiant versionné de la file sont des indices immuables, confrontés à `started_at` et aux ères de l’API ; un conflit est laissé à vérifier. Le libellé actuel de file et l’étiquette manuelle du deck ne reclassent pas une partie. La date d’import ou de sauvegarde n’est pas une date de jeu. Les files japonaises, limitées, privées, bots et non classées sont exclues du Core classé.

Inkdrops : graphique propre (stock, acquisitions, retraits), distinct du graphique d’encre permanente ; acquisition pendant les deux tours, retraits distincts des paiements explicitement attribuables, stock final conservé. Un retrait peut payer un coût alternatif, pas une quantité d’encre ; aucun « gaspillage » attribué au stock conservé. Les anciennes analyses sans chronologie sont indiquées comme non mesurées et demandent un réimport. Les graphiques temporels s’ouvrent par manche, sans concaténer artificiellement un BO3. Les actions FREE_UNDO connues sont exclues des actions/statistiques, leurs patches sont appliqués pour restaurer l’état. Les retours en arrière inconnus/imbriqués non pris en charge échouent explicitement. Le compteur de cartes vues n’est plus présenté comme exact lorsqu’une annulation empêche de rapprocher les logs des actions.

La note officielle du 8 octobre a aussi été revue : Adventurous, Stone by Day, interactions Duo Shift/durée des mots-clés, effets « enters », déplacements, résolution en plusieurs parties et Black Cauldron. Ce lecteur mesure un replay produit par le simulateur ; il ne recalcule pas la légalité de tous ces effets et ne doit pas qualifier un coup d’erreur comme le ferait un moteur d’échecs.
https://www.disneylorcana.com/en-US/news/2026/10/hyperia-city-set-release-notes

Les PDF transmis incluent des références 2025 et des notes non officielles anciennes. Ils sont utiles pour l’historique et l’arbitrage, pas pour remplacer les règles officielles 2026.

## Prochaines statistiques réellement défendables

Priorité : gains/retraits d’inkdrops, encre permanente disponible, sorties T1–T4, main critique, mulligan conservé/renvoyé, OTP/OTD, matchups par ère et taille d’échantillon. Séparer BO1/manches BO3/matchs BO3. Les associations carte-victoire et mulligan-victoire restent descriptives : elles ne prouvent pas qu’un choix cause une victoire. Une future probabilité de victoire exigerait données autorisées, apprentissage, évaluation hors échantillon et calibration ; elle n’est pas créée dans ce correctif.
