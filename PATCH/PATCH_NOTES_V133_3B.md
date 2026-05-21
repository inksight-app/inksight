# V133.3B — Clean Cartes & Mulligan UX

## Objectif
Nettoyage de l'UX après intégration Dead Weight globale et Mulligan Lab.

## Modifications
- Déplacement de “Cartes souvent bloquées” dans le tri de l’onglet Cartes.
- Ajout du bouton de tri : Lore · Jouées · Encrées · Bloquées · Winrate si jouée.
- Le bloc Dead Weight global ne s’affiche plus automatiquement au-dessus des classements.
- Suppression du bloc “Signal” du Mulligan Lab.
- Suppression du badge peu clair “Doublon limité”.
- Conservation uniquement des signaux Dead Weight explicites quand ils existent.

## Vérifications
- node --check src/main.js : OK
- npm run build : OK
