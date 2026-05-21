# V135.4 — Duel.ink controlled save

## Objectif
Ajouter une synchronisation contrôlée : importer les replays Duel.ink prévisualisés puis les sauvegarder dans l’historique après dédoublonnage, sans stocker le token API.

## Modifications
- Ajout du bouton `Importer + sauvegarder` dans le bloc Duel.ink.
- Le bouton reste désactivé si l’utilisateur n’est pas connecté ou si aucun nouveau replay n’est disponible.
- Le flux réutilise la file d’import existante : téléchargement API → parsing InkSight → dédoublonnage → sauvegarde.
- Ajout d’un résumé de fin de synchronisation : sauvegardés, doublons, erreurs.
- Ajout d’un log dans `duelink_sync_runs` pour tracer les synchronisations sans jamais stocker le token.

## Sécurité
- Le token reste temporaire.
- Aucun token n’est enregistré dans Supabase.
- La synchronisation passe toujours par les routes Vercel déjà créées.

## Fichiers modifiés
- `index.html`
- `src/main.js`
- `src/supabase.js`
- `PATCH_NOTES_V135_4.md`

## Vérifications
- `node --check src/main.js` : OK
- `node --check src/supabase.js` : OK
- `npm run build` : non exécuté dans le sandbox, car `vite` n’est pas installé dans l’environnement.
