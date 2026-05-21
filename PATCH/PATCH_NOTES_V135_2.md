# V135.2 — Duel.ink sync preview

Base: V135.1C.

## Objectif
Prévisualiser les matchs Duel.ink accessibles via le token sans importer, télécharger ni sauvegarder de replay.

## Modifications
- Ajout d’un bouton `Prévisualiser 25 matchs` dans le bloc Duel.ink.
- Lecture de `/api/me/match-history` avec `limit:25`.
- Comparaison avec les sauvegardes existantes via `duelink_game_id` et `duelink_replay_id` quand disponibles.
- Affichage des compteurs : matchs lus, nouveaux, déjà présents, replays OK, dernier match.
- Lignes de preview avec badges : Nouveau / Déjà présent, source, queue, replay.
- Aucun token stocké.
- Aucun replay téléchargé.
- Aucun match sauvegardé.

## Fichiers modifiés
- `index.html`
- `src/main.js`
- `src/style.css`
- `api/duelink-history.js`

## Vérifications
- `node --check src/main.js`
- `node --check api/duelink-history.js`
- `npm run build`
