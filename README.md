# InkSight — Replay Analyzer pour Disney Lorcana

InkSight est une application web de replay analysis pensée pour les joueurs de **Disney Lorcana** qui veulent comprendre pourquoi une partie a été gagnée ou perdue.

Le projet transforme des fichiers de replay Duel.ink en tableaux de bord lisibles : mulligan, économie d’encre, course au lore, cartes clés, cartes encrées, cartes bloquées en main, présence sur board, matchups et historique de performance.

👉 Application en ligne : https://inksight-omega.vercel.app/

---

## Pourquoi ce projet existe

À Lorcana, beaucoup de décisions importantes sont difficiles à analyser après une partie.

Un joueur peut avoir l’impression d’avoir perdu parce qu’il n’a pas pioché la bonne carte, alors que la vraie cause peut être ailleurs : mauvais mulligan, main trop lourde, encre mal convertie, mauvais timing de quête, board perdu trop tôt, cartes non-encrables bloquées, ou matchup mal préparé.

InkSight a pour but de rendre ces patterns visibles.

L’objectif n’est pas de dire automatiquement au joueur “tu as mal joué”. L’objectif est de lui donner des indices concrets pour revoir ses parties avec plus de recul.

---

## Public cible

InkSight s’adresse à deux types d’utilisateurs.

### Joueurs débutants ou intermédiaires

Ils peuvent utiliser l’outil pour comprendre rapidement :

- qui a gagné la course au lore ;
- quelles cartes ont vraiment contribué à la victoire ;
- si leur main s’est vidée trop vite ;
- quelles cartes sont restées coincées en main ;
- quelles cartes ont été souvent encrées ;
- si le mulligan semble cohérent.

### Joueurs compétitifs

Ils peuvent l’utiliser comme outil de testing pour :

- comparer plusieurs versions d’un deck ;
- filtrer les résultats par matchup ;
- analyser OTP / OTD ;
- repérer les cartes situationnelles ;
- reconstruire une decklist adverse partielle ;
- préparer des tournois ;
- identifier des patterns récurrents sur plusieurs replays.

---

## Fonctionnement général

L’utilisateur importe un ou plusieurs fichiers de replay issus de Duel.ink.

Formats visés :

- `.replay`
- `.replay.gz`
- `.match-replay.zip`
- `.json`
- `.gz`
- `.zip`

L’analyse se fait principalement côté navigateur. L’application lit les actions du replay, suit les changements de zones et construit des métriques exploitables.

---

## Fonctionnalités principales

### Analyse de match

L’onglet Analyse permet de lire une partie précise.

Il contient notamment :

- résultat ;
- score final ;
- joueur qui commence ;
- matchup ;
- course au lore ;
- actions par tour ;
- économie d’encre ;
- cartes en main en fin de tour ;
- présence sur board ;
- cartes restées en main ;
- moteurs de victoire ;
- cartes les plus encrées ;
- séquence de jeu ;
- défis ;
- journal lisible.

### Course au lore

Le graphique compare l’évolution du lore des deux joueurs.

Il aide à voir :

- qui a pris l’avance ;
- quand la partie a basculé ;
- si la victoire vient d’un sprint final ;
- si l’adversaire avait une pression constante.

### Actions par tour

Ce graphique suit les actions principales du joueur analysé :

- cartes encrées ;
- cartes jouées ;
- quêtes ;
- défis.

Il sert à comprendre le rythme de la partie.

### Économie d’encre

Le bloc d’économie d’encre montre :

- l’encre disponible ;
- l’encre dépensée ;
- l’encre inutilisée ;
- les tours où l’encre a été mal convertie.

L’objectif est d’identifier les tours où le joueur n’a pas transformé ses ressources en pression réelle.

### Cartes en main en fin de tour

Ce graphique compare la taille de main du joueur et de l’adversaire en fin de tour.

La mesure est prise après les actions et les effets du tour.

Cette donnée aide à voir :

- qui avait l’avantage de ressources ;
- qui est tombé en top deck ;
- si une victoire vient d’un meilleur refill ;
- si une défaite vient d’une main vidée trop vite.

### Présence sur board

Ce graphique compare :

- les personnages du joueur ;
- les personnages adverses ;
- le lore potentiel installé sur le board.

Le lore potentiel est une indication de pression théorique. Il ne doit pas être lu comme un lore garanti.

### Cartes restées en main

Cette section suit les cartes qui sont restées longtemps dans la main du joueur.

Elle aide à repérer :

- cartes trop chères ;
- cartes non-encrables bloquées ;
- cartes situationnelles ;
- cartes gardées longtemps puis jouées tard ;
- cartes encore en main à la fin.

L’objectif est de détecter les cartes qui occupent la main sans contribuer rapidement au plan de jeu.

### Cartes les plus encrées

Ce bloc affiche les cartes ajoutées à l’encrier.

Les sources sont distinguées :

- depuis la main ;
- depuis la défausse ;
- depuis le board ;
- depuis le deck ;
- carte cachée ou non identifiée.

