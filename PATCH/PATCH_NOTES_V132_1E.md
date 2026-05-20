# InkSight V132.1e — Main Advantage Graph

## Objectif
Clarifier la lecture de la main et comparer les ressources des deux joueurs dans le même graphique.

## Changements
- Le bloc "Efficacité de la main" devient "Cartes en main en fin de tour".
- Le texte précise que la mesure est faite après les actions et effets du tour.
- Le graphique de main affiche maintenant deux courbes :
  - Vous
  - Adversaire
- La vue "Stats adverses" inverse la lecture : l'adversaire reste la courbe principale, mais votre main reste visible en comparaison.
- Le résumé du graphique indique désormais l'avantage de main le plus marqué quand les deux séries sont disponibles.
- Le KPI "Réserve de main" précise que la mesure est faite en fin de tour.

## Vérifications
- `node --check src/main.js` : OK
- `npm run build` : OK
