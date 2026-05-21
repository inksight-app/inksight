# V135.4E — Import cleanup & save flow polish

## Objectif
Corriger les derniers irritants après l’import Duel.ink : double bloc d’import, statut de sauvegarde peu clair, retour étrange après sauvegarde et module Dead Weight vide sur les replays API.

## Modifications
- Suppression du message doublon “File d’import prête” dans le bloc Duel.ink.
- Conservation d’un seul CTA “Voir la file d’import” après import API.
- Harmonisation des statuts de la file :
  - gris = prêt / en attente de sauvegarde ;
  - jaune = lecture / sauvegarde en cours ;
  - vert = sauvegardé / terminé ;
  - rouge = erreur.
- Ajout d’une barre de progression pendant la sauvegarde par lot.
- Après sauvegarde complète d’un lot API/multiple, retour à l’état normal sans replay affiché.
- Message de confirmation post-sauvegarde dans la zone d’import.
- Masquage du bloc “Cartes restées en main” quand aucun signal fiable n’est détecté, au lieu d’afficher un faux bloc vide.

## Fichiers modifiés
- src/main.js
- src/style.css
- PATCH_NOTES_V135_4E.md

## Vérifications
- node --check src/main.js : OK
- npm run build : OK
