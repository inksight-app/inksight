# V121 — Graph UX safe pass

Base: `lorcana_v116_1_stable_recovery_perf_safe_stackblitz.zip`.

Objectif: corriger uniquement l’UX des graphiques, sans toucher au parsing ni aux calculs.

## Modifications

- Ajout d’un bloc de lecture fixe au-dessus des graphiques principaux:
  - Lore gagné par tour
  - Actions par tour
  - Économie d’Encre
  - Efficacité de la main
- Le tooltip ne flotte plus par-dessus la légende quand un bloc fixe existe: les informations remplacent le contenu du bloc.
- Les datasets techniques de type ligne de victoire / objectif sont ignorés dans le readout pour éviter les doublons illisibles.
- Les barres Chart.js sont rendues plus denses par défaut pour les graphiques à barres qui n’ont pas de réglage spécifique.
- Ajustement CSS léger pour conserver des blocs fins, homogènes et lisibles sur desktop comme sur mobile.
- Aucun changement volontaire sur:
  - parsing Duel.ink
  - stats cartes
  - Supabase
  - historique
  - diagnostic rapide

## Vérifications

- `node --check src/main.js` : OK
- `npm run build` : non exécuté, Vite n’est pas installé dans le sandbox (`vite: not found`).
