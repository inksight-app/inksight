# V129.4 — Correction structurelle du rectangle de fond

## Correction
- Le halo souris est conservé, mais il est déplacé dans un seul calque full-viewport `body::before`.
- L'ancien calque `.ambient` est neutralisé définitivement.
- Le parent du header ne porte plus de `backdrop-filter`, afin d'éviter une boîte GPU visible en haut de page.
- `body` repasse sur un fond noir simple, sans `background-attachment: fixed`.
- Les zones `app-view`, `hero-section` et `upload-grid` ne portent plus de fond ni de clipping.

## Pourquoi
Le rectangle bleu/noir visible en haut était causé par une combinaison de calques de fond concurrents : anciens pseudo-éléments, calque `.ambient`, backdrop du header et backgrounds à attachement fixe. Le rendu Chrome créait une ligne de clipping lors des changements de largeur/fenêtre.
