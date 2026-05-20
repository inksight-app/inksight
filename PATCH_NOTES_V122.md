# V122 — Match Read tactique + readouts de graphes utiles

## Base
- Reprise sur la base saine V116/V121, sans modification du parsing lourd ni du workflow Supabase.

## Graphiques
- Les blocs au-dessus des graphiques affichent maintenant des informations utiles même sans survol :
  - état de la course au lore ;
  - axe dominant du plan de jeu ;
  - conversion de l’encre ;
  - stabilité de la main.
- Au survol/clic, les valeurs du tour remplacent le contenu du même bloc dédié, sans se superposer aux légendes.
- Barres Chart.js rendues plus denses pour éviter l’effet trop fin / trop vide.

## Diagnostic rapide / Match Read
- Ajout de `generateMatchRead(sessionData)`.
- Le titre et le commentaire sont désormais choisis selon des conditions factuelles :
  - victoire parfaite ;
  - large victoire ;
  - brick / large défaite ;
  - défaite totale ;
  - match serré ;
  - perte de Card Advantage ;
  - match Control / attrition ;
  - fuite d’encre ;
  - victoire par lore passif des lieux.
- Les scores ne sont plus hardcodés dans les phrases : les variables du replay sont injectées dans les textes.
- Sélection stable des phrases pour éviter que le diagnostic change à chaque rendu.

## Vérification
- `node --check src/main.js` OK.
- `npm run build` non exécuté : `vite` n’est pas installé dans le sandbox.
