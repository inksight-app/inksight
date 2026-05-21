# InkSight — Supabase setup V135 Duel.ink API

Ce dossier contient les migrations SQL nécessaires pour le chantier API Duel.ink.

## Ordre recommandé

À exécuter dans Supabase SQL Editor, dans cet ordre :

1. `supabase/migrations/20260521_v1350_duelink_foundation.sql`
2. `supabase/migrations/20260521_v1355_duelink_token_connection.sql`
3. `supabase/migrations/20260521_v1355b_security_rpc_lockdown.sql` — seulement si la fonction `public.rls_auto_enable()` existe.
4. `supabase/migrations/20260521_v1355c_duelink_connection_grants.sql`

## Variables Vercel nécessaires

La mémorisation chiffrée du token Duel.ink nécessite :

```txt
DUELINK_TOKEN_SECRET=<secret long de 24 caractères minimum>
```

À mettre dans Vercel uniquement. Ne jamais commiter ce secret dans GitHub.

## Ce que ces migrations ajoutent

### V135.0

- Colonnes API sur `saved_matches` et `saved_games` : source, ids Duel.ink, date réelle, hash replay, decklists, métadonnées.
- Table `duelink_sync_runs` pour journaliser les synchronisations.
- Index de lecture et de dédoublonnage.

### V135.5

- Table `duelink_connections`.
- Stockage chiffré du token dans `encrypted_token`.
- RLS : chaque utilisateur ne voit que sa connexion.

### V135.5B

- Révocation optionnelle de `public.rls_auto_enable()` si cette fonction existe.

### V135.5C

- Grants explicites sur `duelink_connections` pour corriger les erreurs `permission denied for table duelink_connections` avec les routes Vercel utilisant le JWT utilisateur.

## Remarque importante

Ces scripts sont idempotents autant que possible grâce à `if not exists` et `drop policy if exists`. Les relancer ne devrait pas casser la base, mais il vaut mieux éviter de les modifier manuellement si le site fonctionne déjà.
