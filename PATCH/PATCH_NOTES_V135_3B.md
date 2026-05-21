# V135.3B — Duel.ink import polish + API replay QA fixes

## Objectif
Stabiliser l'expérience après le premier import Duel.ink : page Compte plus propre, suivi d'import visible, corrections d'affichage dans les analyses issues de l'API.

## Corrections

- Refonte UX globale de la page Compte : espacements, coins arrondis cohérents, conteneurs moins collés.
- Ajout d'un suivi visuel pendant l'import Duel.ink : compteur, barre de progression, lignes en attente / en cours / OK / erreur.
- Suppression du halo autour des pastilles victoire / défaite dans l'historique.
- Séquence de jeu : meilleure récupération des miniatures à partir du nom de carte quand l'objet carte complet n'est pas transmis par le replay API.
- Cartes restées en main : ajout d'un fallback prudent depuis la main de départ / mulligan si le tracking précis par instance ne ressort pas dans certains replays API.

## Non inclus

- Pas d'import automatique dans l'historique.
- Pas de sauvegarde automatique.
- Pas de stockage du token.
- Pas encore d'exploitation de la decklist adverse complète API dans l'onglet Cartes vues.

## Fichiers modifiés

- `src/main.js`
- `src/style.css`
- `PATCH_NOTES_V135_3B.md`

## Fichiers non modifiés

- `index.html`
- `src/supabase.js`
- migrations Supabase
