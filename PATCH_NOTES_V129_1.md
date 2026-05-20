# V129.1 — Cursor halo restored, artifact fixed

- Restaure le halo interactif qui suit la souris.
- Rend le suivi volontairement plus doux grâce à une interpolation `requestAnimationFrame`.
- Supprime la cause probable du rectangle bleu/noir : plus de gros `filter: blur()` sur `.ambient`.
- Confine le calque `.ambient` au viewport avec `inset:0`, `height:100dvh`, `overflow:hidden` et `contain:paint`.
- Garde les halos de bicolorité statiques + l’aura interactive sans casser l’identité visuelle.
- Sur mobile ou en `prefers-reduced-motion`, le halo reste présent mais statique et plus discret.
