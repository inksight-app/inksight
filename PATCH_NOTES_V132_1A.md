# V132.1a — Hotfix encrage adverse + filtres globaux alignés historique

## Data / parser
- Corrige le calcul des cartes encrées pour l’adversaire.
- Une carte compte dans le classement “cartes encrées” uniquement si elle est identifiée comme encrée depuis la main.
- Les cartes déplacées vers l’encrier depuis la défausse, le board ou une autre zone publique ne sont pas comptabilisées comme cartes sacrifiées depuis la main.
- Pour l’adversaire, les encrages visibles depuis la main sont pris en compte ; les encrages face cachée non identifiables restent ignorés.

## Mes statistiques
- Conservation de la logique actuelle : bicolorité en filtre principal, pas le deck.
- Ajout du filtre matchup adverse.
- Ajout du filtre OTP / OTD.
- Ajout d’un bouton Réinitialiser.
- La Vue d’ensemble et le Mulligan Lab utilisent maintenant le contexte global sélectionné.

## Historique
- Ajout du filtre OTP / OTD.
- Conservation de la recherche et du bouton masquer/afficher les filtres.
- Matchups adverses affichés de manière plus compacte avec pastilles de couleurs.

## Mulligan Lab
- Suppression des filtres internes matchup et OTP / OTD pour éviter les doublons.
- Le contexte appliqué vient des filtres globaux du haut.
