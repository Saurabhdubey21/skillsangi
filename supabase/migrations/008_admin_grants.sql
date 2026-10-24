-- SkillSangi admin panel: table permissions for the server (service_role).
-- Needed because this project does not grant table access automatically.
-- Safe to re-run.

grant usage on schema public to service_role;

-- admin tables
grant select, insert, update, delete on public.admin_users, public.user_admin_state, public.events to service_role;
grant select, insert on public.admin_audit_log to service_role;

-- read-only counts on the user detail page
grant select on public.roadmaps, public.problem_progress, public.interviews,
                public.chat_threads, public.code_attempts to service_role;

-- activity tracking from the app (/api/track inserts as the signed-in student)
grant insert on public.events to authenticated;