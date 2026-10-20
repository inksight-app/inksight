# duels.ink et Lorcana Set 14 — contrat retenu

Vérification : 20 octobre 2026. Référence développeur : https://duels.ink/api-docs.md ; inscription : https://duels.ink/developers

## API et décisions

| Fonction officielle | Dans cette livraison |
|---|---|
| GET /api/me | Validation d’un jeton avant stockage ; identifiant stable, scopes et expiration du fournisseur conservés. Pas de lien basé sur un pseudonyme. |
| GET /api/me/match-history | Pages de 250 maximum, curseur opaque inchangé, pagination séquentielle espacée, 429 respecté, arrêt sur 401. Filtre serveur de file/source et borne basse, puis validation locale de la saison réelle. |
| POST /api/me/bulk-replays | Lots de 1 000 maximum ; URLs limitées aux domaines documentés ; téléchargements cadencés. |
| Replays /r et CDN | Redirections HTTPS bornées ; aucun Bearer transféré au CDN ; fichiers bornés et validation locale du replay. |
| GET /api/stats/meta | Repères communautaires dans Mes statistiques : ères découvertes, contexte commun actuel/archives et BO1/BO3, champs stables, date/effectif, cache par file ET chapitre, ETag quotidien. Refus d’une réponse d’un autre contexte. |
| OAuth authorization code + PKCE | À activer après inscription et accès à la configuration serveur. Non implémenté comme connexion active dans cette livraison. |
| POST /api/me/bulk-gamelogs | Piste utile pour compléter la traçabilité des actions ; non nécessaire au parseur actuel et non branché. |
| GET /api/stats/coconut et /card/{cardId} | Données exclusivement du format Coconut. Aucune extrapolation au Core ; pas de taux de victoire mondial par carte Core disponible dans ces routes. |
| Tables privées / cups | Hors périmètre : l’outil d’analyse n’a pas besoin de permissions d’organisation ou d’écriture. |

Les nouveaux jetons OAuth sont confidentiels côté serveur, en lecture seule, avec `profile match_history:read replays:read`. Pas de refresh token : reconnexion à expiration/révocation. Une nouvelle autorisation remplace le jeton précédent du même joueur pour la même application. Le code d’échange expire en 60 secondes.

Pour l’utilisation personnelle d’Inksight, le jeton personnel existant suffit : passer par `/developers` n’est pas obligatoire. L’inscription devient pertinente pour une connexion multiutilisateur « Autoriser Inksight », avec consentement et scopes limités. La documentation indique que les identifiants sont fournis dès l’inscription ; l’application en attente de revue porte un avertissement de non-vérification. Aucune application OAuth ni nouveau secret n’a été créé pour cette livraison.

Configuration future à enregistrer chez duels.ink : homepage HTTPS du site, callback exact du backend, trois scopes ci-dessus, durée limitée. Le client_secret ne doit jamais aller dans le frontend, Git, un préfixe VITE_ ou le chat. Il faudra state lié à la session, PKCE S256, consommation atomique unique, traitement du refus et stockage chiffré. Cette version n’ajoute pas une demi-connexion OAuth non sécurisée.

Les champs internes des pages de statistiques (archétypes, ouvertures, profils) ne sont pas un contrat API. Le calcul du pourcentage de victoire du lecteur de replay n’est pas documenté dans la référence publique consultée : pas d’intégration promise sur un endpoint interne.

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

Le contexte par défaut est « chapitre actuel, Core BO1 classé ». Core BO3 est un choix distinct. Le même contexte s’applique à l’import, aux statistiques, à l’historique, aux adversaires et aux repères publics. Archives et exploration sont explicites ; aucune ancienne donnée n’est supprimée. Une absence de partie dans le chapitre actuel affiche zéro. Les cas sans contexte fiable sont accessibles dans « À vérifier » avec tous les formats.

La saison native et l’identifiant versionné de la file sont des indices immuables, confrontés à `started_at` et aux ères de l’API ; un conflit est laissé à vérifier. Le libellé actuel de file et l’étiquette manuelle du deck ne reclassent pas une partie. La date d’import ou de sauvegarde n’est pas une date de jeu. Les files japonaises, limitées, privées, bots et non classées sont exclues du Core classé.

Inkdrops : graphique propre (stock, acquisitions, retraits), distinct du graphique d’encre permanente ; acquisition pendant les deux tours, retraits distincts des paiements explicitement attribuables, stock final conservé. Un retrait peut payer un coût alternatif, pas une quantité d’encre ; aucun « gaspillage » attribué au stock conservé. Les anciennes analyses sans chronologie sont indiquées comme non mesurées et demandent un réimport. Les graphiques temporels s’ouvrent par manche, sans concaténer artificiellement un BO3. Les actions FREE_UNDO connues sont exclues des actions/statistiques, leurs patches sont appliqués pour restaurer l’état. Les retours en arrière inconnus/imbriqués non pris en charge échouent explicitement. Le compteur de cartes vues n’est plus présenté comme exact lorsqu’une annulation empêche de rapprocher les logs des actions.

La note officielle du 8 octobre a aussi été revue : Adventurous, Stone by Day, interactions Duo Shift/durée des mots-clés, effets « enters », déplacements, résolution en plusieurs parties et Black Cauldron. Ce lecteur mesure un replay produit par le simulateur ; il ne recalcule pas la légalité de tous ces effets et ne doit pas qualifier un coup d’erreur comme le ferait un moteur d’échecs.
https://www.disneylorcana.com/en-US/news/2026/10/hyperia-city-set-release-notes

Les PDF transmis incluent des références 2025 et des notes non officielles anciennes. Ils sont utiles pour l’historique et l’arbitrage, pas pour remplacer les règles officielles 2026.

## Prochaines statistiques réellement défendables

Priorité : gains/retraits d’inkdrops, encre permanente disponible, sorties T1–T4, main critique, mulligan conservé/renvoyé, OTP/OTD, matchups par ère et taille d’échantillon. Séparer BO1/manches BO3/matchs BO3. Les associations carte-victoire et mulligan-victoire restent descriptives : elles ne prouvent pas qu’un choix cause une victoire. Une future probabilité de victoire exigerait données autorisées, apprentissage, évaluation hors échantillon et calibration ; elle n’est pas créée dans ce correctif.
