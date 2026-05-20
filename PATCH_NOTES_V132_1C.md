# V132.1C — Encrage fiable par source

## Objectif
Corriger le décalage entre la courbe d'économie d'encre et le classement des cartes encrées.

## Corrections principales
- Le classement des cartes encrées ne dépend plus uniquement de `ADD_TO_INK` depuis la main.
- Chaque ajout réel dans l'inkwell est maintenant lu au niveau des patches `/inkwell/`.
- La source de l'encrage est classée par instance quand c'est possible :
  - Main
  - Défausse
  - Board
  - Deck
  - Source inconnue
- Les ajouts en encre par effets visibles sont donc conservés dans les statistiques, au lieu de disparaître.
- Les cartes encrées côté adversaire sont créditées si Duel.ink fournit l'identité de la carte.

## UX
- Le bloc “Cartes les plus encrées” affiche désormais des badges de source : main, défausse, board, deck ou inconnu.
- Les badges ont un code couleur discret pour distinguer l'origine de l'encrage.

## Sécurité data
- La détection privilégie l'`instanceId` pour éviter de confondre deux copies d'une même carte.
- Si l'instance n'est pas trouvée dans une zone publique et que l'action est `ADD_TO_INK`, l'encrage est considéré comme venant de la main.
- Les filtres V132.1b sont conservés tels quels.
