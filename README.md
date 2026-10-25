# SkillSangi

A free AI-powered placement-prep platform for engineering students. It is in **Beta**.

Live site: https://skillsangi.vercel.app/

## What it does

- **Mock Interview:** a timed, 3-round AI interview (coding, core CS, HR) for three package bands (Under 8, 8 to 10, Above 10 LPA). Each student gets 2 free interviews per month. Scores are AI practice estimates, not a prediction of real selection.
- **Roadmap:** pick a subject, your level and your hours per day, and get daily tasks to tick off.
- **Practice:** more than 2,000 curated question links across DSA, Web, Cloud, AI/ML, HLD, LLD and SQL. Each question links out to the original site (LeetCode, GeeksforGeeks, Codeforces and others). Only the title, link, source, topic and difficulty are stored.
- **AI Teacher:** chat help, plus AI review of code you paste into the Code Editor. The AI only reads code. The app never runs it.
- **Teammates:** an opt-in card for finding study partners.
- **Admin panel:** user overview, audit log and quota tools, restricted to admin accounts.

## Tech stack

- Next.js (App Router, TypeScript, Turbopack, Cache Components) on Vercel
- Supabase: Postgres, email and password Auth, and Row Level Security on every table
- Gemini as the main AI, with Groq as a backup (all AI calls go through `lib/ai/provider.ts`)
- Brevo SMTP for auth emails

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

To check a production build:

```bash
npm run build
npm run start
```

## Environment variables

Create a `.env.local` file in the project root. It is not tracked by git. Never commit real values.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_PROVIDER=
GEMINI_API_KEY=
GEMINI_MODEL=
GROQ_API_KEY=
GROQ_MODEL=
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to the browser.

## Database

The schema lives in Supabase. The SQL files in `supabase/migrations/` are the record of changes and are applied by hand in the Supabase SQL Editor.

## Privacy

See `/privacy` on the live site for what data is stored and what is sent to the AI providers.

## Status

SkillSangi is a solo student project in Beta. Feedback is welcome.