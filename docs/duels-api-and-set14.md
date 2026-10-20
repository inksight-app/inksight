# duels.ink et Lorcana Set 14 — contrat retenu

Vérification : 20 octobre 2026. Référence développeur : https://duels.ink/api-docs.md ; inscription : https://duels.ink/developers

## API et décisions

| Fonction officielle | Dans cette livraison |
|---|---|
| GET /api/me | Validation d’un jeton avant stockage ; identifiant stable, scopes et expiration du fournisseur conservés. Pas de lien basé sur un pseudonyme. |
| GET /api/me/match-history | Pages de 250 maximum, curseur opaque inchangé, pagination séquentielle espacée, 429 respecté, arrêt sur 401. |
| POST /api/me/bulk-replays | Lots de 1 000 maximum ; URLs limitées aux domaines documentés ; téléchargements cadencés. |
| Replays /r et CDN | Redirections HTTPS bornées ; aucun Bearer transféré au CDN ; fichiers bornés et validation locale du replay. |
| GET /api/stats/meta | Repères communautaires dans Mes statistiques : ère découverte via meta.eras.currentEra.key, champs stables seulement, date et échantillon affichés, cache quotidien et ETag. |
| OAuth authorization code + PKCE | À activer après inscription et accès à la configuration serveur. Non implémenté comme connexion active dans cette livraison. |
| POST /api/me/bulk-gamelogs | Piste utile pour compléter la traçabilité des actions ; non nécessaire au parseur actuel et non branché. |
| Coconut / usage de cartes | Future comparaison agrégée par carte ; non branchée pour ne pas confondre popularité et efficacité causale. |
| Tables privées / cups | Hors périmètre : l’outil d’analyse n’a pas besoin de permissions d’organisation ou d’écriture. |

Les nouveaux jetons OAuth sont confidentiels côté serveur, en lecture seule, avec `profile match_history:read replays:read`. Pas de refresh token : reconnexion à expiration/révocation. Une nouvelle autorisation remplace le jeton précédent du même joueur pour la même application. Le code d’échange expire en 60 secondes.

Configuration future à enregistrer chez duels.ink : homepage HTTPS du site, callback exact du backend, trois scopes ci-dessus, durée limitée. Le client_secret ne doit jamais aller dans le frontend, Git, un préfixe VITE_ ou le chat. Il faudra state lié à la session, PKCE S256, consommation atomique unique, traitement du refus et stockage chiffré. Cette version n’ajoute pas une demi-connexion OAuth non sécurisée.

Les champs internes des pages de statistiques (archétypes, ouvertures, profils) ne sont pas un contrat API. Le calcul du pourcentage de victoire du lecteur de replay n’est pas documenté dans la référence publique consultée : pas d’intégration promise sur un endpoint interne.

## Interprétation des statistiques

- Les matchups BO3 agrégés comptent des matchs terminés, pas des manches.
- Les volumes par couleurs sont des apparitions de decks ; les additionner ne donne pas le nombre de parties uniques.
- Un matchup est une paire non ordonnée ; winsA décrit le côté A. Les égalités empêchent de déduire les victoires B par games − winsA.
- Afficher effectif, date, format et ère. Les données communautaires ne sont ni les résultats personnels ni la probabilité de gagner une position précise.
- Le coach reste un système de phrases locales : aucun appel OpenAI ou coût de modèle ajouté.

## Règles et cartes

Core actuel : sets 9–14 et réimpressions de même identité. L’arrivée du set 14 n’est pas une nouvelle rotation. Sources :
https://duels.ink/release-notes/2026-10-08-set-14-release
https://www.disneylorcana.com/en-US/news/2026/08/rotation

Le catalogue historique est conservé et 242 références imprimées du set 14 sont ajoutées (cartes/variantes, pas 242 designs uniques), source Lorcast, langue anglaise, relevé du 19 octobre. Ce complément n’est pas une validation exhaustive de tous les anciens textes ou des cartes bannies. Le badge « Pool Core » indique le pool de sets, pas une certification de légalité de deck.

Le filtre d’import Set 14 vérifie une date de partie cohérente : le nom actuel d’une queue ne suffit pas à reclasser un ancien match. Les queues japonaises et les anciennes queues Set 13 ne sont pas confondues avec le Core international courant.

Inkdrops : flux séparé de l’encre permanente, acquisition pendant les deux tours, retraits distincts des paiements explicitement attribuables, stock final conservé. Un retrait peut payer un coût alternatif, pas une quantité d’encre ; aucun « gaspillage » attribué au stock conservé. Les actions FREE_UNDO connues sont exclues des actions/statistiques, leurs patches sont appliqués pour restaurer l’état. Les retours en arrière inconnus/imbriqués non pris en charge échouent explicitement. Le compteur de cartes vues n’est plus présenté comme exact lorsqu’une annulation empêche de rapprocher les logs des actions.

La note officielle du 8 octobre a aussi été revue : Adventurous, Stone by Day, interactions Duo Shift/durée des mots-clés, effets « enters », déplacements, résolution en plusieurs parties et Black Cauldron. Ce lecteur mesure un replay produit par le simulateur ; il ne recalcule pas la légalité de tous ces effets et ne doit pas qualifier un coup d’erreur comme le ferait un moteur d’échecs.
https://www.disneylorcana.com/en-US/news/2026/10/hyperia-city-set-release-notes

Les PDF transmis incluent des références 2025 et des notes non officielles anciennes. Ils sont utiles pour l’historique et l’arbitrage, pas pour remplacer les règles officielles 2026.

## Prochaines statistiques réellement défendables

Priorité : gains/retraits d’inkdrops, encre permanente disponible, sorties T1–T4, main critique, mulligan conservé/renvoyé, OTP/OTD, matchups par ère et taille d’échantillon. Séparer BO1/manches BO3/matchs BO3. Les associations carte-victoire et mulligan-victoire restent descriptives : elles ne prouvent pas qu’un choix cause une victoire. Une future probabilité de victoire exigerait données autorisées, apprentissage, évaluation hors échantillon et calibration ; elle n’est pas créée dans ce correctif.
