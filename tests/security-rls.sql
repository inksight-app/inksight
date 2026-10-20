-- Run after the hardening statements in the SAME transaction; always ROLLBACK.
insert into auth.users(id,email) values
('00000000-0000-4000-8000-000000000101','inksight-audit-owner@example.invalid'),
('00000000-0000-4000-8000-000000000102','inksight-audit-member@example.invalid');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000101","role":"authenticated"}',true);
select set_config('audit.team_id',id::text,true),set_config('audit.invite_code',invite_code,true) from public.create_team('Temporary security audit','Audit owner');
insert into public.saved_matches(id,user_id,title,team_visible) values
('00000000-0000-4000-8000-000000000201',auth.uid(),'private audit',false),
('00000000-0000-4000-8000-000000000202',auth.uid(),'shared audit',true);
insert into public.saved_card_stats(user_id,match_id,owner,card_key,card_name) values
(auth.uid(),'00000000-0000-4000-8000-000000000201','mine','audit-private','Audit'),
(auth.uid(),'00000000-0000-4000-8000-000000000202','mine','audit-shared','Audit');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000102","role":"authenticated"}',true);
do $$ begin
  begin
    insert into public.team_members(team_id,user_id,role) values(current_setting('audit.team_id')::uuid,auth.uid(),'owner');
    raise exception 'FAILED: direct enrolment was permitted';
  exception when insufficient_privilege then null; end;
  if exists(select 1 from public.user_team_ids('00000000-0000-4000-8000-000000000101')) then raise exception 'FAILED: foreign team ids disclosed'; end if;
end $$;
select * from public.join_team_by_code(current_setting('audit.invite_code'));
do $$ begin
  if exists(select 1 from public.saved_matches where id='00000000-0000-4000-8000-000000000201') then raise exception 'FAILED: private match disclosed'; end if;
  if not exists(select 1 from public.saved_matches where id='00000000-0000-4000-8000-000000000202') then raise exception 'FAILED: shared match unavailable'; end if;
  if exists(select 1 from public.saved_card_stats where match_id='00000000-0000-4000-8000-000000000201') then raise exception 'FAILED: private child disclosed'; end if;
  if not exists(select 1 from public.saved_card_stats where match_id='00000000-0000-4000-8000-000000000202') then raise exception 'FAILED: shared child unavailable'; end if;
  begin
    update public.team_members set role='owner' where user_id=auth.uid();
    raise exception 'FAILED: role escalation permitted';
  exception when insufficient_privilege then null; end;
  begin
    update public.team_members set team_id=gen_random_uuid() where user_id=auth.uid();
    raise exception 'FAILED: membership reassignment permitted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.saved_card_stats(user_id,match_id,owner,card_key,card_name) values(auth.uid(),'00000000-0000-4000-8000-000000000202','mine','audit-injection','Audit');
    raise exception 'FAILED: cross-owner child insertion permitted';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000101","role":"authenticated"}',true);
do $$ begin
  if (select count(*) from public.saved_matches where id in ('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000202'))<>2 then raise exception 'FAILED: owner access lost'; end if;
end $$;
update public.team_members set left_at=now() where user_id='00000000-0000-4000-8000-000000000102';
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000102","role":"authenticated"}',true);
do $$ begin
  if exists(select 1 from public.saved_matches where id='00000000-0000-4000-8000-000000000202') then raise exception 'FAILED: ex-member still reads shared match'; end if;
  update public.team_members set left_at=null where user_id=auth.uid();
  if exists(select 1 from public.team_members where user_id=auth.uid() and left_at is null) then raise exception 'FAILED: ex-member self-reactivated'; end if;
end $$;
set local role anon;
do $$ begin
  if exists(select 1 from public.saved_matches where id in ('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000202')) then raise exception 'FAILED: anonymous match access'; end if;
exception when insufficient_privilege then null;
end $$;
reset role;
select 'PASS: owner access, invitation, private/shared parent and child, no enrolment, no role escalation, no reassignment, no cross-owner insertion, no foreign membership lookup, revocation and anonymous isolation' as security_checks;
rollback;
