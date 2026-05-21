# V135.4B — Sync anti-doublons & maintenance UX

## Objectif
Stabiliser le parcours Duel.ink après l’ajout de l’import + sauvegarde contrôlée.

## Corrections

- Empêche de réimporter deux fois les mêmes replays Duel.ink dans la file d’import.
- Les matchs Duel.ink déjà présents dans la file sont maintenant marqués `Déjà dans la file` dans la prévisualisation.
- Les boutons d’import se recalculent après import/sauvegarde pour éviter de relancer un lot déjà chargé.
- Le contrôle anti-doublons prend maintenant en compte :
  - les matchs déjà sauvegardés ;
  - les replays déjà présents dans la file d’import ;
  - les IDs Duel.ink disponibles.
- Ajout d’un gestionnaire plus direct dans `Compte > Maintenance` pour supprimer un doublon probable sans devoir passer par la base Supabase.
- Renommage de l’entrée principale `Performances` en `Stats & historique` pour mieux refléter la page.
- Ajout de styles pour rendre la maintenance des doublons plus lisible et plus sûre.

## Fichiers modifiés

- `index.html`
- `src/main.js`
- `src/style.css`
- `PATCH_NOTES_V135_4B.md`

## Non modifié

- `src/supabase.js`
- `api/*`
- migrations Supabase