La priorité d’analyse est donnée aux cartes encrées depuis la main, car elles représentent un vrai choix du joueur.

### Moteurs de victoire

Ce bloc identifie les cartes qui ont réellement contribué à la course au lore.

Il peut inclure :

- personnages ;
- lieux ;
- actions ;
- objets ;
- effets générateurs de lore, quand ils sont détectables.

### Cartes vues

Cette vue liste les cartes vues pendant la partie.

Elle peut servir à :

- vérifier ce qui a été joué ;
- voir ce qui a été encré ;
- voir ce qui a été révélé ;
- reconstituer partiellement le deck adverse.

### Decklist adverse partielle

InkSight peut estimer une decklist adverse à partir des cartes visibles.

La logique repose sur les exemplaires observés, pas simplement sur le nombre de fois où une carte est jouée.

Cela évite de surestimer les copies dans les cas de bounce ou de récursion.

### Statistiques globales

Les analyses sauvegardées alimentent une page de performance globale.

On peut y consulter :

- winrate ;
- historique ;
- performances par deck ;
- cartes clés ;
- cartes jouées ;
- cartes encrées ;
- cartes souvent bloquées ;
- Mulligan Lab ;
- données filtrées par contexte.

### Filtres contextuels

Les statistiques globales peuvent être filtrées par :

- bicolorité ;
- deck ;
- matchup adverse ;
- OTP / OTD ;
- résultat ;
- BO1 / BO3.

Le but est de ne pas mélanger des contextes qui ne racontent pas la même histoire.

---

## Mulligan Lab

Le Mulligan Lab analyse les mains de départ et les décisions de mulligan.

Il aide à répondre à des questions comme :

- quelles cartes sont souvent gardées ;
- quelles cartes sont souvent renvoyées ;
- quelles cartes sont associées à de bons résultats ;
- quelles cartes semblent risquées en main de départ ;
- quelles cartes gardées deviennent ensuite bloquées en main.

L’objectif est d’aider le joueur à améliorer son plan de mulligan, surtout selon le deck joué et le matchup.

---

## Données sauvegardées

InkSight utilise Supabase pour stocker les analyses sauvegardées.

Les statistiques globales dépendent des analyses déjà enregistrées. Certaines nouvelles métriques ne seront disponibles que pour les replays importés et sauvegardés après leur implémentation.

Exemple : si une ancienne analyse a été sauvegardée avant l’ajout du Dead Weight, elle ne contient pas forcément les données nécessaires pour les statistiques globales liées aux cartes bloquées.

---

## Limites actuelles

InkSight dépend fortement des informations disponibles dans les fichiers Duel.ink.

Certaines zones sont privées ou partiellement cachées :

- main adverse ;
- encrier adverse face cachée ;
- cartes non révélées ;
- effets qui déplacent une carte sans révéler son identité.

Dans ces cas, l’application ne doit pas inventer de données.

Elle peut indiquer qu’une action a eu lieu, mais pas toujours identifier la carte concernée.

---

## Principes importants de calcul

### Tracking par instance

Quand c’est possible, InkSight doit suivre les cartes via leur `instanceId`.

C’est essentiel pour éviter de compter deux fois une carte qui revient en main ou qui est rejouée après un bounce.

### Zones privées

Une carte non révélée ne doit pas être attribuée arbitrairement.

Si le replay ne donne pas l’identité de la carte, InkSight doit l’afficher comme non identifiée ou ignorer l’attribution selon le contexte.

### Encrage

Une carte encrée depuis la main est beaucoup plus importante à analyser qu’une carte ajoutée à l’encrier par effet depuis la défausse ou le board.

Les deux peuvent être affichées, mais elles ne doivent pas raconter la même chose.

### Lore potentiel

Le lore potentiel sur board est une pression théorique.

Il ne signifie pas que ce lore était garanti au tour suivant.

### Dead Weight

Une carte qui reste longtemps en main n’est pas automatiquement une mauvaise carte.

Elle peut être :

- chère ;
- situationnelle ;
- volontairement conservée ;
- dépendante du matchup ;
- utile plus tard.

InkSight doit donc rester prudent dans ses formulations.

---

## Architecture technique

Le projet est une application web Vite en JavaScript vanilla.

Stack actuelle :

- Vite ;
- Vanilla JavaScript ;
- Chart.js ;
- Supabase ;
- Vercel ;
- Vercel API Routes ;
- Groq API pour le commentaire coach optionnel ;
- pako pour les fichiers `.gz` ;
- JSZip pour les archives `.zip`.

Structure principale :

```txt
.
├── api/
│   └── getCoachCommentary.js
├── public/
│   ├── favicon.svg
│   ├── manifest.webmanifest
│   └── lorcana-cards-import-ready.json
├── src/
│   ├── main.js
│   ├── style.css
│   └── supabase.js
├── index.html
├── package.json
├── package-lock.json
└── README.md
```

---

## Installation locale

Installer les dépendances :

```bash
npm install
```

Lancer le serveur local :

```bash
npm run dev
```

