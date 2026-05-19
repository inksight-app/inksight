# V120 — Performance recovery INP / CLS

Objectif : corriger les freezes après la V118/V119 et rendre la navigation Performances / Analyse plus réactive.

## Correctifs principaux

- Rendu paresseux des onglets d’analyse : Résumé, Statistiques, Cartes vues et Journal ne sont plus reconstruits tous ensemble.
- Suppression du double rendu du Journal qui reconstruisait les grosses timelines deux fois.
- Rendu paresseux des Performances : Statistiques, Historique et Compte ne sont plus recalculés simultanément.
- Chargement de l’historique Supabase différé : il ne se lance plus automatiquement au démarrage, mais quand l’utilisateur ouvre Performances / Historique.
- Suppression du `MutationObserver` global et du ripple DOM au clic, responsables de scans complets du document à chaque interaction.
- Chargement/indexation de la base locale de cartes différé après le premier rendu pour améliorer le LCP.
- Ajout de garde-fous CSS : `content-visibility`, neutralisation des animations coûteuses sur les longues listes, limitation des shifts sur les panneaux cachés.

## Résultat attendu

- Meilleur INP sur les clics de navigation.
- Moins de CLS causé par les rendus et animations tardives.
- Navigation mobile plus stable, surtout après import de gros replays ou historiques volumineux.
