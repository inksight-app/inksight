-- Additive setup. Applied through Supabase's migration connector (no CLI installation).
-- Native results are private; saved_matches remains the replay-analysis store.
alter table public.duelink_connections add column if not exists results_sync_version smallint not null default 0;

create table public.duelink_game_results (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null check (game_id ~ '^[A-Za-z0-9_-]{1,128}$'),
  native jsonb not null check (jsonb_typeof(native)='object' and octet_length(native::text)<=100000),
  source_updated_at timestamptz not null,
  started_at timestamptz not null check (started_at >= '2026-10-08T22:37:09.766Z'),
  created_at timestamptz not null default now(),
  ingested_at timestamptz not null default now(),
  hidden_at timestamptz,
  primary key (user_id,game_id)
);
create index duelink_game_results_user_started_idx on public.duelink_game_results(user_id,started_at desc);
alter table public.duelink_game_results enable row level security;
revoke all on public.duelink_game_results from public,anon;
grant select,insert,update on public.duelink_game_results to authenticated;
create policy results_owner_select on public.duelink_game_results for select to authenticated using ((select auth.uid())=user_id);
create policy results_owner_insert on public.duelink_game_results for insert to authenticated with check ((select auth.uid())=user_id);
create policy results_owner_update on public.duelink_game_results for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create function public.ingest_duelink_results(p_rows jsonb,p_checkpoint timestamptz default null,p_connection_iv text default null)
returns integer language plpgsql security invoker set search_path='' as $$
declare
  owner_id uuid := auth.uid();
  item jsonb;
  affected integer := 0;
  changed integer;
begin
  if owner_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows)>250 then
    raise exception 'Invalid result page' using errcode='22023';
  end if;
  if p_checkpoint is not null and (p_checkpoint>now()+interval '1 minute' or p_checkpoint<'2026-10-08T22:37:09.766Z') then
    raise exception 'Invalid checkpoint' using errcode='22023';
  end if;
  for item in select value from jsonb_array_elements(p_rows) loop
    if jsonb_typeof(item->'native') is distinct from 'object'
      or item->>'game_id' is distinct from item->'native'->>'game_id'
      or coalesce(item->'native'->>'queue_id','') not in ('core-bo1','core-bo3')
      or item->'native'->>'mode' is distinct from 'matchmaking'
      or item->'native'->>'ranked' is distinct from 'true'
      or (item->'native'->>'started_at')::timestamptz is distinct from (item->>'started_at')::timestamptz
      or (item->>'source_updated_at')::timestamptz>now()+interval '1 minute' then
      raise exception 'Invalid native result' using errcode='22023';
    end if;
    insert into public.duelink_game_results(user_id,game_id,native,source_updated_at,started_at)
      values(owner_id,item->>'game_id',item->'native',(item->>'source_updated_at')::timestamptz,(item->>'started_at')::timestamptz)
    on conflict(user_id,game_id) do update set
      native=excluded.native,source_updated_at=excluded.source_updated_at,started_at=excluded.started_at,ingested_at=now()
      where excluded.source_updated_at>=duelink_game_results.source_updated_at;
    get diagnostics changed=row_count;
    affected:=affected+changed;
  end loop;
  -- Atomic with the LAST saved page only; token replacement invalidates old scans.
  if p_checkpoint is not null and p_connection_iv is not null then
    update public.duelink_connections set last_sync_at=p_checkpoint,results_sync_version=1
      where user_id=owner_id and provider='duelink' and encrypted_token->>'iv'=p_connection_iv
      and (last_sync_at is null or last_sync_at<p_checkpoint);
  end if;
  return affected;
end;
$$;
revoke all on function public.ingest_duelink_results(jsonb,timestamptz,text) from public,anon;
grant execute on function public.ingest_duelink_results(jsonb,timestamptz,text) to authenticated;

create function public.hide_duelink_result(p_game_id text,p_match_id uuid default null)
returns void language plpgsql security invoker set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_match_id is not null then
    -- Never allow a metadata/game mismatch to delete an unrelated analysis.
    delete from public.saved_matches where id=p_match_id and user_id=(select auth.uid()) and duelink_match_id=p_game_id;
    if not found then raise exception 'Analysis not found' using errcode='22023'; end if;
  end if;
  -- A deletion before the first sync must not reappear on that first sync either.
  -- Hidden-only rows contain no game payload and are never selected by the UI.
  insert into public.duelink_game_results(user_id,game_id,native,source_updated_at,started_at,hidden_at)
    values((select auth.uid()),p_game_id,'{}'::jsonb,now(),'2026-10-08T22:37:09.766Z',now())
    on conflict(user_id,game_id) do update set hidden_at=excluded.hidden_at;
end;
$$;
revoke all on function public.hide_duelink_result(text,uuid) from public,anon;
grant execute on function public.hide_duelink_result(text,uuid) to authenticated;
