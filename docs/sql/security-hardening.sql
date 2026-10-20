-- Reviewed production hardening. No user rows are deleted or rewritten.
begin;
create schema if not exists inksight_private;
revoke all on schema inksight_private from public, anon;
grant usage on schema inksight_private to authenticated;

create or replace function inksight_private.is_team_owner(p_team uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.team_members m where m.team_id=p_team and m.user_id=auth.uid() and m.role='owner' and m.left_at is null
  );
$$;
revoke all on function inksight_private.is_team_owner(uuid) from public, anon;
grant execute on function inksight_private.is_team_owner(uuid) to authenticated;

create or replace function inksight_private.user_team_ids(p_user_id uuid)
returns setof uuid language sql stable security definer set search_path = '' as $$
  select m.team_id from public.team_members m
  where p_user_id=auth.uid() and m.user_id=auth.uid() and m.left_at is null;
$$;
revoke all on function inksight_private.user_team_ids(uuid) from public,anon;
grant execute on function inksight_private.user_team_ids(uuid) to authenticated;
create or replace function public.user_team_ids(p_user_id uuid)
returns setof uuid language sql stable security invoker set search_path = '' as $$
  select * from inksight_private.user_team_ids(p_user_id);
$$;
revoke all on function public.user_team_ids(uuid) from public, anon;
grant execute on function public.user_team_ids(uuid) to authenticated;

-- Team and owner are created in one authenticated transaction. Direct enrolment is forbidden.
create or replace function inksight_private.create_team(p_name text,p_display_name text)
returns table(id uuid,name text,invite_code text) language plpgsql security definer set search_path = '' as $$
declare v_team public.teams%rowtype;
begin
  if auth.uid() is null then raise exception 'Authenticated team creator required' using errcode='42501'; end if;
  if length(btrim(p_name)) not between 1 and 80 or length(p_display_name)>120 then raise exception 'Invalid team name'; end if;
  if exists(select 1 from public.team_members m where m.user_id=auth.uid() and m.left_at is null) then raise exception 'ALREADY_MEMBER'; end if;
  insert into public.teams(name) values(btrim(p_name)) returning * into v_team;
  insert into public.team_members(team_id,user_id,display_name,role)
  values (v_team.id,auth.uid(),coalesce(nullif(btrim(p_display_name),''),'Joueur'),'owner');
  return query select v_team.id,v_team.name,v_team.invite_code;
end;
$$;
revoke all on function inksight_private.create_team(text,text) from public,anon;
grant execute on function inksight_private.create_team(text,text) to authenticated;
create or replace function public.create_team(p_name text,p_display_name text default 'Joueur')
returns table(id uuid,name text,invite_code text) language sql security invoker set search_path = '' as $$
  select * from inksight_private.create_team(p_name,p_display_name);
$$;
revoke all on function public.create_team(text,text) from public,anon;
grant execute on function public.create_team(text,text) to authenticated;
drop policy if exists teams_insert_auth on public.teams;
drop policy if exists team_members_insert_self on public.team_members;
alter table public.teams alter column invite_code set default upper(replace(gen_random_uuid()::text,'-',''));

create or replace function inksight_private.lock_membership_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated','anon') and (
    new.id is distinct from old.id or new.team_id is distinct from old.team_id or
    new.user_id is distinct from old.user_id or new.role is distinct from old.role
  ) then raise exception 'Membership identity and role cannot be reassigned' using errcode='42501'; end if;
  return new;
end;
$$;
revoke all on function inksight_private.lock_membership_identity() from public,anon,authenticated;
drop trigger if exists inksight_lock_membership_identity on public.team_members;
create trigger inksight_lock_membership_identity before update on public.team_members for each row execute function inksight_private.lock_membership_identity();
drop policy if exists team_members_update_self_or_owner on public.team_members;
create policy team_members_update_self_or_owner on public.team_members for update to authenticated
using ((user_id=(select auth.uid()) and left_at is null) or inksight_private.is_team_owner(team_id))
with check (user_id=(select auth.uid()) or inksight_private.is_team_owner(team_id));

