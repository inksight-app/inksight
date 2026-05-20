# V133.1G — Dead Weight microcopy + import filter

## Modifications

- Import iPhone/Safari : réintroduction d'un `accept` ciblé pour éviter que le sélecteur propose Photothèque / Appareil photo quand ce n'est pas utile.
- Bloc Cartes restées en main : suppression de la moyenne comme information principale.
- Les badges indiquent maintenant la plage concrète suivie : `Gardée T2 → T8`, `6 tours en main`, `Jouée ensuite`.
- Le bloc Dead Weight est masqué côté stats adverses, car la main adverse est une zone privée et non exploitable proprement.
- Cartes les plus encrées : libellés clarifiés : `Sacrifiée ×2`, `Défausse → encre ×1`, `Carte cachée ×1`.
- Ajustements mobile : titres, sous-titres, miniatures et badges plus compacts et plus lisibles.

## Vérifications

- `node --check src/main.js` : OK
- `npm run build` : OK
