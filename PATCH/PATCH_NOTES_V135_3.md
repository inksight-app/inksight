# V135.3 — Duel.ink API import preview → file d’import

Base: `V135.2 — Duel.ink Sync Preview`

## Objectif
Permettre d’importer les nouveaux replays Duel.ink prévisualisés dans la file d’import existante, sans auto-save et sans stocker le token.

## Modifications

- Ajout d’un bouton `Importer les nouveaux` dans le bloc Duel.ink.
- Les matchs Duel.ink prévisualisés et non présents peuvent maintenant être téléchargés puis ajoutés à la file d’import existante.
- Les replays API passent par la même logique que les imports manuels : parsing local, détection de doublons, contrôle dans la file, puis sauvegarde manuelle.
- Ajout des routes Vercel :
  - `api/duelink-replays.js` : demande le manifeste `/api/me/bulk-replays`.
  - `api/duelink-download.js` : télécharge un replay via `/r/{replay_id}` en suivant la redirection.
- Les sessions importées via API reçoivent les métadonnées :
  - `source_type: duelink_api`
  - `duelink_game_id`
  - `duelink_replay_id`
  - `duelink_source`
  - `duelink_queue`
  - `played_at`
  - `replay_sha256`
- Les sauvegardes issues de la file conservent ces métadonnées dans `saved_matches`, `saved_games` et `analysis_json`.
- Le dédoublonnage vérifie maintenant en priorité :
  1. `duelink_game_id`
  2. `duelink_replay_id`
  3. `replay_sha256`
  4. ancien `replay_fingerprint`
- Refonte UX du bloc Duel.ink dans la page Compte : marges, arrondis, workflow, boutons, responsive mobile.

## Ce qui n’est pas encore fait

- Pas d’auto-save API.
- Pas de stockage persistant du token.
- Pas de synchronisation automatique en arrière-plan.
- Pas encore de chiffrement côté serveur pour le token.

## Vérifications

- `node --check src/main.js` : OK
- `node --check api/duelink-history.js` : OK
- `node --check api/duelink-replays.js` : OK
- `node --check api/duelink-download.js` : OK
- `npm run build` : OK
