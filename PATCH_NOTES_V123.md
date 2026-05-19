# V123 — Coach IA dynamique

## Objectif
Brancher le résumé tactique du match sur la Netlify Function sécurisée `/.netlify/functions/getCoachCommentary`, sans exposer la clé Gemini côté frontend.

## Changements
- Ajout d'un appel POST asynchrone depuis le résumé de match vers `/.netlify/functions/getCoachCommentary`.
- Ajout d'un état de chargement dans le bloc Diagnostic rapide :
  - `Le Coach analyse votre niveau...`
  - `Veuillez patienter, l’IA calcule votre Card Advantage...`
- Extraction et envoi des métriques utiles au coach : score, tours, encre flottée, top deck turns, moteur de lore, lore passif des lieux, adversaire, format, matchup, mulligan, OTP/OTD, carte la plus encrée, carte la plus jouée et résumé des actions.
- Ajout d'un cache par match pour éviter de rappeler l'IA inutilement à chaque rendu.
- Protection contre les réponses obsolètes si l'utilisateur change rapidement de match ou d'onglet.
- Fallback drôle si l'appel backend échoue.
- Enrichissement de la Netlify Function pour exploiter les nouvelles variables envoyées par le frontend.

## Vérifications
- `node --check src/main.js` OK.
- `node --check netlify/functions/getCoachCommentary.js` OK.
- `npm run build` OK.
