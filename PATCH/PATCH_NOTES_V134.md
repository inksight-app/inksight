# V134 — Graph UX Safe Pass

Base : V133.3C.

Objectif : améliorer la lisibilité des graphiques sans modifier les calculs métier ni la sauvegarde Supabase.

## Modifications

- Renommage du graphique `Lore gagné par tour` en `Course aux 20 lore`.
- Passage du graphique `Actions par tour` de barres empilées à barres groupées.
  - Les actions ne sont plus additionnées dans un faux total.
  - Chaque tour compare maintenant Encrées / Jouées / Quêtes / Défis côte à côte.
- Simplification du graphique `Présence sur board`.
  - Le graphique ne compare plus que les personnages en jeu : vous vs adversaire.
  - Le lore potentiel sort de la courbe principale et reste visible dans le résumé de lecture rapide.
- Ajout d'une logique de contraste pour éviter deux couleurs trop proches sur un même graphique.
- Conservation de la logique couleur Lorcana : les graphes continuent d'utiliser en priorité les couleurs de bicolorité du joueur affiché et de l'adversaire.
- Cohérence renforcée entre ligne, point, légende et tooltip.

## Non modifié

- Parser Duel.ink.
- Calculs Dead Weight.
- Stats globales.
- Mulligan Lab.
- Import / sauvegarde Supabase.

## Vérifications

- `node --check src/main.js` : OK
- `npm run build` : OK
