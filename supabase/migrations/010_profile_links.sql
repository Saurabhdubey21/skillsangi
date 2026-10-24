-- SkillSangi: mobile number, LinkedIn and coding profile links on the profile page.
--
-- Safe to run more than once. It only ADDS columns and rules. It does not touch
-- existing rows, and the existing row level security on public.profiles stays
-- exactly as it is (each student can read and update only their own row).
--
-- Rollback (this deletes whatever students typed into these three columns):
--   alter table public.profiles
--     drop column if exists phone,
--     drop column if exists linkedin_url,
--     drop column if exists coding_links;

alter table public.profiles
  add column if not exists phone        text,
  add column if not exists linkedin_url text,
  add column if not exists coding_links jsonb not null default '{}'::jsonb;

-- Mobile number: digits with an optional leading +, 10 to 13 digits.
alter table public.profiles drop constraint if exists profiles_phone_format;
alter table public.profiles add constraint profiles_phone_format
  check (phone is null or phone ~ '^\+?[0-9]{10,13}$');

-- LinkedIn link: https only, at most 300 characters.
alter table public.profiles drop constraint if exists profiles_linkedin_format;
alter table public.profiles add constraint profiles_linkedin_format
  check (
    linkedin_url is null
    or (char_length(linkedin_url) <= 300 and linkedin_url ~* '^https://')
  );

-- Coding profile links: a small JSON object like {"leetcode": "https://..."}.
alter table public.profiles drop constraint if exists profiles_coding_links_shape;
alter table public.profiles add constraint profiles_coding_links_shape
  check (
    jsonb_typeof(coding_links) = 'object'
    and pg_column_size(coding_links) <= 2048
  );