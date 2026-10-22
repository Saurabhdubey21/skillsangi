-- 004_ai_daily_limit.sql
-- AI Teacher daily message limit, decided inside the database.
-- Needs the table public.ai_usage (user_id, usage_day, message_count,
-- unique on user_id + usage_day). That table is not in the repo yet.
-- Already applied by hand in the Supabase SQL Editor on 2026-10-22.
-- Do NOT run this on the live project again.

-- The daily limit lives here, in one place. Change the number to change the cap.
create or replace function public.ai_daily_limit()
returns integer
language sql
immutable
set search_path to 'public'
as $$ select 30 $$;

-- Counts one message for the logged-in student. The browser cannot choose the limit.
-- Returns the new count, or -1 when the daily limit is reached.
create or replace function public.bump_ai_usage()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_count integer;
begin
  if auth.uid() is null then
    raise exception 'not logged in';
  end if;
  insert into public.ai_usage (user_id, usage_day, message_count)
  values (auth.uid(), current_date, 1)
  on conflict (user_id, usage_day) do update
    set message_count = public.ai_usage.message_count + 1
    where public.ai_usage.message_count < public.ai_daily_limit()
  returning message_count into v_count;
  if v_count is null then
    return -1;
  end if;
  return v_count;
end;
$$;

revoke all on function public.ai_daily_limit() from public, anon;
grant execute on function public.ai_daily_limit() to authenticated;
revoke all on function public.bump_ai_usage() from public, anon;
grant execute on function public.bump_ai_usage() to authenticated;

-- The old version let the caller send the limit, so a student could skip the cap.
drop function if exists public.bump_ai_usage(integer);