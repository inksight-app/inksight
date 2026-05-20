# V129 — Background artifact cleanup

## Correctifs

- Suppression du calque `.ambient` filtré/blur responsable du rectangle visible en haut de page.
- Désactivation du suivi de souris `--mx / --my` sur le document pour éviter les repaints et les artefacts visuels.
- Conservation des halos de bicolorité, mais en gradients statiques directement sur le `body`.
- Neutralisation des grands `backdrop-filter` sur les surfaces principales pour éviter les carrés sombres et améliorer la stabilité visuelle.
- Maintien d'un grain très discret via `body::after`, sans clipping ni rectangle.

## Impact attendu

- Plus de bloc bleu/noir visible en haut à gauche ou au centre.
- Fond plus propre sur desktop.
- Moins de repaints au mouvement de souris.
- Base plus stable avant les prochaines étapes UX/API.
