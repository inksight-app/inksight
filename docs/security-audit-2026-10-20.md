# Inksight — audit de sécurité et reprise, 20 octobre 2026

## Périmètre et état

Projet original `inksight-app/inksight`, interface Vite, fonctions Vercel et projet Supabase existant. Le prototype mobile de la PR 66 n’est pas repris ni fusionné.

Il s’agit d’une revue de code, d’une revue effective des politiques SQL, de tests d’isolation en base et de tests de régression. Ce n’est pas une certification « aucune faille » ni un pentest exhaustif de l’infrastructure des fournisseurs.

Supabase était suspendu et son Auth indisponible. Après restauration autorisée, le projet est ACTIVE_HEALTHY et l’endpoint d’autorisation redirige de nouveau vers Discord (HTTP 302). Le consentement Discord puis le retour sur le compte réel restent à vérifier. L’alerte « Cette page n’est pas privée » ne doit jamais être contournée ; son origine TLS exacte sur l’appareil de l’utilisateur n’a pas été certifiée.

## Constats et correctifs

| Niveau | Constat confirmé | Correction et preuve |
|---|---|---|
| Élevé | Un utilisateur authentifié pouvait s’inscrire directement dans une équipe connue, avec un rôle choisi. | Inscription directe interdite ; création atomique via RPC et adhésion par invitation. Test SQL négatif. |
| Élevé | Mise à jour de sa propre adhésion permettant de changer identité/équipe/rôle. | Identité et rôle verrouillés ; exclusion irréversible par auto-mise à jour. Tests d’élévation et de réactivation refusés. |
| Élevé | Partages entre coéquipiers ne respectant pas systématiquement `team_visible`. | Lecture du parent conditionnée au partage explicite ; mêmes droits pour analyses et statistiques enfants. Tests privé/partagé/ex-membre. |
| Élevé | Insertion d’une statistique enfant sans vérifier le propriétaire du match parent. | Vérification propriétaire + parent autorisé à l’insertion et à la modification. Test intercomptes refusé. |
| Élevé | Chemins JSON de replay susceptibles de modifier un prototype JavaScript. | Moteur JSON Pointer borné, propriétés dangereuses interdites, index et parents vérifiés. Tests négatifs et replay public réel. |
| Moyen | Décompression gzip/ZIP sans budget global strict. | 48 Mio, nombre d’entrées, profondeur et nombre de nœuds bornés ; lecture ZIP en flux. Tests d’expansion et chemins malveillants. |
| Moyen | Anciennes requêtes/caches pouvant repeupler l’interface après changement de compte. | Génération de session, rejet des réponses périmées, purge de l’ancien propriétaire et garde de sauvegarde. Tests A → B → déconnexion → A. |
| Moyen | API réutilisable sans session Inksight pour un jeton collé ; erreurs internes et redirections trop permissives. | Session vérifiée côté serveur, origines explicites, corps/temps/tailles bornés, erreurs génériques, hôtes de téléchargement limités, Bearer retiré au changement d’origine. |
| Moyen | Proxy image pouvant servir du contenu actif. | Images raster seulement ; SVG/HTML refusés ; nosniff et CSP. Test de contenu actif refusé. |
| Durcissement | Scripts CDN exécutables non verrouillés, en-têtes manquants, dépendances vulnérables. | Bibliothèques empaquetées et versions figées ; CSP, anti-iframe, referrer, permissions ; npm audit : 0 vulnérabilité signalée, y compris développement. |

Les jetons duels.ink restent chiffrés AES-256-GCM. La nouvelle version lie le chiffré au propriétaire ; les anciens chiffrés restent lisibles. Ne pas remplacer la clé de chiffrement existante sans procédure de migration.

Les fonctions SECURITY DEFINER nécessaires aux invitations sont confinées dans un schéma privé avec identité contrôlée, droits d’exécution restreints et search_path vide. Les wrappers exposés sont SECURITY INVOKER.

## Vérification reproductible

`npm ci --ignore-scripts`, `npm test`, `npm run build`, `npm audit`, `git diff --check`.

22 tests Node passent au moment de la livraison. Un replay public de 119 étapes a été lu par le parseur original durci, avec 5 séquences annulées exclues. Les tests synthétiques couvrent les inkdrops et leurs coûts alternatifs ; ce replay historique ne contient pas d’inkdrops.

`tests/security-rls.sql` s’exécute après le durcissement dans une transaction finissant toujours par ROLLBACK. Deux identités synthétiques uniquement : propriétaire, membre, puis ex-membre. Aucun match réel n’est lu ni supprimé. Résultat obtenu : PASS sur accès propriétaire, invitation, parent/enfant privé/partagé, interdiction d’inscription directe, d’élévation de rôle, de réaffectation, d’insertion interpropriétaires, de lecture d’adhésions étrangères, révocation et isolation anonyme.

SQL livré dans `docs/sql/`. Les deux modifications sont également enregistrées dans l’historique des migrations Supabase. Ne pas rejouer ces scripts automatiquement sans relire le schéma courant.

## Limites et actions encore nécessaires

- Navigateur cloud : accès au site refusé par une autorisation enregistrée. Vérification visuelle, Safari/iPhone, consentement Discord et retour authentifié non effectués.
- Vercel : consultation des variables refusée (403). Valeurs, portée des secrets, configuration Discord et rotation des secrets non certifiées. Aucun secret extrait ou recréé.
- OAuth duels.ink : inscription de l’application et identifiants serveur nécessaires. Non activé dans cette version ; connexion par jeton conservée. Aucun formulaire factice de connexion officielle.
- Avis Supabase restant : protection contre les mots de passe divulgués désactivée. Fonction réservée à Pro et plus ; organisation actuellement Free. Aucun abonnement payant engagé. Source : https://supabase.com/docs/guides/auth/password-security
- Limitation de débit locale par instance seulement, pas un quota distribué global. Les quotas du fournisseur et Retry-After restent autoritaires ; un WAF/quota distribué sera nécessaire si usage public important.
- Sessions Supabase conservées dans le stockage du navigateur ; la CSP réduit le risque XSS sans le supprimer. Styles inline conservés pour compatibilité ; scripts inline interdits.
- Pas de preuve collectée d’exploitation passée, mais absence de preuve ≠ absence d’incident. Une revue historique des journaux et des accès administrateurs reste distincte.
- Gros bundle historique conservé : avertissement de taille au build, pas erreur. Pas de refonte ni de moteur complet des règles dans ce correctif.

## Retour arrière

Ne pas annuler les politiques de confidentialité pour rétablir l’ancien comportement. Un retour de frontend à une version antérieure peut casser la création d’équipe (l’ancienne insertion directe est maintenant volontairement interdite). Garder le nouveau RPC ou adapter le frontend. Les données et les anciennes analyses n’ont pas été effacées.
