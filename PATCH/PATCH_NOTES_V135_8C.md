# InkSight V135.8C — Duel.ink batch error skip + sync run grants

## Objectif
Corriger les lots Duel.ink qui restent bloqués quand certains replays sont indisponibles ou rejetés par le manifeste Duel.ink.

## Changements

- Les replays absents du manifeste bulk ne bloquent plus immédiatement le lot : InkSight tente d'abord le téléchargement direct `/r/{replay_id}` via la route Vercel existante.
- Si un replay échoue réellement, la ligne est mise de côté pour la session (`Mis de côté`) au lieu de rester indéfiniment dans `Prêtes à importer`.
- Un nouveau clic sur `Importer 25` passe donc automatiquement aux 25 parties suivantes.
- Ajout d'une migration de grants Supabase pour `duelink_sync_runs`.

## Migration Supabase à exécuter

`supabase/migrations/20260521_v1358c_duelink_sync_runs_grants.sql`

## Fichiers modifiés

- `src/main.js`
- `supabase/migrations/20260521_v1358c_duelink_sync_runs_grants.sql`
- `PATCH/PATCH_NOTES_V135_8C.md`
