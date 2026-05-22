# InkSight V136.0G — Auth history stability + mobile overflow hardening

## Objectif
Stabiliser l’affichage Historique / Stats après les imports Duel.ink et corriger les derniers débordements de textes sur mobile.

## Corrections
- Ne plus passer en état “déconnecté” sur une session Supabase temporairement nulle.
- Ne plus vider l’historique visible si un refresh renvoie 0 ligne alors que des matchs étaient déjà affichés.
- Ne plus effacer `currentUser` lors d’un incident cloud temporaire : seul `SIGNED_OUT` vide l’état utilisateur.
- Ajout d’un état “Vérification de la session…” au lieu de “Connectez-vous” lorsqu’une session est encore en cours de résolution.
- Raccourcissement du signal Dead Weight dans le Mulligan Lab : `2.5T en main · max 6T`.
- Ajout d’un durcissement CSS mobile contre les débordements de textes dans Stats, filtres, cartes, Mulligan Lab, Courbes et Compte.
- Les rangées de filtres / onglets restent scrollables horizontalement sans dépasser du conteneur.

## Fichiers modifiés
- `src/main.js`
- `src/style.css`
- `PATCH/PATCH_NOTES_V136_0G.md`

## Vérifications
- `node --check src/main.js` OK
- `npm run build` OK
