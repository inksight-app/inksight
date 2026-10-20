-- Additive metadata for official scoped tokens and expiring personal tokens.
alter table public.duelink_connections
  add column if not exists duels_user_id text,
  add column if not exists auth_method text not null default 'personal_token',
  add column if not exists scopes text[];
comment on column public.duelink_connections.duels_user_id is 'Stable Duels.ink id returned by /api/me; never a mutable display name.';
