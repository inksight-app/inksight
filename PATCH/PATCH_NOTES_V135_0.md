# V135.0 — Duel.ink foundation: base + historique

Base: `inksight-v134-2-resume-stats-structure-cleanup`.

## Objectif

Préparer InkSight pour la future synchronisation Duel.ink sans appeler encore l’API et sans stocker de token.

## Modifications

- Ajout du script SQL Supabase `supabase/migrations/20260521_v1350_duelink_foundation.sql`.
- Préparation des colonnes API dans `saved_matches` et `saved_games` :
  - `source_type`
  - ids Duel.ink
  - `duelink_source`
  - `duelink_queue`
  - `played_at` côté game
  - `replay_sha256`
  - decklists JSONB
  - métadonnées API JSONB
- Création de `duelink_sync_runs` pour les futurs logs de sync.
- Les imports manuels sauvegardent désormais `source_type: 'manual'`.
- Les imports manuels calculent un `replay_sha256` depuis le buffer brut du replay.
- L’historique trie maintenant par `played_at` en priorité, puis `created_at`.
- Ajout de badges source dans l’historique : actuellement `Manuel`, avec espace préparé pour `Duel.ink API`, `matchmaking`, `private`, `bot`, `queue`.

## Important

- Aucun token Duel.ink n’est stocké en V135.0.
- Aucun appel API Duel.ink n’est encore réalisé.
- L’import manuel reste inchangé côté UX.
- Exécuter la migration SQL dans Supabase avant de déployer le code.

## Fichiers modifiés

- `src/main.js`
- `src/supabase.js`
- `src/style.css`
- `supabase/migrations/20260521_v1350_duelink_foundation.sql`
- `PATCH_NOTES_V135_0.md`

## Vérifications

- `node --check src/main.js`
- `npm run build`
