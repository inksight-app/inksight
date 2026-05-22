# InkSight V136.0Q — Mobile UX cleanup

Correctif ciblé sur la version mobile, sans modification Supabase, API Duel.ink ou logique statistique.

## Changements principaux

- Ajout d’une normalisation mobile des titres de sections : les descriptions longues sous les titres peuvent être déplacées dans un bouton d’information `i` pour éviter les textes coupés à droite.
- Amélioration de la modale d’information : titre, texte lisible, fond assombri, largeur adaptée au mobile.
- Sécurisation de l’isolation des vues : les blocs Compte / Discord / Duel.ink ne doivent plus apparaître dans la vue Analyse.
- Unification du comportement des filtres Stats et Historique : le bouton de masquage contracte maintenant tout le contenu des filtres, et pas seulement une ligne.
- Correction mobile de l’alignement des actions ouvertes dans les cartes d’historique : les boutons ne sont plus décalés par la pastille résultat.
- Neutralisation du style du bouton “Voir toutes les cartes” pour éviter l’effet de surlignage étrange.
- Suppression des fragments techniques Duel.ink visibles dans l’aide utilisateur : message simplifié “Connexion Duel.ink mémorisée”.
- Ajustement du padding bas mobile pour éviter un grand vide après le dernier bloc tout en gardant le contenu lisible au-dessus de la navigation fixe.
- Harmonisation des marges mobiles des panneaux principaux à `16px` de chaque côté.

## Validation effectuée

- `node --check src/main.js`
- `npm run build`

## À vérifier sur iPhone / Safari

1. Page Analyse sans connexion : aucun bloc Compte ne doit apparaître sous l’import.
2. Stats > Courbes / Mulligan Lab / Matchups : les descriptions longues ne doivent plus être coupées.
3. Boutons `i` : ils doivent être à côté des titres et ouvrir une modale lisible.
4. Stats : “Masquer les filtres” doit masquer tout le bloc de filtres.
5. Historique : “Filtres avancés” doit se comporter de façon cohérente.
6. Historique : ouvrir “Options” ne doit plus créer un grand vide à gauche des boutons.
7. Compte > Duel.ink : plus de fragment de token ou identifiant technique visible.
8. Bas de page : le dernier bloc reste accessible sans énorme vide inutile.
