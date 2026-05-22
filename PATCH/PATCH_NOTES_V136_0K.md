# V136.0K — Performance UI / filters / image hydration hotfix

## Objectif
Corriger les régressions observées après le passage à l'échelle : INP élevé, filtres qui ne se masquent pas entièrement, images absentes dans les stats, onglets déséquilibrés et textes/boutons d'information incohérents.

## Modifications principales

### Performance / INP
- Suppression du refresh Supabase automatique sur chaque clic de navigation vers Performances.
- Ajout d'un scheduler `requestAnimationFrame` pour les rendus Performance déclenchés par les filtres.
- Rendu différé des panneaux lourds : Cartes, Mulligan, Matchups et Courbes ne sont plus tous générés en même temps à chaque refresh.
- Les graphiques Chart.js sont rendus uniquement lorsque l'onglet Courbes est ouvert.

### Images des cartes
- Ajout d'une hydratation paresseuse des images via Lorcast quand la base locale ne contient pas d'URL image.
- Les placeholders de cartes peuvent maintenant être remplacés progressivement par les visuels récupérés depuis `https://api.lorcast.com/v0/cards/:set/:number`.
- Limitation des appels simultanés visibles pour ne pas bloquer l'interface.

### UI / UX
- Renommage de l'onglet principal `Stats & historique` en `Performances` pour éviter les coupures.
- Correction du segmented control `Mes statistiques / Historique des matchs` : les deux boutons prennent une largeur équilibrée.
- Correction du bouton Discord sur desktop : largeur max et centrage.
- Correction du HTML des filtres Performances : une fermeture de `div` en trop cassait la grille.
- Le bouton `Masquer les filtres` masque maintenant tout le panneau de filtres Performance, pas uniquement la bicolorité.
- Harmonisation des boutons info : ils sont placés près des titres, les doublons près des sous-titres sont supprimés.

## Fichiers modifiés
- `index.html`
- `src/main.js`
- `src/style.css`

## Vérifications
- `node --check src/main.js` : OK
- `npm run build` : OK

## Notes
- Si Duel.ink renvoie encore 401 sur certains replays avec un token valide, ce n'est pas corrigible côté InkSight : le replay est refusé par Duel.ink. InkSight doit seulement le mettre de côté sans polluer l'import manuel.
- Les images Lorcast dépendent du réseau et peuvent apparaître progressivement après le rendu initial.
