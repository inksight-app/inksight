# Connecteur officiel duels.ink · adaptateur serveur

Contrat vérifié le 19 octobre 2026 : [developers](https://duels.ink/developers), [API OAuth](https://duels.ink/api-docs#oauth), [référence Markdown](https://duels.ink/api-docs.md).

**Ce dossier n’est pas un serveur déployé.** Il contient le protocole OAuth et le client de lecture testés, indépendants d’un hébergeur. L’application mobile reste utilisable par import local. Aucun secret, compte développeur, autorisation de compte ou base distante n’a été créé.

## Contrat confirmé

- OAuth authorization code avec PKCE S256 ; échange de code depuis un **backend confidentiel**. Application mobile sans serveur non prise en charge.
- Callback HTTPS exact enregistré chez duels.ink ; le callback direct en `inksight://` ne convient pas.
- Scopes nécessaires : `profile`, `match_history:read`, `replays:read`. Aucun droit d’écriture de jeu.
- Historique paginé, 250 lignes maximum par appel, curseur opaque. 20 appels/minute/utilisateur, 3 simultanés maximum. Traiter chaque page et conserver le curseur ; un job de synchronisation doit espacer les appels et reprendre sur `Retry-After`.
- Manifeste de téléchargement par lots de 1 000 IDs maximum. Les liens `/r/{id}` sont partageables ; ne pas les publier dans les journaux d’erreur.
- Pas de refresh token : l’expiration, la révocation ou une nouvelle autorisation exigent de reconnecter le compte. Une erreur 401 casse le lien, sans boucle de retry.
- L’API ne retourne pas la liste complète de l’adversaire. Les jeux restent analysés du point de vue du joueur.
- Les évaluations `?format=eval` observées sur un replay public ne sont pas couvertes par ce contrat. Ne pas présenter le scope replays comme un droit garanti à toutes les évaluations.

## Intégration restant à réaliser pour une connexion dans l’app

1. Choisir un backend et y authentifier la session Inksight. Réutiliser Supabase Auth est possible, mais l’ancien projet est inactif ; il n’a pas été réactivé.
2. Fournir les adaptateurs durables `pending` et `vault` décrits ci-dessous. Ajouter les routes HTTP et protéger chacune avec la session serveur, sans accepter un simple identifiant envoyé par le client.
3. Enregistrer Inksight dans `/developers`, avec le vrai domaine et son callback HTTPS ; conserver `DUELS_CLIENT_ID`, `DUELS_CLIENT_SECRET`, `DUELS_REDIRECT_URI` et une clé aléatoire `DUELS_TOKEN_KEY` de 32 octets dans les variables **serveur**.
4. Ouvrir l’autorisation dans une session d’authentification système depuis l’iPhone. Au retour HTTPS, échanger le code immédiatement (validité 60 secondes), puis proposer un transfert **à usage unique**, limité dans le temps et lié au challenge de l’app, vers une session Inksight. Aucun secret ni jeton duels.ink dans le deep link.
5. Le mobile appelle le backend Inksight pour synchroniser. Le backend conserve le jeton Duels chiffré, récupère les pages avec reprise et télécharge les replays avec la limite de concurrence. Ne jamais transmettre le Bearer Duels au mobile ou à un navigateur.
6. Prévoir déconnexion/suppression des données, renouvellement par consentement et test réel sur le compte du propriétaire avant TestFlight.

L’UI n’a volontairement pas de faux bouton « compte connecté ». Ces opérations doivent être implémentées et validées avant de l’activer.

## Adaptateurs requis

`pending.put(hashState, { ownerId, sessionId, verifier, expiresAt })` : écriture durable, état nouveau pour chaque tentative.

`pending.consume(hashState, authenticatedSessionId, now)` : transaction atomique vérifiant la session et l’expiration, supprimant puis retournant la ligne **une seule fois**. Une session différente ne doit pas consommer la tentative. Les tentatives expirées peuvent être supprimées par une purge périodique. Une Map en mémoire ne convient pas à un déploiement avec plusieurs instances.

`vault.put(ownerId, { duelsUserId, displayName, sealedToken, expiresAt, scope })` : remplacement atomique du lien du propriétaire authentifié. La clé d’identité Duels est `duelsUserId`, jamais le nom modifiable. La valeur est chiffrée en AES-256-GCM et liée au propriétaire par données authentifiées. Le stockage et sa clé ont des cycles de sauvegarde/rotation distincts.

Le lecteur fournit `profile()`, `history()` (générateur asynchrone de pages) et `replays(ids)`. Il remonte les erreurs de débit avec le délai et ne dort pas implicitement dans une fonction HTTP. Le job doit sauvegarder les pages déjà traitées et programmer la reprise.

## Test

```bash
node --test apps/integrations/duels/duels.test.mjs
```

Tests avec serveur simulé : challenge S256, liaison de session, état à usage unique, consentement refusé/expiré, chiffrement lié au propriétaire, pagination, 401 et 429. **Ce ne sont pas des tests d’un vrai consentement OAuth** : les identifiants d’application et l’infrastructure doivent encore être configurés.
