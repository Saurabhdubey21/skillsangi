-- 005_interviews.sql
-- AI Mock Interview: tables, security rules and functions.
-- Already applied by hand in the Supabase SQL Editor before 2026-10-22.
-- This file is for rebuilding the project. Do NOT run it on the live project.
--
-- Needs: auth.users, and the table public.questions (from earlier migrations).
-- start_interview: if a student has more than one active interview, the
-- newest one (order by started_at desc) is resumed. Nothing in the database
-- stops a student from having two active interviews; this is allowed for now.
-- start_round uses 60 minutes; this must match ROUND_MINUTES in
-- lib/ai/interview-prompt.ts.

-- ---------- Tables ----------

create table if not exists public.interviews (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  domain       text        not null default 'software',
  band         text        not null,
  status       text        not null default 'active',
  final_score  integer,
  final_report jsonb,
  started_at   timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '7 days'),
  finished_at  timestamptz,
  constraint interviews_band_check
    check (band in ('under8', '8to10', 'above10')),
  constraint interviews_status_check
    check (status in ('active', 'finished', 'stopped')),
  constraint interviews_final_score_check
    check (final_score >= 0 and final_score <= 100)
);

create index if not exists interviews_user_id_started_at_idx
  on public.interviews (user_id, started_at desc);

create table if not exists public.interview_rounds (
  id           uuid        primary key default gen_random_uuid(),
  interview_id uuid        not null references public.interviews(id) on delete cascade,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  round_type   text        not null,
  "position"   integer     not null,
  status       text        not null default 'pending',
  questions    jsonb,
  state        jsonb       not null default '{}'::jsonb,
  started_at   timestamptz,
  deadline     timestamptz,
  finished_at  timestamptz,
  score        integer,
  report       jsonb,
  constraint interview_rounds_interview_id_position_key
    unique (interview_id, "position"),
  constraint interview_rounds_round_type_check
    check (round_type in ('coding', 'core', 'hr')),
  constraint interview_rounds_position_check
    check ("position" >= 1 and "position" <= 3),
  constraint interview_rounds_status_check
    check (status in ('pending', 'active', 'passed', 'failed')),
  constraint interview_rounds_score_check
    check (score >= 0 and score <= 100)
);

create table if not exists public.interview_messages (
  id           uuid        primary key default gen_random_uuid(),
  interview_id uuid        not null references public.interviews(id) on delete cascade,
  round_id     uuid        not null references public.interview_rounds(id) on delete cascade,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  role         text        not null,
  content      text        not null,
  created_at   timestamptz not null default now(),
  constraint interview_messages_role_check
    check (role in ('user', 'assistant'))
);

create index if not exists interview_messages_round_id_created_at_idx
  on public.interview_messages (round_id, created_at);

-- ---------- Security: students can only READ their own rows ----------

alter table public.interviews         enable row level security;
alter table public.interview_rounds   enable row level security;
alter table public.interview_messages enable row level security;

drop policy if exists "own interviews" on public.interviews;
create policy "own interviews" on public.interviews
  for select using (auth.uid() = user_id);

drop policy if exists "own rounds" on public.interview_rounds;
create policy "own rounds" on public.interview_rounds
  for select using (auth.uid() = user_id);

drop policy if exists "own messages" on public.interview_messages;
create policy "own messages" on public.interview_messages
  for select using (auth.uid() = user_id);

-- Students: read only. Server (service_role): read, insert, update.
grant select on public.interviews, public.interview_rounds, public.interview_messages
  to authenticated;

grant usage on schema public to service_role;
grant select, insert, update
  on public.interviews, public.interview_rounds, public.interview_messages
  to service_role;
grant select on public.questions to service_role;

-- ---------- Functions students can call ----------

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

  select count(*) into v_used from interviews
    where user_id = v_user
      and started_at >= (date_trunc('month', now() at time zone 'Asia/Kolkata')
                         at time zone 'Asia/Kolkata');
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

create or replace function public.start_round(p_round_id uuid)
returns timestamp with time zone
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  r interview_rounds%rowtype;
  i interviews%rowtype;
  v_deadline timestamptz;
