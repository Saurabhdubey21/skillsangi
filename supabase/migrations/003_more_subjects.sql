-- 003_more_subjects.sql
-- DOCUMENTATION ONLY. This was already run by hand in the Supabase SQL Editor
-- on 2026-10-18. Do not run it again.
--
-- Adds web-dev, cloud, ai-ml, hld, lld and sql questions to public.questions
-- (the same table as the DSA bank). RLS policies and views are unchanged and
-- already work for any subject.

-- 1. New columns (no new grant needed; the grants cover the whole table)
alter table public.questions
  add column if not exists task text,
  add column if not exists platform_label text;

-- 2. Display names for the existing DSA platforms
update public.questions
set platform_label = case platform
  when 'leetcode' then 'LeetCode'
  when 'geeksforgeeks' then 'GeeksforGeeks'
  when 'cses' then 'CSES'
  when 'codeforces' then 'Codeforces'
end
where subject = 'dsa';

-- 3. Data import (done in the Table Editor, not in SQL):
--    Table Editor > questions > Insert > Import data from CSV
--    file: questions_new_subjects_import.csv (970 rows), imported once.
--    core, pattern, is_active and source were left to their defaults.

-- 4. Expected row counts per subject after the import (total 2225):
--    ai-ml 179, cloud 116, dsa 1255, hld 104, lld 87, sql 292, web-dev 192
-- select subject, count(*) from public.questions group by subject order by subject;

-- Expected topics per subject:
--    ai-ml 14, cloud 14, dsa 14, hld 12, lld 11, sql 12, web-dev 16
-- select subject, count(*) from public.question_topics group by subject order by subject;