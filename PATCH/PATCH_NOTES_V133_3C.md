# V133.3C — Fix Dead Weight global après sauvegarde

## Objectif
Corriger le cas où les données Dead Weight apparaissent dans l’analyse de match mais restent absentes dans les statistiques globales et le Mulligan Lab.

## Cause
Les lignes détaillées sauvegardées côté Supabase pouvaient contenir le mulligan mais pas encore `hand_retention`.
Le code les lisait en priorité, puis ignorait le fallback plus complet présent dans `analysis_json.games`.

## Corrections
- Ajout de `hand_retention` dans `game_json` pour les nouvelles sauvegardes détaillées.
- Le calcul global Dead Weight ne marque plus une game comme traitée si aucune donnée de main n’y est trouvée.
- Le Mulligan Lab privilégie maintenant la version de la game qui contient aussi les données Dead Weight.

## Vérifications
- `node --check src/main.js` : OK
