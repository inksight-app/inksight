# V135.5B — Auth stability & Duel.ink token hotfix

- Corrige `ReferenceError: state is not defined` causé par l'UI auth hors scope.
- Retire l'email/password de l'interface : Discord uniquement pour l'instant.
- Masque Duel.ink, decks, maintenance, stats et historique tant que l'utilisateur n'est pas connecté.
- Corrige `/api/duelink-history` : `tokenSource` défini et support du token mémorisé chiffré.
- Ajoute une migration SQL optionnelle pour révoquer l'accès public à `public.rls_auto_enable()`.
