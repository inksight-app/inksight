# V135.5 — Duel.ink encrypted token memory

Objectif : permettre de mémoriser une clé API Duel.ink sur le compte InkSight sans l’exposer en clair dans Supabase.

## Ajouts

- Nouvelle table Supabase `duelink_connections` avec RLS.
- Nouveau secret Vercel requis : `DUELINK_TOKEN_SECRET`.
- Nouvelle route API `api/duelink-token.js` pour :
  - lire le statut de connexion ;
  - chiffrer et sauvegarder un token ;
  - supprimer le token mémorisé.
- Nouveau helper serveur `api/_duelink-token-store.js`.
- Les routes Duel.ink peuvent maintenant utiliser :
  - le token collé ponctuellement ;
  - ou le token chiffré mémorisé côté compte.
- UI Compte : boutons “Mémoriser la clé chiffrée” et “Oublier la clé”.

## Sécurité

- Le token n’est jamais écrit en clair en base.
- Chiffrement AES-256-GCM côté Vercel.
- La clé de chiffrement reste dans les variables d’environnement Vercel.
- L’utilisateur ne peut lire/supprimer que sa propre connexion via RLS.

## À faire avant déploiement complet

1. Exécuter `supabase/migrations/20260521_v1355_duelink_token_connection.sql` dans Supabase.
2. Ajouter dans Vercel une variable d’environnement `DUELINK_TOKEN_SECRET` de 24 caractères minimum.
3. Redéployer.

## Vérifications

- `node --check src/main.js` OK
- `node --check api/_duelink-token-store.js` OK
- `node --check api/duelink-token.js` OK
- `node --check api/duelink-history.js` OK
- `node --check api/duelink-download.js` OK
- `node --check api/duelink-replays.js` OK
- `npm run build` OK
