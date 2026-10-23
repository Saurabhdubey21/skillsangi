-- 006_round_restart.sql
-- FOR REBUILDING ONLY. Do NOT run this on the live project: the column and the function
-- below already exist there (they were created and verified by hand on 22 Oct 2026).
--
-- Note: interview_rounds.restarts_used is NOT in 005_interviews.sql. It is added here.
-- The function text below is copied from the live database (pg_get_functiondef).
--
-- Rule: if a round's timer ran out and the student sent ZERO answers (no message with
-- role 'user'), the round gets ONE free restart. It goes back to 'pending' and the student
-- starts it again with a new timer. The monthly interview count is unchanged.
-- Only the server (service_role) can call this function.

alter table public.interview_rounds
  add column if not exists restarts_used integer not null default 0;

CREATE OR REPLACE FUNCTION public.restart_round_if_empty(p_user uuid, p_round_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r interview_rounds%rowtype;
begin
  if p_user is null then raise exception 'missing user'; end if;

  select * into r from interview_rounds
    where id = p_round_id and user_id = p_user and status = 'active' for update;
  if not found then return false; end if;

  if r.deadline is null or r.deadline >= now() then return false; end if;
  if r.restarts_used >= 1 then return false; end if;

  if not exists (
    select 1 from interviews
    where id = r.interview_id and status = 'active' and expires_at > now()
  ) then return false; end if;

  if exists (
    select 1 from interview_messages where round_id = r.id and role = 'user'
  ) then return false; end if;

  delete from interview_messages where round_id = r.id;

  update interview_rounds
    set status = 'pending',
        questions = null,
        state = '{}'::jsonb,
        started_at = null,
        deadline = null,
        restarts_used = r.restarts_used + 1
    where id = r.id;

  return true;
end $function$;

revoke all on function public.restart_round_if_empty(uuid, uuid) from public, anon, authenticated;
grant execute on function public.restart_round_if_empty(uuid, uuid) to service_role;