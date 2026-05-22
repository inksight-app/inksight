# V136.0C — Mobile UI2

Objectif : continuer le polish mobile sur la base V136.0C, sans toucher à Supabase, à l’API Duel.ink ni aux calculs.

## Changements appliqués

### 1. Réserve basse mobile plus juste
- Suppression de la double réserve `body + main-shell` qui créait un grand vide en bas.
- Conservation d’une marge de sécurité plus proche de la hauteur réelle de la bottom navigation.

### 2. Sous-titres mobiles plus propres
- Les descriptions importantes ne disparaissent plus dans un fade/crop agressif.
- Les sous-titres longs des sections Performance ont été raccourcis dans le HTML.
- Ajout de boutons info `i` sur : Cartes du deck, Mulligan Lab, Matchups rencontrés, Courbes moyennes.

### 3. Historique mobile recentré
- La pastille victoire/défaite est intégrée dans la première ligne du match.
- Elle ne crée plus une colonne vide à gauche qui décalait toute la carte.

### 4. Boutons “Voir toutes les cartes” simplifiés
- Le CTA devient un seul bouton du type “Voir les X cartes”.
- Suppression visuelle du badge séparé qui donnait un effet de surlignage/double bouton.

### 5. Texte Duel.ink simplifié
- Suppression de l’indice technique de clé du type `(769f...4a3f)` dans l’UI.
- Remplacement par un message plus clair : clé mémorisée, synchronisation possible sans recoller la clé.

### 6. Onglets horizontaux
- Ajout d’une réserve à droite pour permettre au dernier onglet de s’afficher entièrement après scroll.

## Fichiers modifiés
- `index.html`
- `src/main.js`
- `src/style.css`

## Vérifications
- `node --check src/main.js` : OK
- `npm run build` : OK
- Warning Vite sur la taille du bundle : non bloquant.
