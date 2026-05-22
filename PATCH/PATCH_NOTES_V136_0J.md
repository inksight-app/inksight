# V136.0J — Queue leak, analytics chunking & UX hotfix

## Corrections

- Vide la file d’import manuel avant tout nouvel import manuel pour éviter que des erreurs Duel.ink restent affichées dans la file.
- Nettoie automatiquement les éléments API Duel.ink de la file après un import en arrière-plan, y compris quand tous les replays du lot sont en erreur.
- Découpe le chargement des tables analytiques Supabase (`saved_games`, `saved_card_stats`, `saved_turn_stats`) par lots de 40 match IDs pour éviter les requêtes PostgREST trop lourdes.
- Réhydrate les images des cartes depuis `lorcana-cards-import-ready.json` après l’allègement de `analysis_json`.
- Restaure les cartes clés du détail Historique depuis `saved_card_stats` quand `analysis_json` n’est pas chargé dans la liste.
- Corrige le layout du bouton Discord et le partage 50/50 des onglets Statistiques / Historique.
- Ajoute des protections CSS anti-débordement pour les filtres, cartes, Mulligan Lab et listes d’import.

## Notes

Les erreurs 401 Duel.ink peuvent encore arriver si certains replays sont temporairement indisponibles côté Duel.ink. Elles sont désormais isolées et ne doivent plus polluer l’import manuel.
