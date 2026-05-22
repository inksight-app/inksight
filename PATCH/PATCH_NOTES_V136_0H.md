# InkSight V136.0H — Scalability hotfix historique Supabase

## Problème corrigé

Après l'import de beaucoup de replays, Supabase pouvait renvoyer :

```txt
canceling statement due to statement timeout
```

La cause principale était la requête de liste de l'historique : elle récupérait jusqu'à 5000 matchs avec `analysis_json`, une colonne très lourde contenant l'analyse complète.

## Corrections

- `listSavedMatches()` ne récupère plus `analysis_json` pour la liste de l'historique.
- La limite de l'historique est plafonnée à 500 lignes côté fonction Supabase.
- `refreshSavedMatches()` demande maintenant 500 lignes maximum au lieu de 5000.
- L'analyse complète est chargée uniquement au clic sur un match via `getSavedMatch(matchId)`.
- Le bouton d'ouverture d'une analyse devient asynchrone et charge le JSON lourd à la demande.
- Les appels manifest Duel.ink sont découpés par lots de 10 IDs pour éviter les gros pics côté API.

## Impact UX

- L'historique ne devrait plus disparaître à cause d'un timeout Supabase.
- Les Stats et Historique chargent plus vite.
- Ouvrir une analyse depuis l'historique peut afficher brièvement “Chargement de l’analyse complète…”, puis charger le replay.

## Fichiers modifiés

- `src/main.js`
- `src/supabase.js`