begin
  if v_user is null then raise exception 'not logged in'; end if;

  select * into r from interview_rounds
    where id = p_round_id and user_id = v_user for update;
  if not found then raise exception 'round not found'; end if;

  select * into i from interviews where id = r.interview_id;
  if i.status <> 'active' or i.expires_at < now() then
    raise exception 'this interview is not open';
  end if;

  if r.status = 'active' then return r.deadline; end if;
  if r.status <> 'pending' then raise exception 'this round is already finished'; end if;

  if r.position > 1 and not exists (
    select 1 from interview_rounds
    where interview_id = r.interview_id and position = r.position - 1 and status = 'passed'
  ) then
    raise exception 'finish the previous round first';
  end if;

  v_deadline := now() + interval '60 minutes';
  update interview_rounds
    set status = 'active', started_at = now(), deadline = v_deadline
    where id = r.id;
  return v_deadline;
end $function$;

revoke all on function public.start_interview(text, text) from public, anon;
grant execute on function public.start_interview(text, text) to authenticated;
revoke all on function public.start_round(uuid) from public, anon;
grant execute on function public.start_round(uuid) to authenticated;

-- ---------- Server-only functions (service_role). Students must NOT call these. ----------

create or replace function public.add_message(p_user uuid, p_round_id uuid, p_role text, p_content text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  r interview_rounds%rowtype;
begin
  if p_user is null then raise exception 'missing user'; end if;
  if p_role not in ('user', 'assistant') then raise exception 'bad role'; end if;
  if p_content is null or length(btrim(p_content)) = 0 then raise exception 'empty message'; end if;
  if length(p_content) > 8000 then raise exception 'message too long'; end if;

  select * into r from interview_rounds
    where id = p_round_id and user_id = p_user and status = 'active';
  if not found then raise exception 'this round is not active'; end if;
  if r.deadline is not null and now() > r.deadline + interval '2 minutes' then
    raise exception 'round time is over';
  end if;

  insert into interview_messages (interview_id, round_id, user_id, role, content)
    values (r.interview_id, r.id, p_user, p_role, p_content);
end $function$;

create or replace function public.finish_round(p_user uuid, p_round_id uuid, p_score integer, p_report jsonb, p_passed boolean)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  r interview_rounds%rowtype;
begin
  if p_user is null then raise exception 'missing user'; end if;
  if p_score is null or p_score < 0 or p_score > 100 then raise exception 'score must be 0 to 100'; end if;

  select * into r from interview_rounds
    where id = p_round_id and user_id = p_user and status = 'active' for update;
  if not found then raise exception 'this round is not active'; end if;

  update interview_rounds
    set status = case when p_passed then 'passed' else 'failed' end,
        score = p_score, report = p_report, finished_at = now()
    where id = r.id;

  if not p_passed then                                            -- STOP RULE
    update interviews set status = 'stopped', finished_at = now() -- STOP RULE
      where id = r.interview_id;                                  -- STOP RULE
  end if;
end $function$;

create or replace function public.finish_interview(p_user uuid, p_id uuid, p_final_score integer, p_final_report jsonb)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if p_user is null then raise exception 'missing user'; end if;
  if p_final_score is null or p_final_score < 0 or p_final_score > 100 then
    raise exception 'score must be 0 to 100';
  end if;

  update interviews
    set final_score = p_final_score,
        final_report = p_final_report,
        finished_at = coalesce(finished_at, now()),
        status = case when status = 'active' then 'finished' else status end
    where id = p_id and user_id = p_user and final_report is null;
end $function$;

revoke all on function public.add_message(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.add_message(uuid, uuid, text, text) to service_role;
revoke all on function public.finish_round(uuid, uuid, integer, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.finish_round(uuid, uuid, integer, jsonb, boolean) to service_role;
revoke all on function public.finish_interview(uuid, uuid, integer, jsonb) from public, anon, authenticated;
grant execute on function public.finish_interview(uuid, uuid, integer, jsonb) to service_role;