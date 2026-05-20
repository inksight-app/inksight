# V124 — Coach IA robuste + fallback local

## Objectif
Empêcher le Diagnostic rapide de tomber sur un message "Coach hors ligne" quand la fonction Netlify ou Gemini ne répond pas.

## Corrections
- Le frontend utilise maintenant le diagnostic local comme vraie solution de secours.
- Si la fonction Netlify échoue, le bloc garde un titre et un commentaire contextuels basés sur les stats du match.
- La réponse de la fonction distingue `Coach IA` et `Coach local`.
- La fonction Netlify ne renvoie plus une erreur 500 bloquante quand `GEMINI_API_KEY` manque : elle renvoie un commentaire local utile.
- La fonction tente plusieurs modèles Gemini compatibles via `GEMINI_MODEL`, puis `gemini-2.5-flash`, puis `gemini-1.5-flash`.
- Suppression du `responseMimeType` strict pour éviter les incompatibilités de modèles.
- Prompt Gemini reformulé pour être sarcastique sans déclencher inutilement les filtres de sécurité.
- Ajout d’une logique locale de coach plus complète : stomp, scoop, top deck mode, fuite d’encre, lore passif, control, victoire/défaite serrée.

## Vérifications
- `node --check src/main.js` OK
- `node --check netlify/functions/getCoachCommentary.js` OK
- `npm run build` OK
