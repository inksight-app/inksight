# V126 — Coach DB local-first

## Objectif
Remplacer le coach IA trop instable par une vraie bibliothèque de punchlines déterministes, courte, variée et maintenable.

## Modifications

- Ajout de `api/coach-lines.js` : base de données intégrée de 420 variantes réparties sur 21 scénarios.
- Ajout de `public/coach-lines.json` : version JSON exportable/migrable vers Supabase.
- Refonte complète de `api/getCoachCommentary.js` :
  - sélection locale par scénario priorisé ;
  - choix stable par hash du match ;
  - injection sécurisée des variables ;
  - limites strictes de longueur ;
  - Groq devient optionnel via `COACH_USE_GROQ=true`.
- Correction définitive de l’URL Groq : `https://api.groq.com/openai/v1/chat/completions`.
- Enrichissement du payload frontend envoyé au coach :
  - `questCount`, `challengeCount`, `questRatio` ;
  - `cardsPlayedTotal`, `inkedTotal` ;
  - `maxFloatTurn`, `maxFloatAmount` ;
  - `opponentTopDeckTurns`.
- Le badge frontend utilise désormais `data.badge` si renvoyé par l’API.

## Comportement par défaut

Le coach utilise la base locale, même si `GROQ_API_KEY` existe.
Pour réactiver Groq ponctuellement :

```env
COACH_USE_GROQ=true
GROQ_API_KEY=...
```

Si Groq échoue, l’API retombe automatiquement sur la base locale.

## Vérifications

- `node --check api/getCoachCommentary.js` : OK
- `node --check api/coach-lines.js` : OK
- `node --check src/main.js` : OK
- `npm run build` non exécuté dans le sandbox : dépendance `vite` absente du dossier uploadé.
