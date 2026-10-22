-- 006_round_restart.sql
-- FOR REBUILDING ONLY. Do NOT run this on the live project: the column and the function
-- below already exist there (they were created and verified by hand on 22 Oct 2026).
--
-- Note: interview_rounds.restarts_used is NOT in 005_interviews.sql. It is added here.
--
-- Rule: if a round's timer ran out and the student sent ZERO answers (no message with
-- role 'user'), the round gets ONE free restart. It goes back to 'pending' and the student
-- starts it again with a new timer. The monthly interview count is unchanged.
-- Only the server (service_role) can call this function.

alter table public.interview_rounds
  add column if not exists restarts_used integer not null default 0;

create or replace function public.restart_round_if_empty(p_user uuid, p_round_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_round record;
begin
  select r.*
    into v_round
    from public.interview_rounds r
   where r.id = p_round_id
     and r.user_id = p_user
     and r.status = 'active'
   for update;

  if not found then
    return false;
  end if;

  if v_round.deadline is null or v_round.deadline >= now() then
    return false;
  end if;

  if v_round.restarts_used >= 1 then
    return false;
  end if;

  if not exists (
    select 1
      from public.interviews i
     where i.id = v_round.interview_id
       and i.status = 'active'
       and (i.expires_at is null or i.expires_at > now())
  ) then
    return false;
  end if;

  if exists (
    select 1
      from public.interview_messages m
     where m.round_id = p_round_id
       and m.role = 'user'
  ) then
    return false;
  end if;

  delete from public.interview_messages where round_id = p_round_id;

  update public.interview_rounds
     set status = 'pending',
         questions = null,
         state = '{}'::jsonb,
         started_at = null,
         deadline = null,
         restarts_used = restarts_used + 1
   where id = p_round_id;

  return true;
end;
$$;

revoke all on function public.restart_round_if_empty(uuid, uuid) from public, anon, authenticated;
grant execute on function public.restart_round_if_empty(uuid, uuid) to service_role;