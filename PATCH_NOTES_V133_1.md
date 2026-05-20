# V133.1 — Cartes restées en main

## Objectif
Ajouter une première version du Dead Weight Lab au niveau de l’analyse de match, sans conclusion automatique trop forte.

## Ajouts
- Tracking des épisodes de présence en main par carte/instance.
- Calcul de la durée maximale et moyenne passée en main.
- Détection de la sortie principale : jouée, encrée, défaussée, retour deck, sortie par effet, encore en main.
- Nouveau bloc “Cartes restées en main” dans l’onglet Statistiques, avec une liste visuelle cohérente avec les autres blocs cartes.
- Support BO3 via fusion des épisodes de main par carte.
- Données compactées dans le JSON sauvegardé pour préparer une future analyse globale.

## Limites assumées
- Le tracking est prioritairement fiable pour le joueur analysé, car sa main est visible avec des instanceId.
- La main adverse peut être partielle ou non exploitable si Duel.ink ne révèle pas les cartes.
- Une carte restée longtemps en main n’est pas jugée “mauvaise” automatiquement : l’interface présente un signal, pas une conclusion.
