# InkSight V132.1b — Filtres toggle & layout desktop

## Objectif
Nettoyer l'interface des filtres sans refondre l'application : supprimer les boutons "Tous", rendre les matchups plus visuels et ajouter le repli des filtres sur la page Mes statistiques.

## Changements

- Ajout du bouton **Masquer les filtres / Modifier les filtres** sur **Mes statistiques** aussi sur desktop.
- Passage des filtres en **chips toggle multi-sélection** :
  - aucune sélection = tout est inclus ;
  - un clic sélectionne ;
  - un second clic désélectionne ;
  - sélectionner toutes les valeurs d'un groupe revient automatiquement à aucun filtre actif.
- Suppression visuelle des boutons :
  - Toutes les bicolorités ;
  - Tous matchups ;
  - Tous ;
  - OTP + OTD.
- Matchups adverses affichés en mode compact : pastilles de couleur visibles + nombre de matchs uniquement.
- Layout desktop des filtres Mes statistiques réorganisé pour éviter l'effet amas de boutons.
- Historique conservé sur sa base actuelle, avec la même logique de chips toggle.

## Notes techniques

- Les `select` techniques restent présents dans le HTML pour préserver la structure existante, mais l'état des filtres est piloté par `state.filterSelections`.
- Aucun changement volontaire du parser ou de Supabase dans cette version.
