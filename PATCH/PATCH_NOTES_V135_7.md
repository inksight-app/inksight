# InkSight V135.7 — Duel.ink Full Sync Foundation

Objectif : remplacer la prévisualisation limitée aux 25 derniers matchs par une synchronisation paginée de tout l'historique Duel.ink disponible, sans appliquer de filtres à l'import.

## Ce qui change

### Synchronisation complète
- Le bouton `Prévisualiser 25` devient `Synchroniser Duel.ink`.
- La lecture de `/api/me/match-history` utilise maintenant `limit=1000`.
- Le front enchaîne automatiquement les pages avec `next_cursor` jusqu'à la fin de l'historique disponible.
- Aucun filtre utilisateur n'est appliqué pendant le scan : matchmaking, private et bot restent inclus par défaut.

### État clair après scan
Le bloc Duel.ink affiche désormais :
- parties lues ;
- nouvelles parties ;
- parties déjà présentes ;
- parties déjà dans la file ;
- replays prêts à importer ;
- parties sans replay ;
- plus récent / plus ancien ;
- sources détectées.

### Import préparé pour la suite
- Le bouton secondaire importe les nouveaux replays détectés après le scan complet.
- `/api/duelink-replays` accepte désormais jusqu'à 1000 ids par appel, en cohérence avec la documentation Duel.ink.
- Les métadonnées API sont mieux conservées dans les sessions : format, source, queue, updatedAt, decklists et ligne brute API.

### Métadonnées utiles pour les futures stats
- `format` détecté quand l'API l'expose.
- `apiRow` conservé dans le résumé client pour préparer le stockage enrichi.
- Les decklists `myDecklist` et `opponentDecklist` restent attachées aux analyses importées.

## Limites assumées

Cette V135.7 scanne tout l'historique et prépare l'import, mais ne fait pas encore :
- sauvegarde automatique massive sans contrôle ;
- reprise d'import après interruption ;
- exploitation des gamelogs ;
- filtres Historique / Performance façon Duel.ink ;
- affichage complet des decklists API dans l'analyse adverse.

Ces points sont prévus pour V135.8+.

## Fichiers modifiés

- `api/duelink-history.js`
- `api/duelink-replays.js`
- `index.html`
- `src/main.js`
- `PATCH/PATCH_NOTES_V135_7.md`

## Vérifications

- `node --check src/main.js` : OK
- `node --check api/duelink-history.js` : OK
- `node --check api/duelink-replays.js` : OK
- `npm run build` : OK
