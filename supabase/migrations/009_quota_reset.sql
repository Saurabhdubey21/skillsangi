-- 009_quota_reset.sql
-- Makes the admin "Reset interview quota" button work.
-- start_interview now counts only interviews started after the LATER of:
--   (a) the start of this month in India time, and
--   (b) the time an admin last reset this user's quota
--       (public.user_admin_state.interview_quota_reset_at).
-- Everything else in the function is unchanged from 005_interviews.sql.
--
-- Rollback: run the start_interview definition from 005_interviews.sql again.

create or replace function public.start_interview(p_domain text, p_band text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_used int;
  v_id uuid;
  v_cutoff timestamptz;
begin
  if v_user is null then raise exception 'not logged in'; end if;
  if p_band not in ('under8', '8to10', 'above10') then raise exception 'bad package band'; end if;

  perform pg_advisory_xact_lock(hashtext(v_user::text));   -- stops double-click races

  -- Close interviews that ran out of time
  update interviews set status = 'stopped', finished_at = now()
    where user_id = v_user and status = 'active' and expires_at < now();

  -- Resume an open interview instead of starting (and counting) a new one.
  -- If there are several open ones, the newest wins.
  select id into v_id from interviews
    where user_id = v_user and status = 'active'
    order by started_at desc
    limit 1;
  if v_id is not null then return v_id; end if;

  -- Quota window starts at the later of: this month (IST) or the last admin reset.
  select greatest(
    (date_trunc('month', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata'),
    coalesce(
      (select s.interview_quota_reset_at from user_admin_state s where s.user_id = v_user),
      '-infinity'::timestamptz
    )
  ) into v_cutoff;

  select count(*) into v_used from interviews
    where user_id = v_user
      and started_at >= v_cutoff;
  if v_used >= 2 then return null; end if;

  insert into interviews (user_id, domain, band)
    values (v_user, coalesce(nullif(p_domain, ''), 'software'), p_band)
    returning id into v_id;

  insert into interview_rounds (interview_id, user_id, round_type, position) values
    (v_id, v_user, 'coding', 1),
    (v_id, v_user, 'core',   2),
    (v_id, v_user, 'hr',     3);

  return v_id;
end $function$;

-- Re-apply permissions (create or replace keeps them, this is just a safety net).
revoke all on function public.start_interview(text, text) from public, anon;
grant execute on function public.start_interview(text, text) to authenticated;