-- One analyzed Duels game per owner, including concurrent saves in separate tabs.
-- Verified before application: no duplicate (user_id, duelink_match_id) groups.
create unique index saved_matches_user_duelink_game_unique
  on public.saved_matches(user_id,duelink_match_id)
  where duelink_match_id is not null;
