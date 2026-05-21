# V133.1H — Mobile overview containment hotfix

Base: V133.1G.

## Corrections

- Correction du bug mobile où les cartes du diagnostic rapide sortaient du conteneur dans l'onglet Résumé.
- Ajout de règles CSS de sécurité pour forcer les blocs Résultat / Score / Départ / Adversaire / Match-up à rester dans la grille mobile.
- Gestion plus robuste des noms d'adversaires longs avec retour à la ligne et `overflow-wrap`.
- Aucun changement sur le parsing, les calculs ou les statistiques.

## Vérifications

- `node --check src/main.js` : OK
- `npm run build` : OK
