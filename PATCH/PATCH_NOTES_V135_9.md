# InkSight V135.9 — API direct import flow

Objectif : simplifier le parcours Duel.ink pour un utilisateur public.

## Changements

- Les boutons Duel.ink `Importer 25 / 50 / 100 / Tout importer` déclenchent maintenant le flux complet :
  1. téléchargement du lot ;
  2. analyse des replays ;
  3. sauvegarde automatique dans l’historique ;
  4. mise à jour des compteurs.
- L’import manuel reste inchangé : un replay déposé peut toujours être analysé avant sauvegarde.
- Le vocabulaire reste simple côté UI : on garde `Importer`, même si techniquement le flux API importe et sauvegarde.
- Les replays indisponibles continuent d’être mis de côté pour ne pas bloquer les lots suivants.
- Après chaque lot, le résumé affiche les parties ajoutées à InkSight, les doublons et les erreurs mises de côté.
- Le mode d’import API est loggé sous `duelink_batch_import_save` dans `duelink_sync_runs`.

## Fichiers modifiés

- `src/main.js`

## Vérifications

- `node --check src/main.js` : OK
- `npm run build` : OK

## Notes

Aucune nouvelle migration Supabase n’est nécessaire si la V135.8C a déjà été appliquée.
