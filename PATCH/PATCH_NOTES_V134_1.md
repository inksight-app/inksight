# V134.1 — Graph colors consistency

## Objectif
Corriger la logique couleur des graphiques sans casser le système visuel basé sur les bicolorités Lorcana.

## Changements
- Les graphiques à deux séries utilisent maintenant les deux couleurs du joueur analysé :
  - page joueur : les deux couleurs du deck joueur ;
  - page adversaire : les deux couleurs du deck adverse.
- Le résumé / course au lore ne mélange plus automatiquement une couleur du joueur et une couleur adverse.
- Les graphes comparatifs gardent des couleurs contrastées, tout en restant dans la bicolorité affichée quand c’est lisible.
- Le graphique “Actions par tour” utilise désormais quatre couleurs vraiment distinctes pour :
  - Encrées ;
  - Jouées ;
  - Quêtes ;
  - Défis.
- Correction de cohérence : légende, barre, point et tooltip utilisent la même couleur pour une même donnée.
- Les couleurs des graphiques d’actions globales ont aussi été alignées sur cette logique.

## Non modifié
- Parser Duel.ink
- Import replay
- Supabase
- Dead Weight
- API Duel.ink
- Calculs statistiques
