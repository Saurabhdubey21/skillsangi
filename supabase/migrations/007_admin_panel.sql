-- SkillSangi admin panel: database setup
-- Run this once in Supabase -> SQL Editor. It is safe to re-run.
-- Nothing here touches your existing tables.

-- 1. Who is an admin ---------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
-- No policies on purpose: only the server (service role) can read or write this.

-- 2. Per-user admin state (plan, suspension note, quota reset) ---------------
create table if not exists public.user_admin_state (
  user_id                  uuid primary key references auth.users(id) on delete cascade,
  plan                     text not null default 'free' check (plan in ('free', 'pro')),
  suspended                boolean not null default false,
  suspended_reason         text,
  interview_quota_reset_at timestamptz,
  updated_at               timestamptz not null default now()
);
alter table public.user_admin_state enable row level security;

-- 3. Activity events ---------------------------------------------------------
create table if not exists public.events (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users(id) on delete set null,
  event_type text  not null check (char_length(event_type) <= 64),
  metadata   jsonb not null default '{}'::jsonb check (pg_column_size(metadata) <= 4096),
  created_at timestamptz not null default now()
);
create index if not exists events_created_idx   on public.events (created_at desc);
create index if not exists events_user_idx      on public.events (user_id, created_at desc);
create index if not exists events_type_idx      on public.events (event_type, created_at desc);
alter table public.events enable row level security;

drop policy if exists "users insert own events" on public.events;
create policy "users insert own events"
  on public.events for insert to authenticated
  with check (user_id = auth.uid());
-- No select policy: students cannot read events. Only the admin server can.

-- 4. Audit log (append-only) -------------------------------------------------
-- No foreign keys on purpose, so history survives account deletion.
create table if not exists public.admin_audit_log (
  id             bigint generated always as identity primary key,
  admin_id       uuid not null,
  admin_email    text,
  action         text not null,
  target_user_id uuid,
  target_email   text,
  details        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists audit_created_idx on public.admin_audit_log (created_at desc);
alter table public.admin_audit_log enable row level security;

create or replace function public.audit_log_append_only()
returns trigger language plpgsql as $$
begin
  raise exception 'admin_audit_log is append-only';
end;
$$;

drop trigger if exists audit_no_change on public.admin_audit_log;
create trigger audit_no_change
  before update or delete on public.admin_audit_log
  for each row execute function public.audit_log_append_only();

-- 5. Dashboard aggregate functions -------------------------------------------
-- These read auth.users, so they are SECURITY DEFINER and locked to service_role.
-- Without the revoke lines, any visitor could call them through the public API.

create or replace function public.admin_overview_stats()
returns table (
  total_users     bigint,
  confirmed_users bigint,
  pending_users   bigint,
  banned_users    bigint,
  signups_7d      bigint,
  signups_30d     bigint
)
language sql security definer set search_path = '' stable as $$
  select
    count(*),
    count(*) filter (where email_confirmed_at is not null),
    count(*) filter (where email_confirmed_at is null),
    count(*) filter (where banned_until is not null and banned_until > now()),
    count(*) filter (where created_at > now() - interval '7 days'),
    count(*) filter (where created_at > now() - interval '30 days')
  from auth.users;
$$;

create or replace function public.admin_active_counts()
returns table (dau bigint, wau bigint, mau bigint)
language sql security definer set search_path = '' stable as $$
  with act as (
    select user_id, created_at as ts
      from public.events
     where user_id is not null and created_at > now() - interval '30 days'
    union all
    select id, last_sign_in_at
      from auth.users
     where last_sign_in_at > now() - interval '30 days'
  )
  select
    count(distinct user_id) filter (where ts > now() - interval '1 day'),
    count(distinct user_id) filter (where ts > now() - interval '7 days'),
    count(distinct user_id)
  from act;
$$;

create or replace function public.admin_signups_per_day(p_days int default 30)
returns table (day date, signups bigint)
language sql security definer set search_path = '' stable as $$
  select g::date as day, count(u.id) as signups
    from generate_series(
           (now() at time zone 'utc')::date - (p_days - 1),
           (now() at time zone 'utc')::date,
           interval '1 day') as g
    left join auth.users u
      on (u.created_at at time zone 'utc')::date = g::date
   group by g
   order by g;
$$;

create or replace function public.admin_top_events(p_days int default 7)
returns table (event_type text, total bigint, users bigint)
language sql security definer set search_path = '' stable as $$
  select e.event_type, count(*), count(distinct e.user_id)
    from public.events e
   where e.created_at > now() - make_interval(days => p_days)
   group by e.event_type
   order by count(*) desc
   limit 15;
$$;

create or replace function public.admin_list_users(
  p_search text default '',
  p_limit  int  default 25,
  p_offset int  default 0,
  p_sort   text default 'newest'
)
returns table (
  id                uuid,
  email             text,
  full_name         text,
  created_at        timestamptz,
  last_sign_in_at   timestamptz,
  email_confirmed_at timestamptz,
  banned_until      timestamptz,
  plan              text,
  events_30d        bigint,
  total_count       bigint
)
language sql security definer set search_path = '' stable as $$
  select
    u.id,
    u.email::text,
    coalesce(u.raw_user_meta_data->>'full_name',
             u.raw_user_meta_data->>'name',
             u.raw_user_meta_data->>'display_name')::text,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at,
    u.banned_until,
    coalesce(s.plan, 'free'),
    (select count(*) from public.events e
      where e.user_id = u.id and e.created_at > now() - interval '30 days'),
    count(*) over ()
  from auth.users u
  left join public.user_admin_state s on s.user_id = u.id
  where coalesce(p_search, '') = ''
     or u.email ilike '%' || p_search || '%'
     or coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')
          ilike '%' || p_search || '%'
  order by
    (case when p_sort = 'last_active' then u.last_sign_in_at end) desc nulls last,
    u.created_at desc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

-- Lock every function to the server only.
revoke all on function public.admin_overview_stats()                       from public, anon, authenticated;
revoke all on function public.admin_active_counts()                        from public, anon, authenticated;
revoke all on function public.admin_signups_per_day(int)                   from public, anon, authenticated;
revoke all on function public.admin_top_events(int)                        from public, anon, authenticated;
revoke all on function public.admin_list_users(text, int, int, text)      from public, anon, authenticated;

grant execute on function public.admin_overview_stats()                    to service_role;
grant execute on function public.admin_active_counts()                     to service_role;
grant execute on function public.admin_signups_per_day(int)                to service_role;
grant execute on function public.admin_top_events(int)                     to service_role;
grant execute on function public.admin_list_users(text, int, int, text)   to service_role;

-- 6. Make yourself the first admin -------------------------------------------
-- Replace the email, then run this single statement. Sign up on the site first.
--
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'YOUR_EMAIL@gmail.com'
-- on conflict do nothing;
