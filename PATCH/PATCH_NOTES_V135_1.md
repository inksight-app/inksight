# V135.1 — Duel.ink token test sans stockage

## Objectif
Première étape d’intégration de l’API Duel.ink, sans stockage du token et sans import automatique.

## Ajouts
- Nouvelle carte Compte : “Tester une clé API Duel.ink”.
- Route Vercel `api/duelink-history.js`.
- Test de `/api/me/match-history?format=json&limit=5` via token Bearer temporaire.
- Affichage du statut : token valide, erreurs, derniers matchs détectés, source/queue/replay id si disponibles.

## Sécurité
- Le token n’est pas enregistré dans Supabase.
- Le token est envoyé uniquement à la route Vercel pour le test.
- Aucune synchronisation, aucun téléchargement de replay, aucune sauvegarde automatique.

## Fichiers modifiés / ajoutés
- `index.html`
- `src/main.js`
- `src/style.css`
- `api/duelink-history.js`
- `PATCH_NOTES_V135_1.md`
