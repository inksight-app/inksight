# InkSight V136.0V — Mobile simplification & grid cleanup

## Objectif
Correctif ciblé sur l’UX mobile, sans modifier Supabase, Duel.ink, les imports, les calculs statistiques ni la logique métier.

## Changements appliqués

### 1. Grille mobile unifiée
- Ajout d’une largeur mobile commune pour les panneaux principaux : `min(calc(100vw - 32px), 760px)`.
- Harmonisation des marges gauche/droite sur Analyse, Stats, Historique, Compte, Duel.ink et blocs internes principaux.
- Réduction du padding bas global pour éviter les grands vides sous le dernier bloc.

### 2. Bloc “Replays importés” mobile
- Passage du header en colonne sur mobile pour éviter que le titre et le bouton soient comprimés.
- Le bouton “Changer de replay” prend toute la largeur utile sur mobile.
- Le texte de statut reste lisible et ne force plus le layout.

### 3. Vue d’ensemble Stats simplifiée
- Suppression du KPI “Contexte / Données solides” de la grille principale pour éviter les répétitions.
- La grille KPI affiche maintenant uniquement : volume de matchs filtrés et winrate.
- Les textes du plan d’action ne répètent plus inutilement le pourcentage de winrate déjà visible dans les KPI.
- Le bloc “Formats” est masqué dans la vue d’ensemble mobile pour réduire les informations non prioritaires.

### 4. Cartes statistiques allégées
- Standardisation du rendu mobile des cartes : image stable à gauche, texte/statistiques à droite.
- Limitation des badges visibles pour éviter les cartes trop chargées.
- Suppression visuelle des effets “carte dans la carte” sur les mini-signaux de la vue d’ensemble.
- Les noms de cartes restent lisibles sur deux lignes maximum.

### 5. Historique plus orienté usage
- Les badges techniques Duel.ink ont été réduits : on affiche “Duel.ink” au lieu de plusieurs labels techniques.
- Masquage mobile des badges peu utiles comme `matchmaking` / `core-bo1` lorsqu’ils encombrent la carte.
- La carte historique garde surtout les informations utiles : format, résultat, score, adversaire, tours/date et action.
- Le menu `…` reste compact, avec les actions secondaires sous la carte.

### 6. Page Compte
- Espacement mobile régulier entre les blocs Compte, connexion et Duel.ink.
- Même largeur que les autres panneaux principaux.

## Validation réalisée
- `node --check src/main.js` : OK.
- `npm run build` : non exécuté jusqu’au bout dans l’environnement fourni, car la commande `vite` n’est pas disponible localement (`sh: vite: not found`).

## Fichiers modifiés
- `index.html`
- `src/main.js`
- `src/style.css`
- `PATCH/PATCH_NOTES_V136_0V.md`
