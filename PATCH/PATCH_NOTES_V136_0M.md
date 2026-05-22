# V136.0M — UI architecture + image stability

Objectif : repartir d'une base saine côté interface après les correctifs V136.0J/K/L, sans modifier la base de données.

## Corrections principales

- Navigation principale stabilisée : 3 entrées fixes `Analyse`, `Stats`, `Compte`.
- Menu mobile repassé à 3 boutons égaux, avec icône + libellé court, sans débordement horizontal.
- Sous-onglets `Mes statistiques / Historique des matchs` corrigés avec un vrai layout 50/50.
- Page Compte réalignée : hero, bloc connexion et bloc Duel.ink utilisent des largeurs cohérentes.
- Bouton Discord recentré et limité en largeur sur desktop.
- Images de cartes stabilisées : suppression de la réhydratation Supabase/analysis_json pour les images des stats.
- Ajout de `getCardImageLocal(cardNameOrId, { highRes })`, qui privilégie les données directes, l'index local et le cache Lorcast déjà disponible.
- Modale carte : utilisation prioritaire d'une image haute qualité si disponible.
- Onglets Performance : suppression du refresh historique déclenché au simple clic sur l'onglet Historique.
- Filtres : le bouton masquer ferme maintenant tout le bloc de filtres, sans conserver un grand espace vide.
- CSS anti-débordement renforcé sur cartes, chips, badges, panneaux, stats et historique.

## Notes importantes

Le fichier local `lorcana-cards-import-ready.json` contient les métadonnées cartes, mais pas toutes les URLs d'images. La version stabilise donc l'affichage en évitant de faire dépendre les images des gros `analysis_json` Supabase. Quand une image est disponible directement ou via cache Lorcast, elle est conservée et ne doit plus disparaître après un re-render.

## Fichiers modifiés

- `index.html`
- `src/main.js`
- `src/style.css`

## Vérifications

- `node --check src/main.js` : OK
- `npm run build` : OK

## Tests recommandés

- Desktop 1440px : menu principal, page Compte, bouton Discord, sous-onglets Stats/Historique.
- Mobile 390px : menu bottom 3 boutons, aucun débordement horizontal.
- Stats > Cartes : les images ne doivent plus disparaître après changement d'onglet.
- Stats > Mulligan Lab : les cartes doivent rester stables.
- Modale carte : utiliser la meilleure image disponible.
- Historique : changer entre Stats/Historique ne doit plus déclencher de gros recalcul ou refresh Supabase automatique.
