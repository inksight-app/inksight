# V134.2 — Résumé & Stats structure cleanup

Base : V134.1 — Graph colors consistency

## Objectif
Clarifier la séparation entre l’onglet Résumé et l’onglet Statistiques.

## Changements

- Retrait du graphique **Actions par tour** de l’onglet Résumé.
- Conservation de **Course aux 20 lore** comme graphique macro principal du Résumé.
- Déplacement de **Actions par tour** dans l’onglet Statistiques.
- Le graphique Actions par tour est maintenant calculé selon le scope actif :
  - **Mes stats** : uniquement les actions du joueur analysé.
  - **Stats adverses** : uniquement les actions adverses.
- Texte dynamique :
  - « Vos cartes encrées, jouées, quêtes et défis par tour. »
  - « Actions adverses détectées pendant ses tours. »
- Correction du sous-texte **Présence sur board** pour ne plus laisser penser que le lore potentiel est une courbe principale.
- Grille responsive ajustée :
  - Résumé : Course aux 20 lore pleine largeur.
  - Statistiques desktop : 2 colonnes.
  - Statistiques mobile : 1 colonne.

## Non modifié

- Parser Duel.ink.
- Import replay.
- Supabase.
- Dead Weight.
- API Duel.ink.
- Calculs des autres métriques.

## Vérifications

- `node --check src/main.js` : OK.
- ZIP propre : pas de `node_modules`, pas de `dist`, pas de `.env`.
