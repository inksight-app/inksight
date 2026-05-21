# V133.2 — Dead Weight global + wording encrage

## Objectif

Étendre le signal “cartes restées en main” aux statistiques globales et clarifier les libellés liés aux cartes encrées.

## Modifications

- Ajout d’un bloc “Cartes souvent bloquées” dans `Performances > Mes statistiques > Cartes`.
- Agrégation des données `handRetention` des analyses sauvegardées filtrées.
- Respect des filtres globaux existants : bicolorité, matchup adverse, format, OTP/OTD, résultat.
- Ajout de badges simples : Encrable / Non-encrable, passages longs, fin fréquente.
- Remplacement du terme “sacrifiée” par “encrée” / “depuis main” dans les classements de cartes encrées.
- Clarification des aides : “Depuis main” = carte encrée depuis la main ; “Défausse/board → encre” = ajout par effet.

## Vérifications

- `node --check src/main.js` : OK
- `npm run build` : OK
