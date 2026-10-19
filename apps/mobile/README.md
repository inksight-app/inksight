# Inksight mobile · pilote 0.1

Application React Native / Expo Router, pensée d’abord pour l’iPhone. L’export web est la prévisualisation du même code. Cette version fonctionne avec des imports locaux, sans API d’IA et sans serveur requis.

## Utilisation

```bash
cd apps/mobile
npm ci
npm start
```

Ouvrir le projet avec une version compatible d’Expo Go, ou une development build. Depuis l’app : **Importer mes replays** → sélectionner un `.replay`, `.replay.gz`, JSON de replay ou ZIP. Les imports sont dédupliqués par partie et point de vue. L’exemple pédagogique est fictif et ne rentre jamais dans l’historique.

Les replays et notes sont enregistrés localement, sous forme compressée. Ils ne sont pas synchronisés entre appareils. **Parties → Exporter l’archive** permet de sauvegarder les replays et notes ; réimporter ce ZIP les restaure. Effacer les données de l’app ou du navigateur efface l’historique local. L’archive contient des données personnelles de jeu : la conserver dans un emplacement choisi par l’utilisateur.

## Ce qui fonctionne

- Lecture des snapshots et patches du format `duels-replay-v1`, y compris les propriétés optionnelles omises par son sérialiseur.
- Lecture des tours, main connue, plateau, lore, encres permanentes et inkdrops séparés.
- Annulations `FREE_UNDO:<seq>` exclues des compteurs ; traces conservées pour lire le replay et aligner les évaluations.
- Victoires/défaites/nuls, premier/deuxième joueur, intervalle de Wilson à 95 %, usage des cartes et mulligan observé.
- Coach déterministe en français : constat, situation à revoir et couverture des données, avec sources de calcul.
- Catalogue Lorcast anglais : 3 242 impressions des sets 1–14, réimpressions regroupées. Filtre de pool Core 9–14, calcul hypergéométrique de pioche sans remise.
- Repères communautaires issus uniquement des champs publics stables de duels.ink, avec date et taille d’échantillon.
- Chargement facultatif d’une évaluation externe accessible publiquement, ou import de son JSON. Les valeurs absentes restent inconnues.

## Limites explicites

Ce n’est pas un moteur de règles Lorcana ni un solveur de meilleurs coups. Les commentaires ne déduisent pas une erreur d’une défaite ou d’une baisse de probabilité. Les futures pioches `deckOrder` et les informations cachées adverses ne sont pas exposées au coach.

Le catalogue est un instantané anglais. Le filtre de pool ne certifie pas la légalité d’un deck : les restrictions et bannissements de tournoi restent à intégrer dans un registre versionné. Les drapeaux `legalities` de Lorcast étaient en retard pour le set 14 lors du contrôle et ne servent pas d’autorité pour ce filtre.

Le lecteur n’implémente pas encore le multijoueur, la construction de decks, la consolidation BO3 en matchs, la simulation des capacités, ni les statistiques de séquences conditionnelles de la méta. Une carte jouée par un effet sans action explicite n’est pas imputée artificiellement à une action `PLAY_CARD`.

L’évaluation duels.ink a été vérifiée sur un replay partagé. L’endpoint observé n’est pas dans le contrat public OAuth et son accès aux parties privées n’est pas garanti. Son algorithme et sa calibration ne sont pas publiés. Aucun pourcentage interne de victoire ni score de précision n’est généré. Importer un JSON d’évaluation nécessite de choisir celui de la bonne partie : la longueur et le point de vue sont vérifiés, mais le format ne permet pas d’authentifier l’identité de la partie.

## Vérification

```bash
npm run typecheck
npm run lint
npm test
node --test ../integrations/duels/duels.test.mjs
npx expo-doctor
npm run export:web
npm run export:ios
```

Les tests couvrent les patches, annulations, ressources, perspectives, données manquantes, incertitude statistique, archives et le protocole OAuth. Un vrai replay partagé a été reconstruit jusqu’à sa fin (119 frames, 17 tours, deux actions annulées exclues). Il n’est pas commité avec les données d’un tiers.

Une compilation JavaScript iOS réussie ne vaut pas une validation sur appareil ni une application signée.

## Installation iPhone et TestFlight

Le fichier `eas.json` prépare les profils development, preview, simulateur et production. Il reste à lier le projet au compte Expo du propriétaire et à choisir/confirmer l’identifiant Apple `app.inksight.mobile` avant la première signature.

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --profile production
```

Ces étapes sont à lancer avec le compte Apple Developer du propriétaire. Elles ne sont pas exécutées par les tests du dépôt. TestFlight permet ensuite d’installer l’app avec une invitation ; la distribution interne sur appareil physique demande aussi une signature/provisioning Apple. L’App Store ajoute la fiche de l’app, les déclarations de confidentialité, les captures et la revue Apple. Les futures versions pourront conserver la même base native.

## Connexion officielle duels.ink

L’adaptateur serveur et son contrat de stockage sont dans `../integrations/duels/`. L’interface affiche **non configurée** : elle ne contient ni secret client ni jeton personnel. La mise en service nécessite un backend authentifié, le stockage durable, l’enregistrement de l’application chez duels.ink et un échange sécurisé de session Inksight avec l’iPhone. Voir le document d’intégration ; ne pas mettre ces secrets dans `EXPO_PUBLIC_*`.

## Actualiser le catalogue

```bash
node scripts/sync-catalog.mjs
```

La synchronisation récupère séquentiellement les sets 1 à 14 depuis Lorcast. Ajouter un set ou changer le pool est une modification explicite à vérifier avec le calendrier/règlement officiel. Ne pas extrapoler automatiquement la rotation suivante.
