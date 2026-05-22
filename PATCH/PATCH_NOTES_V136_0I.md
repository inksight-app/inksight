# InkSight V136.0I — Duel.ink auth download hotfix + cache check

## Objectif
Corriger l'erreur 401 lors du téléchargement des replays Duel.ink avec une clé mémorisée, et clarifier le diagnostic de cache après le hotfix DB scale.

## Corrections
- Le header `Authorization: Bearer <session Supabase>` est maintenant requis et injecté pour les appels API Duel.ink qui doivent retrouver la clé chiffrée côté Vercel.
- `/api/duelink-download`, `/api/duelink-replays` et `/api/duelink-history` renvoient maintenant un 401 clair quand la session InkSight ou la clé Duel.ink manque, au lieu d'un 500 générique.
- Le hotfix DB scale reste actif : la liste Historique ne charge pas `analysis_json` et ne demande plus 5000 lignes.

## À faire côté navigateur
Après déploiement, effectuer un hard refresh / ouvrir en navigation privée si l'ancien bundle continue d'appeler `saved_matches?...analysis_json...limit=5000`.
