# V133.3A — Global Dead Weight data bridge

## Corrections

- Correction de la lecture des données Dead Weight sauvegardées dans les statistiques globales.
- Support des formats `handRetention` et `hand_retention.mine` dans les analyses sauvegardées.
- Le Mulligan Lab global récupère maintenant aussi les données Dead Weight associées aux mains gardées.
- Amélioration de l’affichage vide du bloc “Cartes souvent bloquées” dans l’onglet Cartes.

## Vérifications

- `node --check src/main.js` : OK
- `npm run build` : OK