Créer un build de production :

```bash
npm run build
```

Prévisualiser le build :

```bash
npm run preview
```

---

## Déploiement

Le projet est déployé sur Vercel depuis GitHub.

Configuration recommandée :

```txt
Framework preset: Vite
Build command: npm run build
Output directory: dist
```

---

## Variables d’environnement

Certaines fonctions sont optionnelles et nécessitent des clés d’environnement.

Exemples possibles :

```txt
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
GROQ_API_KEY=
```

Ne jamais commiter de fichier `.env` contenant de vraies clés.

---

## Comment contribuer

Le projet a besoin de développeurs capables d’aider sur plusieurs axes.

### 1. Fiabilisation du parser Duel.ink

C’est le chantier le plus important.

Objectifs :

- mieux comprendre toutes les structures de replay ;
- sécuriser les BO1 et BO3 ;
- stabiliser le tracking par instance ;
- éviter les doubles comptages ;
- mieux gérer les cartes cachées ;
- tester les effets complexes.

### 2. Qualité des statistiques

Les calculs doivent rester prudents et vérifiables.

Aide recherchée :

- écrire des tests unitaires ;
- créer des replays de référence ;
- comparer les résultats InkSight avec les logs Duel.ink ;
- documenter les cas ambigus.

### 3. UX / UI responsive

L’application vise une expérience agréable sur desktop et mobile.

Aide recherchée :

- améliorer les graphes ;
- rendre les cartes plus lisibles ;
- réduire les débordements mobile ;
- clarifier les microcopies ;
- garder une interface simple pour les débutants.

### 4. Performance

Le fichier `main.js` est devenu volumineux.

À terme, le projet gagnerait à être modularisé.

Pistes :

- séparer parser, stats, UI et helpers ;
- isoler les graphes ;
- isoler les composants de cartes ;
- optimiser les imports ;
- améliorer la maintenabilité.

### 5. Tests automatisés

Le projet a besoin d’une vraie base de QA.

Pistes :

- tests sur fichiers replay ;
- snapshots de métriques ;
- tests de non-régression ;
- vérification des cas BO3 ;
- tests mobile/responsive.

---

## Roadmap proposée

### Court terme

- Stabiliser les calculs Dead Weight globaux.
- Clarifier le Mulligan Lab.
- Améliorer l’affichage mobile.
- Ajouter des messages d’état plus explicites.
- Créer des replays de test de référence.

### Moyen terme

- Profondeur de deck et probabilités de pioche.
- Analyse des cartes clés par matchup.
- Comparaison entre versions de deck.
- Meilleure reconstruction de decklist adverse.
- Export plus propre des données.

### Long terme

- Analyse de séquences de jeu.
- Détection des erreurs de tempo.
- Taux de punition / free trades.
- Suggestions de mulligan contextuelles.
- Coach commentary plus riche.
- Tests automatisés complets.

---

## Fonctionnalités intéressantes à développer

### Profondeur de deck

Calculer combien de cartes le joueur a réellement vues pendant une partie.

Cela permettrait d’estimer la probabilité d’avoir vu une carte jouée en x1, x2, x3 ou x4.

### Taux de punition

Détecter les personnages envoyés à l’aventure puis bannis gratuitement au tour adverse suivant.

Cette feature serait très utile, mais elle demande une excellente lecture des défis et des dégâts.

### Matchup-specific card performance

Comparer les performances d’une carte selon le matchup.

Exemple : une carte peut être excellente contre Saphir / Acier mais faible contre Rubis / Améthyste.

### Versioning de deck

Permettre au joueur de comparer plusieurs versions d’un même deck.

Cela aiderait à savoir si une modification de liste a réellement amélioré les résultats.

### Replay test suite

Créer une collection de replays annotés à la main.

Chaque replay servirait de référence pour valider les calculs.

---

## Comment aider concrètement

Si vous êtes développeur, vous pouvez aider en priorité sur ces points :

1. Lire `src/main.js` et identifier les zones à modulariser.
2. Créer une suite de tests à partir de replays réels.
3. Vérifier les calculs sur plusieurs matchups.
4. Améliorer la gestion des fichiers `.replay.gz` sur mobile.
5. Nettoyer la structure UI pour faciliter les futures évolutions.
6. Documenter les cas où Duel.ink ne révèle pas assez d’informations.

---

## Statut du projet

InkSight est un projet personnel en évolution rapide.

Il fonctionne déjà sur des cas réels, mais il reste expérimental. Certaines métriques doivent être lues comme des indicateurs d’aide à l’analyse, pas comme des vérités absolues.

Le projet cherche à devenir un outil fiable, lisible et utile pour les joueurs Lorcana qui veulent progresser grâce à leurs propres données de match.

---

## Disclaimer

InkSight est un projet fan-made.

Il n’est pas affilié à Disney, Ravensburger, Disney Lorcana, Duel.ink, Supabase, Vercel ou Groq.

Les noms de cartes, images et données liées à Disney Lorcana appartiennent à leurs ayants droit respectifs.