-- A teammate may read only explicitly shared matches and their matching child rows.
drop policy if exists saved_matches_select_own_or_teammates on public.saved_matches;
create policy saved_matches_select_own_or_teammates on public.saved_matches for select to authenticated
using (user_id=(select auth.uid()) or (team_visible and exists (
  select 1 from public.team_members m where m.user_id=saved_matches.user_id and m.left_at is null
  and m.team_id in (select public.user_team_ids((select auth.uid())))
)));

do $$
declare t text; p record;
begin
  foreach t in array array['saved_games','saved_card_stats','saved_turn_stats','saved_match_analysis'] loop
    for p in select policyname from pg_policies where schemaname='public' and tablename=t and cmd in ('SELECT','INSERT','UPDATE') loop
      execute format('drop policy %I on public.%I',p.policyname,t);
    end loop;
    execute format('create policy child_read_authorized_parent on public.%1$I for select to authenticated using (exists (select 1 from public.saved_matches m where m.id=%1$I.match_id and m.user_id=%1$I.user_id))',t);
    execute format('create policy child_insert_own_parent on public.%1$I for insert to authenticated with check (user_id=(select auth.uid()) and exists (select 1 from public.saved_matches m where m.id=%1$I.match_id and m.user_id=(select auth.uid())))',t);
    if t='saved_match_analysis' then
      execute format('create policy child_update_own_parent on public.%1$I for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()) and exists (select 1 from public.saved_matches m where m.id=%1$I.match_id and m.user_id=(select auth.uid())))',t);
    end if;
  end loop;
end;
$$;

drop policy if exists deck_profiles_select_own_or_teammates on public.deck_profiles;
create policy deck_profiles_select_own_or_teammates on public.deck_profiles for select to authenticated
using (user_id=(select auth.uid()) or exists (select 1 from public.saved_matches m where m.deck_profile_id=deck_profiles.id and m.user_id=deck_profiles.user_id and m.team_visible));

-- SECURITY DEFINER remains necessary for invite lookup; constrain its identity and search path.
create or replace function inksight_private.join_team_by_code(p_code text)
returns table(team_id uuid,team_name text) language plpgsql security definer set search_path = '' as $$
declare v_team public.teams%rowtype; v_uid uuid:=auth.uid(); v_name text;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if length(p_code)>128 then raise exception 'INVALID_CODE'; end if;
  select * into v_team from public.teams t where t.invite_code=upper(btrim(p_code)) limit 1;
  if not found then raise exception 'INVALID_CODE'; end if;
  if exists(select 1 from public.team_members m where m.user_id=v_uid and m.left_at is null) then raise exception 'ALREADY_MEMBER'; end if;
  select coalesce(nullif(btrim(p.display_name),''),'Joueur') into v_name from public.user_profiles p where p.user_id=v_uid limit 1;
  insert into public.team_members(team_id,user_id,display_name,role) values(v_team.id,v_uid,coalesce(v_name,'Joueur'),'member');
  return query select v_team.id,v_team.name;
end;
$$;
create or replace function inksight_private.peek_team_by_code(p_code text)
returns table(team_id uuid,team_name text,member_count integer) language sql security definer set search_path = '' as $$
  select t.id,t.name,(select count(*)::integer from public.team_members m where m.team_id=t.id and m.left_at is null)
  from public.teams t where auth.uid() is not null and length(p_code)<=128 and t.invite_code=upper(btrim(p_code)) limit 1;
$$;
revoke all on function inksight_private.join_team_by_code(text),inksight_private.peek_team_by_code(text) from public,anon;
grant execute on function inksight_private.join_team_by_code(text),inksight_private.peek_team_by_code(text) to authenticated;
create or replace function public.join_team_by_code(p_code text)
returns table(team_id uuid,team_name text) language sql security invoker set search_path = '' as $$
  select * from inksight_private.join_team_by_code(p_code);
$$;
create or replace function public.peek_team_by_code(p_code text)
returns table(team_id uuid,team_name text,member_count integer) language sql security invoker set search_path = '' as $$
  select * from inksight_private.peek_team_by_code(p_code);
$$;
revoke all on function public.join_team_by_code(text),public.peek_team_by_code(text) from public,anon;
grant execute on function public.join_team_by_code(text),public.peek_team_by_code(text) to authenticated;
commit;
