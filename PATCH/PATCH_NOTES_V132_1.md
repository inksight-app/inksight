# InkSight — V132.1

## Filtres globaux — Vue d’ensemble

Cette version ajoute la première brique de la V132 : un contexte d’analyse global pour la page **Performances > Vue d’ensemble**.

### Ajouté

- Objet global `statsFilters` exposé sur `window.statsFilters` avec :
  - `deckId`
  - `matchupColor`
  - `tempo` (`all`, `otp`, `otd`)
  - `result` (`all`, `win`, `loss`)
- Nouvelle barre compacte desktop :
  - Deck
  - Matchup adverse
  - Tempo OTP / OTD
  - Résultat
  - Réinitialisation en un clic
- Nouveau bottom sheet mobile via **Modifier les filtres** pour éviter les rangées de boutons illisibles.
- Résumé du contexte actif sous le titre des filtres.
- Badge de fiabilité selon le nombre de parties filtrées :
  - Données solides : 10+ parties
  - À confirmer : 4–9 parties
  - Trop peu de données : 1–3 parties

### Vue d’ensemble recalculée

- `Parties filtrées` se base sur les games du contexte actif.
- `Winrate global` se recalcule sur ces games.
- `Score moyen` affiche le lore final moyen joueur / adversaire.
- Le filtre OTP / OTD ne retient que les games dont le tempo est connu.

### Sécurité data

- Les games sans information fiable OTP / OTD ne sont plus comptées comme OTD par défaut.
- Le filtre de matchup reste au niveau bicolorité adverse, sans prétendre détecter un archétype.
- Les sections cartes / mulligan restent prudentes : elles demandent toujours un deck sélectionné pour éviter de mélanger des stratégies différentes.

### Vérification

- `node --check src/main.js` : OK.
- `npm run build` non exécuté jusqu’au bout dans l’environnement local car `vite` n’est pas installé dans le dossier extrait.
