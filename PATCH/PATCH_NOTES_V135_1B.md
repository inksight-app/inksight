# V135.1b — Duel.ink token test hotfix

Base: V135.1 — Duel.ink token test

## Objectif
Corriger le test de token Duel.ink sans avancer vers la synchronisation complète.

## Corrections

- Correction du bug console `refreshSavedMatches is not defined` déclenché par la navigation vers l’historique via le shell global.
- Exposition sécurisée de la fonction de refresh d’historique via `globalThis.INKSIGHT_refreshSavedMatches` pour éviter les erreurs de scope entre l’IIFE principale et le shell de navigation.
- UI du bloc Duel.ink revue : marges, padding, grille de résultat, cartes de résumé, badges plus lisibles.
- Normalisation plus robuste des données retournées par `/api/me/match-history` : recherche de date, replay id, game id, source, queue et adversaire dans plusieurs structures possibles.
- Affichage des résultats de test sous forme de résumé + liste lisible.

## Pas changé

- Aucun stockage de token.
- Aucun import automatique.
- Aucun téléchargement de replay via API.
- Aucune migration Supabase.

## Fichiers modifiés

- `src/main.js`
- `src/style.css`
- `api/duelink-history.js`
- `PATCH_NOTES_V135_1B.md`

`index.html` n’a pas été modifié.

## Vérifications

- `node --check src/main.js` : OK
- `node --check api/duelink-history.js` : OK
- `npm run build` : OK
