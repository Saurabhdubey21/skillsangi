# SkillSangi
Student learning platform: AI teacher + personalized roadmaps + study partners
+ coding practice + voice debugging assistant.
("Sangi" = companion. Working name, may change.)

## Goal
- Target: up to 10k users. First users: my college classmates.
- North star: help students learn a skill, find people to learn with,
  practice, find weak topics, and make measurable progress.

## Developer
- College student, knows C++, new to JavaScript/TypeScript/React.
- Builds solo with Claude's help. Explain fixes simply, in small steps.
- Windows laptop, 8 GB RAM.

## Stack
- Frontend + backend: Next.js 16 (TypeScript, App Router, Tailwind, Turbopack)
- Database / auth / realtime: Supabase (Postgres)
- AI teacher: Claude API (Haiku by default, stronger model only for hard tasks)
- Code execution: Judge0 (later)
- Voice: browser Web Speech API (free), provider must stay swappable
- Hosting: Vercel (auto-deploy from GitHub)

## Rules
- Never put secret keys in frontend code or on GitHub.
- Keys live in .env.local (laptop) and Vercel Environment Variables.
- Only NEXT_PUBLIC_ variables are visible to the browser.
- Turn on Supabase Row Level Security (RLS) on every table.
- Add per-user daily AI message limits (cost control).
- Build one small feature at a time, test it, then commit.

## Environment variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- ANTHROPIC_API_KEY (server only, later)

## Phases
1. MVP: accounts, profiles, roadmaps, AI teacher, basic question bank,
   dashboard, student discovery, study groups
2. Revision, weak topics, notes, visualizers, voice mode
3. Study rooms, doubt forum, skill exchange, duels
4. Interviews, placement tools, portfolios, system design
5. Growth: referrals, college leagues, progress cards
6. Mobile apps, collaborative editor, mentors

## Done
- Node, npm, Git installed
- Next.js project created (TypeScript) and runs on localhost:3000

## Current task
- Step 1: PROJECT.md (this file)
- Next: frontend, then backend

## Database tables
(none yet)

## Notes
- Next.js was created with "recommended defaults", so Cache Components is enabled.