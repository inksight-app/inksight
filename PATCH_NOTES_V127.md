# V127 — Coach Cultural Pack

## Objectif
Enrichir la base locale du coach InkSight avec davantage de références culturelles, sportives, Disney/Pixar, pop culture, eSport et TCG, sans modifier le parser ni la logique de sauvegarde.

## Modifications
- Passage de 420 à 840 lignes de commentaires.
- 21 scénarios conservés, chacun enrichi à 40 variantes.
- Ajout de références inspirées du commentaire sportif francophone :
  - second poteau,
  - clinique/chirurgical,
  - pas aujourd’hui,
  - photo-finish,
  - il n’y a pas eu photo,
  - sanction immédiate,
  - break fait,
  - prolongations, money time et clim finale.
- Ajout de clins d’œil Disney/Pixar courts :
  - Vers l’infini,
  - Hakuna Matata,
  - Longue vie au roi,
  - Mauvais levier,
  - Boom bébé,
  - Nage droit devant,
  - Casa Madrigal / rente immobilière,
  - Je vais tout casser.
- Ajout de références pop culture courtes :
  - Houston, problème,
  - Tu ne passeras pas,
  - La vie trouve un chemin,
  - Mon précieux,
  - Êtes-vous divertis,
  - Sur un malentendu.
- Les textes restent courts pour l’UI mobile :
  - title max 46 caractères,
  - description max 185 caractères.

## Sécurité éditoriale
- Le sarcasme vise la situation de jeu, le tempo, la curve, le board ou la variance.
- Pas d’attaque personnelle sur l’identité du joueur.
- Les longues citations protégées sont évitées ; seules des références très courtes ou des détournements sont utilisés.

## Fichiers modifiés
- public/coach-lines.json
- api/coach-lines.js
