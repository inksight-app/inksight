# V135.4C — Sync UX cleanup + API replay parity

Base : V135.4B

## Objectif
Simplifier le parcours Duel.ink, éviter la confusion entre import et sauvegarde, et rendre les replays importés via API plus proches des imports manuels dans les modules d’analyse.

## Changements

### Duel.ink / Compte
- Suppression du bouton ambigu `Importer + sauvegarder`.
- Conservation d’un seul chemin d’action : tester, prévisualiser, importer les nouveaux replays dans la file.
- Après import, la section Compte affiche un résumé compact et un bouton `Voir la file d’import` au lieu d’une longue liste de 25 replays.
- Ajout d’une navigation directe vers la file d’import.

### File d’import
- Après sauvegarde d’un lot API ou d’un lot multiple, les éléments `sauvegardé` et `doublon` sont retirés automatiquement de la file.
- Les erreurs restent visibles pour correction.
- Le comportement d’un import manuel unique reste préservé pour permettre de consulter l’analyse.

### Dead Weight / Cartes restées en main
- Harmonisation entre imports API et imports manuels.
- Le tracking précis par instance est conservé.
- Un fallback depuis la main résolue du mulligan est désormais combiné au tracking principal, afin d’éviter les faux vides quand Duel.ink décale les instances en main.

### Séquence de jeu / Journal
- Les cartes liées à la timeline sauvegardée conservent maintenant une carte compacte, avec image et métadonnées.
- Les analyses sauvegardées depuis l’API conservent mieux les miniatures dans `Séquence de jeu` et `Journal`.

### UI des blocs statistiques
- Ajout de boutons info ronds et stables sur les blocs de liste principaux.
- Les longues explications sont déplacées dans les popovers info.
- Les sous-textes visibles sont raccourcis pour éviter les cartes désalignées.

## Fichiers modifiés
- `index.html`
- `src/main.js`
- `src/style.css`
- `PATCH_NOTES_V135_4C.md`

## Vérifications
- `node --check src/main.js` : OK
- `npm run build` : non exécuté dans le sandbox actuel car `vite` n’est pas installé dans cet environnement.
