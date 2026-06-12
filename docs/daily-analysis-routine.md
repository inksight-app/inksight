# Routine d'analyse quotidienne — InkSight

Prompt de référence pour la session planifiée (Claude Code on the web) qui
produit le rapport quotidien de santé du projet. Versionné ici pour suivi git :
le trigger planifié doit pointer sur ce fichier. Toute évolution de la routine
passe par une PR sur ce document.

## Contexte projet (rappels)

- **Projet Supabase** : `htmsgnnqnmaqxuzlcsld`
- **Projet Vercel** : team `inksight`, prod `inksight-omega.vercel.app`
- **Repo** : `inksight-app/inksight`
- **Auth** : OAuth Discord uniquement (pas de mots de passe → les advisories
  type « leaked password » sont sans objet).

## Objectif

Un rapport court et actionnable couvrant : santé des logs, activité produit,
santé infra (Supabase + Vercel), activité GitHub, et **au plus 3 actions
recommandées**. Verdict global en tête (OK / À surveiller / Critique).

---

## 1. Logs — priorité aux ERROR récurrentes (À FAIRE EN PREMIER)

Avant les stats d'activité, récupère les logs Postgres ET API des dernières 24h
(`get_logs service=postgres`, puis `service=api`).

1. Ne garde que les entrées de sévérité `ERROR` (ignore `LOG`/checkpoint/connection).
2. Regroupe-les par message **normalisé** (retire les UUID, ids, valeurs
   littérales) et **compte** les occurrences de chaque groupe.
3. Classe en **CRITIQUE** tout groupe qui se répète (≥ 5 occurrences sur 24h)
   OU qui matche un de ces motifs, même une seule fois s'il touche une écriture
   produit :
   - `permission denied for table <X>` → GRANT/RLS manquant sur `<X>`
   - `... does not exist` (column / relation / function)
   - `violates ... constraint` / `deadlock detected` / `out of memory`
4. Pour chaque groupe critique : indique la **table/relation** concernée, le
   nombre d'occurrences, la 1re/dernière apparition, et l'hypothèse de cause
   racine. Une erreur isolée non récurrente → section « à surveiller », pas
   critique.

> ⚠️ **Piège déjà rencontré (incident du 2026-06-12).** Un flood de
> `permission denied for table X` peut être masqué côté app par un fallback
> silencieux (try/catch qui retombe sur un autre chemin d'écriture). Le symptôme
> visible est alors **une table qui reste à 0 ligne** alors que le code est
> censé y écrire. Si une table est à 0 ligne ET référencée en écriture dans le
> code, **croise systématiquement avec les ERROR Postgres** : ne jamais conclure
> « migration en attente » sans avoir vérifié les `permission denied`.
> Cause de l'incident : `saved_match_analysis` avait RLS + policies correctes
> mais aucun GRANT CRUD pour le rôle `authenticated`. Échantillonner les logs au
> lieu de les agréger/compter avait fait passer le flood pour du bruit.

---

## 2. Activité produit (dernières 24h vs jour précédent)

Comparer la fenêtre 24h à la fenêtre J-1/J-2. Métriques :

- Nouveaux utilisateurs Supabase, connexions/logins.
- Nouveaux `deck_profiles`, `saved_matches`, `saved_games`.
- `duelink_sync_runs` lancés (et combien en erreur).
- Tokens `duelink_connections` créés/maj.

Signaler les évolutions inhabituelles (pic d'import, chute d'activité) sans les
sur-interpréter : une journée sans usage n'est pas un incident.

## 3. Advisories Supabase

`get_advisors type=security` et `type=performance`. Inclure l'URL de remédiation.

Notes connues (ne pas re-signaler comme nouveau chaque jour) :
- 3 fonctions `SECURITY DEFINER` (`join_team_by_code`, `peek_team_by_code`,
  `user_team_ids`) exécutables par `authenticated` : **intentionnel**
  (`user_team_ids` est appelée dans les policies RLS d'équipe).
- Leaked password protection désactivée : **sans objet** (OAuth Discord only).
- Index « inutilisés » de dédup d'import (`*_fingerprint_idx`, `*_replay_sha_idx`,
  `*_duelink_*_idx`, `*_series_match_id_idx`) : **ne pas recommander de droper**
  (servent à la dédup à l'import, rare → d'où le « jamais utilisé »).

## 4. Tailles des tables

Lister les compteurs des tables principales (`saved_matches`, `saved_games`,
`saved_card_stats`, `saved_turn_stats`, `deck_profiles`, `duelink_sync_runs`,
`duelink_connections`, `user_profiles`, `saved_match_analysis`). Signaler toute
croissance anormale. `saved_match_analysis` doit désormais croître en parallèle
de `saved_matches` (sinon, re-suspecter un `permission denied`).

## 5. Santé Vercel

- Dernier déploiement production : id, commit, statut (READY/ERROR), heure.
- Erreurs runtime en prod sur 24h (`get_runtime_logs`).

## 6. Activité GitHub (24h)

- PR mergées / commits sur `main`, fichiers touchés, résumé d'impact.
- Pointer le changement récent le plus « risqué » (parser/UI) à surveiller en
  cas de régression.

---

## Format de sortie

1. **Verdict global** (OK / À surveiller / Critique) + une phrase.
2. **Problèmes détectés** — les CRITIQUES en premier (cf. §1), avec cause racine.
3. Activité produit (tableau 24h vs J-1).
4. Advisories nouvelles uniquement.
5. Tailles des tables.
6. Santé Vercel + GitHub.
7. **Actions recommandées (max 3)**, puis « Ce qui peut attendre ».

Ne pas modifier de fichiers ni créer de branches/PR : la routine est en
lecture/diagnostic seule, sauf demande explicite.
