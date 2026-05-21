# InkSight V135.9B — Account simplifié + import API en arrière-plan

## Objectif
Simplifier la page Compte pour un joueur non technique et faire en sorte que l’import Duel.ink reste sur la page Compte, sans donner l’impression qu’il faut repasser par la page Analyse pour sauvegarder.

## Changements UX
- Suppression de la page Compte des blocs de maintenance non prioritaires :
  - Versions de decks
  - Qualité des données
  - Analyses à vérifier
  - Images manquantes
  - Analyses partielles
- Suppression du bloc de nettoyage post-import dans l’historique.
- Suppression des raccourcis redondants “Mon compte / Mes statistiques / Historique” dans le bloc de connexion.
- Simplification de la carte Duel.ink :
  - bouton principal “Synchroniser”
  - boutons “Importer 25 / 50 / 100 / Tout importer”
  - résumé compact après scan
  - liste détaillée des 80 matchs masquée pour éviter la surcharge.

## Changements flow API
- L’import Duel.ink ne doit plus activer visuellement une analyse dans la page Analyse pendant le flux automatique.
- La file d’import manuelle reste disponible pour les fichiers déposés manuellement, mais elle n’est plus le chemin visible principal pour l’API.
- La sauvegarde par lot retourne maintenant un résumé propre pour afficher le vrai nombre de parties ajoutées après nettoyage de la file.
- Les outils de nomination de deck par lot sont masqués pour l’instant.

## Fichiers modifiés
- `index.html`
- `src/main.js`
- `src/style.css`
- `PATCH/PATCH_NOTES_V135_9B.md`

## Vérifications
- `node --check src/main.js` : OK
- `npm run build` : OK

Le warning Vite sur la taille du bundle reste non bloquant.
