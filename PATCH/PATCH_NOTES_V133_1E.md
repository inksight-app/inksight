# V133.1E — QA stabilité & lisibilité

## Corrections

- Stabilisation du rendu après import : les listes de stats et Dead Weight sont rebondées après leur rendu.
- Correction du bouton « Voir toutes les cartes » dans le bloc Cartes restées en main.
- Présence sur board : la courbe de lore potentiel utilise désormais la même couleur dans la ligne, les points et la légende.
- Lisibilité mobile : readouts de graphiques plus compacts, titres de cartes limités proprement, badges réduits.
- Sélecteur de fichiers : accept étendu pour `.replay.gz`, `.gz`, `.zip` et types MIME courants.
- Ajout d’un `jsconfig.json` racine pour réduire les faux problèmes TypeScript dans GitHub.dev.

## Vérifications

- `node --check src/main.js` : OK
- `npm run build` : OK
