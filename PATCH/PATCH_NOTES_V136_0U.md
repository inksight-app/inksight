# V136.0U — Historique façon Duel.ink + nettoyage overview mobile

Correctif ciblé basé sur la V136.0T. Aucun changement Supabase, API Duel.ink ou calcul statistique.

## Changements principaux

- Historique mobile inspiré de Duel.ink : séparation par date hors des cartes, rail de résultat à gauche, bouton `…` compact sur le côté.
- Les actions d’un match ne sont plus affichées en gros bouton permanent : elles s’ouvrent via `…` avec Voir l’analyse / Détails / Supprimer.
- Suppression du bouton `Fermer` pleine largeur dans le menu d’actions ; le bouton `…` sert aussi à refermer.
- Vue d’ensemble Stats allégée : suppression du bloc BO3 isolé et réduction des doublons entre échantillon / winrate / contexte.
- Mulligan Lab : la pastille Dead Weight longue est raccourcie en `Après keep : xT` pour éviter les textes coupés.
- Page Compte : rétablissement d’un espacement plus régulier entre les grands blocs.
- Mode paysage mobile : garde-fou pour éviter l’affichage simultané de deux navigations.

## Vérifications

- `node --check src/main.js` : OK
- `npm run build` : OK après installation locale des dépendances

## Points à vérifier au déploiement

- Historique mobile : dates hors cartes, bouton `…`, menu d’actions lisible.
- Stats > Vue d’ensemble : moins de blocs redondants, plus de bloc BO3 inutile quand il vaut 0.
- Stats > Mulligan Lab : aucune pastille ne dépasse à droite.
- Compte mobile : blocs séparés par un espace constant.
- Téléphone en paysage : une seule navigation visible.
