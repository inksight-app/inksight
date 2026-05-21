# V135.1C — Duel.ink date fallback

## Objectif
Corriger l'affichage `date inconnue` dans le test API Duel.ink lorsque l'endpoint ne renvoie pas de champ de date explicite exploitable.

## Changements
- Ajout d'un fallback de date basé sur les identifiants UUIDv7-like Duel.ink.
- Extension de la lecture des listes API : `games`, `items`, `matches`, `data`.
- Ajout du champ `dateSource` dans les résumés API pour distinguer :
  - `api` : date lue depuis la réponse API ;
  - `id` : date estimée depuis l'identifiant ;
  - `unknown` : aucune date exploitable.
- Clarification du message UI : le test token ne crée aucune entrée dans l'historique.

## Fichiers modifiés
- `api/duelink-history.js`
- `src/main.js`

## Non modifié
- `index.html`
- `src/style.css`
- Supabase / migrations
- Import replay manuel
- Sauvegarde / stats globales
