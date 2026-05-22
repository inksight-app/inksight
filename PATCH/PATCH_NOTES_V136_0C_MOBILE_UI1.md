# V136.0C-Mobile-UI1 — Corrections UX mobile ciblées

Base : version actuelle fournie par l’utilisateur, conservée comme base saine.  
Objectif : appliquer uniquement des corrections mobile à faible risque, sans refonte desktop, sans modifier Supabase ni l’API Duel.ink.

## Corrections appliquées

### 1. Contenu masqué par la navigation mobile
- Ajout d’une réserve verticale mobile plus généreuse pour les vues principales.
- Ajout de marges basses sur les derniers blocs de page afin que les boutons et cartes ne passent plus sous la bottom nav.

### 2. Onglets horizontaux
- Renforcement du scroll horizontal propre sur les onglets Analyse et Stats.
- Ajout d’un padding de fin pour que les derniers onglets comme “Journal”, “Matchups” ou “Données” puissent être entièrement atteints.
- Aucun onglet n’est compressé pour rentrer artificiellement dans la largeur mobile.

### 3. Textes de description coupés
- Limitation propre à deux lignes des descriptions longues dans les sections Stats, Matchups, Courbes et panels similaires.
- Suppression des comportements de casse agressive sur certains titres afin d’éviter les mots coupés de manière étrange.

### 4. Bloc import replay mobile
- Bloc d’import légèrement compacté sur mobile.
- Bouton “Choisir un fichier” renforcé comme action principale mobile.
- Gestion plus propre des longs noms de fichiers.

### 5. Bloc Duel.ink mobile
- Placeholder du champ token raccourci.
- Le bouton principal post-synchronisation affiche maintenant “Actualiser” au lieu de “Duel.ink synchronisé”.
- L’état “Duel.ink synchronisé” reste porté par le badge de statut, pas par un gros bouton ambigu.
- Les boutons d’import restent en pleine largeur sur mobile.

## Fichiers modifiés
- `src/style.css`
- `src/main.js`
- `PATCH/PATCH_NOTES_V136_0C_MOBILE_UI1.md`

## Vérifications
- `node --check src/main.js`
- `npm run build`
