# V135.4D — Build hotfix

## Objectif
Corriger l'échec de build Vercel causé par l'import `logDuelinkSyncRun` dans `src/main.js` alors que le fichier `src/supabase.js` déployé ne contenait pas encore l'export correspondant.

## Correction
- `src/supabase.js` inclut explicitement `export async function logDuelinkSyncRun(...)`.
- Le package complet contient bien `src/main.js`, `src/supabase.js`, `index.html` et les routes API nécessaires, afin d'éviter un décalage entre les fichiers.

## Vérifications
- `node --check src/main.js` : OK
- `node --check src/supabase.js` : OK
- `npm run build` : OK en local après installation des dépendances
