# V133.3 — Mulligan Lab x Dead Weight

## Objectif
Connecter le Dead Weight au Mulligan Lab pour repérer les cartes gardées au mulligan qui restent ensuite bloquées en main.

## Modifications
- Les cartes gardées au mulligan récupèrent maintenant un signal de rétention en main quand les données Dead Weight sont disponibles.
- Ajout de badges lisibles dans le Mulligan Lab : `Keep risqué`, `Keep à surveiller`, ou signal positif quand la carte sort vite après keep.
- Les signaux respectent les filtres globaux déjà appliqués : bicolorité, deck, matchup, OTP/OTD, format et résultat.
- La recommandation reste prudente : aucune phrase du type “ne garde jamais cette carte”. L’interface signale seulement les patterns observés.
- La logique reste centrée sur les cartes du joueur, car la main adverse est privée.

## Vérifications
- `node --check src/main.js` : OK
- `npm run build` : OK
