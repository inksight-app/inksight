# V130 — Decklist adverse partielle

## Objectif
Ajouter un premier système de reverse-engineering de deck adverse depuis l’onglet **Cartes vues > Adversaire**.

## Ajouts
- Tracking des exemplaires adverses visibles via `instanceId` / `cardInstanceId`.
- Comptage prudent des copies confirmées : même instance = même carte, nouvelle instance = nouvelle copie confirmée.
- Exclusion volontaire de la main cachée adverse : seules les cartes réellement visibles sont utilisées.
- Agrégation BO3 prudente : la quantité estimée correspond au maximum confirmé sur une game, pas à une addition naïve entre games.
- Badge `Estimé X` sur les cartes adverses.
- Bloc `Decklist adverse partielle` avec total de copies confirmées.
- Bouton `Copier la decklist partielle` au format Lorcana standard.

## Format export
```txt
2 Tamatoa - So Shiny!
1 Lucky Dime
3 Robin Hood - Desert Wanderer
```

## Notes
Cette decklist est volontairement partielle : elle représente les cartes vues/confirmées pendant la partie, pas la liste complète de l’adversaire.
