# V131 — Saved opponent export + mobile bottom nav hardening

## Changements

- Conservation de l'estimation de decklist adverse dans `analysis_json` lors de la sauvegarde.
- Restauration de l'estimation lors de l'ouverture d'une analyse depuis l'historique.
- Fallback prudent pour les anciennes analyses sauvegardées : export possible à partir des cartes adverses vues, avec estimation conservatrice.
- Ajout d'une tab bar mobile plus sûre : largeur contrainte au viewport, prise en compte de `safe-area` et `visualViewport`, et auto-masquage doux au scroll vers le bas.
- Réapparition automatique du menu mobile au scroll vers le haut, au changement d'onglet, au focus ou au toucher.

## Vérifications

- `node --check src/main.js` OK
- `node --check api/getCoachCommentary.js` OK
- `npm run build` non lancé ici : `vite` n'est pas installé dans le sandbox.
