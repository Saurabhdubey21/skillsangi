"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { track } from "../../lib/admin/track-client";
import { getDomain } from "../../lib/roadmaps";
import { subjects } from "../../lib/questions";
import { SUPPORT_EMAIL } from "../../lib/site";
import AppShell from "../components/AppShell";
import TrackDashboardView from "../components/TrackDashboardView";

type Client = ReturnType<typeof createClient>;

type RoadmapRow = {
  id: string;
  skill: string;
  level: string;
  hours_per_day: number;
};

type Task = {
  id: string;
  day_number: number;
  position: number;
  title: string;
  kind: string;
  done: boolean;
  module: string | null;
  link: string | null;
};

// One roadmap with the numbers and today's tasks the dashboard needs
type Card = RoadmapRow & {
  total: number;
  done: number;
  lastDay: number;
  day: number | null;
  tasks: Task[];
};

// Practice numbers for one subject (solved of total questions)
type SubjectStat = {
  id: string;
  name: string;
  solved: number;
  total: number;
};

const TASK_COLUMNS = "id, day_number, position, title, kind, done, module, link";
const WARN_HOURS = 6;
const SUBJECTS_SHOWN = 4;

// The Learn / Practice / Review pill and the "Open questions" button share one size
const pillClass =
  "shrink-0 self-center rounded-control border px-3 py-1.5 text-center text-xs font-medium capitalize sm:w-32";
const questionsButtonClass =
  "shrink-0 rounded-control border border-border bg-surface px-3 py-1.5 text-center text-xs font-medium text-accent transition-colors hover:bg-surface-strong sm:w-32";

const ring =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// Roadmaps where the Practice pill opens the code editor (the others only get questions)
const codeSkills = ["dsa", "c", "cpp", "java", "python"];

// The current time is passed in after the page loads, never read while rendering
function greeting(now: Date | null) {
  if (!now) return "Welcome";
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function localDay(d: Date) {
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD in the student's own timezone
}

// Consecutive days with at least one finished task, across every roadmap.
// Today does not break the streak until it ends.
function computeStreak(stamps: string[], now: Date) {
  const days = new Set(stamps.map((s) => localDay(new Date(s))));
  const cursor = new Date(now);
  if (!days.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDay(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function isComplete(c: Card) {
  return c.total > 0 && c.done >= c.total;
}

// Where a subject lives on the Practice page (DSA is the default page)
function practiceHref(subjectId: string) {
  return subjectId === "dsa" ? "/practice" : `/practice?subject=${subjectId}`;
}

async function loadCard(supabase: Client, r: RoadmapRow) {
  const [allRes, doneRes, nextRes, lastRes] = await Promise.all([
    supabase
      .from("roadmap_tasks")
      .select("id", { count: "exact", head: true })
      .eq("roadmap_id", r.id),
    supabase
      .from("roadmap_tasks")
      .select("id", { count: "exact", head: true })
      .eq("roadmap_id", r.id)
      .eq("done", true),
    supabase
      .from("roadmap_tasks")
      .select("day_number")
      .eq("roadmap_id", r.id)
      .eq("done", false)
      .order("day_number", { ascending: true })
      .limit(1),
    supabase
      .from("roadmap_tasks")
      .select("day_number")
      .eq("roadmap_id", r.id)
      .order("day_number", { ascending: false })
      .limit(1),
  ]);

  const day: number | null = nextRes.data?.[0]?.day_number ?? null;
  let tasks: Task[] = [];
  let taskError: string | null = null;

  if (day !== null) {
    const { data, error } = await supabase
      .from("roadmap_tasks")
      .select(TASK_COLUMNS)
      .eq("roadmap_id", r.id)
      .eq("day_number", day)
      .order("position", { ascending: true });
    if (error) taskError = error.message;
    tasks = (data ?? []) as Task[];
  }

  const card: Card = {
    ...r,
    total: allRes.count ?? 0,
    done: doneRes.count ?? 0,
    lastDay: lastRes.data?.[0]?.day_number ?? 0,
    day,
    tasks,
  };

  const firstError =
    allRes.error?.message ??
    doneRes.error?.message ??
    nextRes.error?.message ??
    lastRes.error?.message ??
    taskError;

  return { card, error: firstError };
}

/* ---------- small icons (decorative) ---------- */

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const icons = {
  flame: (
    <Icon>
      <path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z" />
    </Icon>
  ),
  map: (
    <Icon>
      <path d="M4 6h16M4 12h10M4 18h16" />
    </Icon>
  ),
  code: (
    <Icon>
      <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />
    </Icon>
  ),
  terminal: (
    <Icon>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 9l3 3-3 3M13 15h4" />
    </Icon>
  ),
  mic: (
    <Icon>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </Icon>
  ),
  chat: (
    <Icon>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
    </Icon>
  ),
  users: (
    <Icon>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 3-5.5 6.5-5.5s6.5 1.9 6.5 5.5" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2.2.7 3.5 2.3 3.5 5.2" />
    </Icon>
  ),
  mail: (
    <Icon>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </Icon>
  ),
  shield: (
    <Icon>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
    </Icon>
  ),
  flag: (
    <Icon>
      <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
    </Icon>
  ),
};

/* ---------- reusable pieces ---------- */

function ProgressRing({ percent, label }: { percent: number; label: string }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      role="img"
      aria-label={label}
      className="shrink-0"
    >
      <circle cx="24" cy="24" r={r} fill="none" strokeWidth="5" className="stroke-surface-strong" />
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (c * clamped) / 100}
        transform="rotate(-90 24 24)"
        className="stroke-accent transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  );
}

function Stat({
  label,
  value,
  hint,
  icon,
  percent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  percent?: number;
}) {
  return (
    <div className="glass flex items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0">
        <dt className="flex items-center gap-2 text-sm text-muted">
          <span className="text-glow">{icon}</span>
          {label}
        </dt>
        <dd className="mt-1.5 font-display text-2xl font-semibold">{value}</dd>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      {percent !== undefined && <ProgressRing percent={percent} label={`${label} ${percent}%`} />}
    </div>
  );
}

function CheckBox({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${
        done ? "border-accent bg-accent text-on-accent" : "border-muted"
      }`}
    >
      {done && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6.5l2.2 2.2L9.5 3.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

function ActionCard({
  href,
  icon,
  title,
  text,
  badge,
  className = "",
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  text: string;
  badge?: number;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col rounded-panel border border-border bg-surface p-5 transition-colors hover:bg-surface-strong ${ring} ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-control bg-accent/15 text-glow">
          {icon}
        </span>
        {badge !== undefined && badge > 0 && (
          <span className="rounded-full bg-streak px-2 py-0.5 text-xs font-semibold text-background">
            {badge}
          </span>
        )}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted">{text}</p>
    </Link>
  );
}

const primaryLink =
  "inline-block shrink-0 rounded-control bg-accent px-6 py-3 font-medium text-on-accent shadow-[0_8px_30px_-8px_var(--accent)] transition hover:bg-accent-hover";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [completions, setCompletions] = useState<Record<string, string>>({}); // task id -> finished at
  const [solved, setSolved] = useState(0); // solved questions, all subjects
  const [totalProblems, setTotalProblems] = useState(0); // all questions, all subjects
  const [bySubject, setBySubject] = useState<SubjectStat[]>([]);
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [interviewsStarted, setInterviewsStarted] = useState(0);
  const [error, setError] = useState("");
  const [now, setNow] = useState<Date | null>(null);

  // Read the current time once, after the page has loaded
  useEffect(() => {
    setNow(new Date());
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Not logged in -> send to the login page
      if (!user) {
        router.replace("/login");
        return;
      }
      setEmail(user.email ?? "");

      const [
        profileRes,
        roadmapRes,
        progressRes,
        topicsRes,
        requestRes,
        messageRes,
        doneRes,
        interviewRes,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, college")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("roadmaps")
          .select("id, skill, level, hours_per_day")
          .eq("user_id", user.id),
        // Solved questions per topic, for every subject (the view is per student)
        supabase.from("question_topic_progress").select("subject, solved"),
        // Total questions per topic, for every subject
        supabase.from("question_topics").select("subject, total"),
        supabase
          .from("partner_requests")
          .select("id", { count: "exact", head: true })
          .eq("to_user", user.id)
          .eq("status", "pending"),
        supabase
          .from("partner_messages")
          .select("id", { count: "exact", head: true })
          .eq("to_user", user.id)
          .is("read_at", null),
        supabase
          .from("roadmap_tasks")
          .select("id, completed_at")
          .eq("user_id", user.id)
          .eq("done", true)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(1000),
        // Only used for the "Get started" checklist. Students can read their own rows.
        supabase
          .from("interviews")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      if (!active) return;

      setFullName(profileRes.data?.full_name?.trim() ?? "");
      setCollege(profileRes.data?.college ?? null);

      // Add up solved and total for each subject
      const solvedBySubject: Record<string, number> = {};
      (progressRes.data ?? []).forEach((row) => {
        solvedBySubject[row.subject] = (solvedBySubject[row.subject] ?? 0) + row.solved;
      });
      const totalBySubject: Record<string, number> = {};
      (topicsRes.data ?? []).forEach((row) => {
        totalBySubject[row.subject] = (totalBySubject[row.subject] ?? 0) + row.total;
      });
      const stats: SubjectStat[] = subjects
        .map((s) => ({
          id: s.id,
          name: s.name,
          solved: solvedBySubject[s.id] ?? 0,
          total: totalBySubject[s.id] ?? 0,
        }))
        .filter((s) => s.total > 0);
      setBySubject(stats);
      setSolved(stats.reduce((sum, s) => sum + s.solved, 0));
      setTotalProblems(stats.reduce((sum, s) => sum + s.total, 0));

      setPendingRequests(requestRes.count ?? 0);
      setUnreadMessages(messageRes.count ?? 0);
      setInterviewsStarted(interviewRes.count ?? 0);

      const map: Record<string, string> = {};
      (doneRes.data ?? []).forEach((t) => {
        if (t.completed_at) map[t.id] = t.completed_at;
      });
      setCompletions(map);

      let firstError =
        roadmapRes.error?.message ??
        progressRes.error?.message ??
        topicsRes.error?.message ??
        requestRes.error?.message ??
        messageRes.error?.message ??
        doneRes.error?.message ??
        null;

      const loaded = await Promise.all(
        ((roadmapRes.data ?? []) as RoadmapRow[]).map((r) => loadCard(supabase, r))
      );
      if (!active) return;

      const built = loaded.map((l) => l.card);
      loaded.forEach((l) => {
        if (!firstError && l.error) firstError = l.error;
      });
      if (firstError) setError("Some details could not be loaded: " + firstError);

      // Roadmaps in progress first
      built.sort((a, b) => Number(isComplete(a)) - Number(isComplete(b)));
      setCards(built);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  async function toggleTask(cardId: string, task: Task) {
    const next = !task.done;
    const delta = next ? 1 : -1;
    const stamp = next ? new Date().toISOString() : null;
    setError("");

    const apply = (done: boolean, change: number) => {
      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId
            ? {
                ...c,
                done: c.done + change,
                tasks: c.tasks.map((t) => (t.id === task.id ? { ...t, done } : t)),
              }
            : c
        )
      );
    };

    const setCompletion = (value: string | null) => {
      setCompletions((prev) => {
        const copy = { ...prev };
        if (value) copy[task.id] = value;
        else delete copy[task.id];
        return copy;
      });
    };

    apply(next, delta);
    setCompletion(stamp);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("roadmap_tasks")
      .update({ done: next, completed_at: stamp })
      .eq("id", task.id);

    if (updateError) {
      // Put the checkbox back and tell the student
      apply(task.done, -delta);
      setCompletion(task.done ? (completions[task.id] ?? new Date().toISOString()) : null);
      setError("Could not save that change: " + updateError.message);
    } else if (next) {
      // Saved and checked (not unchecked): record it for the admin numbers.
      // Only the subject id is sent, never the task title.
      const skill = cards.find((c) => c.id === cardId)?.skill;
      track("task_completed", skill ? { roadmap: skill } : {});
    }
  }

  const stats = useMemo(() => {
    const total = cards.reduce((sum, c) => sum + c.total, 0);
    const done = cards.reduce((sum, c) => sum + c.done, 0);
    return {
      percent: total ? Math.round((done / total) * 100) : 0,
      streak: now ? computeStreak(Object.values(completions), now) : 0,
    };
  }, [cards, completions, now]);

  if (loading) {
    return (
      <div
        role="status"
        className="backdrop-wash flex min-h-screen items-center justify-center text-muted"
      >
        Loading your dashboard...
      </div>
    );
  }

  const displayName = fullName || email.split("@")[0];
  const firstName = displayName.split(" ")[0];

  const active = cards.filter((c) => !isComplete(c));
  const finished = cards.filter((c) => isComplete(c));
  const totalHours = active.reduce((sum, c) => sum + c.hours_per_day, 0);

  // Text for the "Your roadmaps" card. It lists the student's real roadmaps in
  // progress with their task counts. With none, it invites them to build one.
  let roadmapsCardText: string;
  if (active.length > 0) {
    const shown = active
      .slice(0, 3)
      .map((c) => `${getDomain(c.skill)?.name ?? "Roadmap"} ${c.done} of ${c.total} tasks`)
      .join(", ");
    const extra = active.length - 3;
    roadmapsCardText = `${shown}${extra > 0 ? ` and ${extra} more` : ""}. Pick up where you left off.`;
  } else {
    roadmapsCardText = "Pick a subject, your level and your daily hours to get a day-by-day plan.";
  }

  const practiceCardText =
    solved === 0
      ? "Start with the first topic and solve your first question."
      : `${solved} of ${totalProblems} solved. Pick up where you left off.`;

  const teammateNote =
    pendingRequests > 0
      ? `${pendingRequests} request${pendingRequests > 1 ? "s" : ""} waiting for you`
      : unreadMessages > 0
        ? `${unreadMessages} unread message${unreadMessages > 1 ? "s" : ""}`
        : "Find a study partner or a project teammate.";

  const practicePercent = totalProblems ? Math.round((solved / totalProblems) * 100) : 0;

  // "Get started" checklist, built from real data
  const checklist = [
    {
      done: Boolean(college),
      title: "Add your college",
      text: "It helps us match you with classmates.",
      href: "/profile",
      cta: "Update profile",
    },
    {
      done: cards.length > 0,
      title: "Build your first roadmap",
      text: "Pick a subject, level and daily hours.",
      href: "/roadmap",
      cta: "Build roadmap",
    },
    {
      done: solved > 0,
      title: "Solve your first question",
      text: "Open a topic and try one question.",
      href: "/practice",
      cta: "Open practice",
    },
    {
      done: interviewsStarted > 0,
      title: "Try a mock interview",
      text: "Three timed rounds. 2 free interviews a month.",
      href: "/interview",
      cta: "Start interview",
    },
  ];
  const checklistDone = checklist.filter((c) => c.done).length;
  const showChecklist = checklistDone < checklist.length;

  // Subjects with progress first, then the rest in their usual order
  const sortedSubjects = [...bySubject].sort((a, b) => b.solved - a.solved);
  const visibleSubjects = showAllSubjects ? sortedSubjects : sortedSubjects.slice(0, SUBJECTS_SHOWN);

  const reportHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("SkillSangi: problem report")}`;
  const feedbackHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("SkillSangi: feedback")}`;

  return (
    <AppShell userName={displayName}>
      <TrackDashboardView />

      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {greeting(now)}, {firstName}
          </h1>
          <p className="mt-2 text-muted">
            {active.length > 0
              ? `Here is what is on your plate today across ${active.length} roadmap${active.length > 1 ? "s" : ""}.`
              : "Set up a study plan in about a minute."}
          </p>
        </div>
        {active.length > 0 ? (
          <a href="#todays-plan" className={`${primaryLink} ${ring}`}>
            Continue today&apos;s plan
          </a>
        ) : (
          <Link href="/roadmap" className={`${primaryLink} ${ring}`}>
            Build my roadmap
          </Link>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-control border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      {/* Quick numbers */}
      <dl className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat
          icon={icons.flame}
          label="Streak"
          value={`${stats.streak} day${stats.streak === 1 ? "" : "s"}`}
          hint={stats.streak === 0 ? "Finish a task to start one" : "Keep it going"}
        />
        <Stat
          icon={icons.map}
          label="Roadmaps"
          value={cards.length ? `${stats.percent}%` : "Not started"}
          hint={cards.length ? `${active.length} in progress` : undefined}
          percent={cards.length ? stats.percent : undefined}
        />
        <Stat
          icon={icons.code}
          label="Practice"
          value={`${solved} of ${totalProblems}`}
          hint="questions solved"
          percent={practicePercent}
        />
      </dl>

      {totalHours > WARN_HOURS && (
        <p className="mt-4 rounded-control border border-border bg-surface px-4 py-3 text-sm text-muted">
          You are planning {totalHours} hours of study a day. Remember to take breaks.
        </p>
      )}

      {/* Get started checklist (only until everything is done) */}
      {showChecklist && (
        <section aria-label="Get started" className="glass mt-6 p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">Get started</h2>
            <span className="text-sm text-muted">
              {checklistDone} of {checklist.length} done
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Get started progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((checklistDone / checklist.length) * 100)}
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-strong"
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-accent to-glow transition-[width] duration-500"
              style={{ width: `${(checklistDone / checklist.length) * 100}%` }}
            />
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {checklist.map((item) => (
              <li
                key={item.title}
                className="flex items-start justify-between gap-3 rounded-control border border-border bg-surface p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      item.done ? "bg-accent text-on-accent" : "border-2 border-border"
                    }`}
                  >
                    {item.done && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2.5 6.5l2.2 2.2L9.5 3.8"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <div>
                    <p className={`font-medium ${item.done ? "text-muted line-through" : ""}`}>
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">{item.text}</p>
                  </div>
                </div>
                {!item.done && (
                  <Link
                    href={item.href}
                    className={`shrink-0 rounded-control text-sm font-medium text-accent hover:underline ${ring}`}
                  >
                    {item.cta}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Today's plan, one card for each roadmap in progress */}
      {cards.length === 0 && (
        <section aria-label="Today's plan" className="glass mt-6 p-6 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold">You do not have a plan yet</h2>
              <p className="mt-2 max-w-md text-muted">
                Pick a subject, your level and how much time you have, and we will build a
                day-by-day roadmap.
              </p>
            </div>
            <Link href="/roadmap" className={primaryLink}>
              Build my roadmap
            </Link>
          </div>
        </section>
      )}

      {cards.length > 0 && active.length === 0 && (
        <section aria-label="Today's plan" className="glass mt-6 p-6 sm:p-8">
          <h2 className="text-xl font-semibold">All roadmaps complete</h2>
          <p className="mt-2 text-muted">
            You finished everything you started. Add a new subject to keep going.
          </p>
          <Link href="/roadmap" className={`${primaryLink} mt-4`}>
            Add a subject
          </Link>
        </section>
      )}

      {active.map((card, index) => {
        const name = getDomain(card.skill)?.name ?? "Your roadmap";
        const pct = card.total ? Math.round((card.done / card.total) * 100) : 0;
        const dayComplete = card.tasks.length > 0 && card.tasks.every((t) => t.done);

        return (
          <section
            key={card.id}
            id={index === 0 ? "todays-plan" : undefined}
            aria-label={`Today's plan: ${name}`}
            className="glass mt-6 scroll-mt-6 p-6 sm:p-8"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{name}</h2>
                <p className="mt-1 text-sm text-muted">
                  Day {card.day} of {card.lastDay}
                </p>
              </div>
              <Link href="/roadmap" className="text-sm font-medium text-accent hover:underline">
                Open roadmap
              </Link>
            </div>

            <div
              role="progressbar"
              aria-label={`${name} progress`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              className="mt-4 h-2 overflow-hidden rounded-full bg-surface-strong"
            >
              <div
                className="h-full rounded-full bg-linear-to-r from-accent to-glow transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted">
              {card.done} of {card.total} tasks, {pct}%
            </p>

            <ul className="mt-4 space-y-2">
              {card.tasks.map((task) => (
                <li key={task.id} className="flex items-center gap-2">
                  <label className="flex flex-1 cursor-pointer items-start gap-3 rounded-control p-2 transition-colors hover:bg-surface-strong">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(card.id, task)}
                      className="peer sr-only"
                    />
                    <CheckBox done={task.done} />
                    <span className="flex-1">
                      <span className={task.done ? "text-muted line-through" : ""}>
                        {task.title}
                      </span>
                      {task.module && (
                        <span className="mt-0.5 block text-xs text-muted">{task.module}</span>
                      )}
                    </span>
                    {task.kind === "practice" && task.link && codeSkills.includes(card.skill) ? (
                      <Link
                        href="/editor"
                        className={`${pillClass} border-accent bg-surface-strong text-accent transition-colors hover:bg-accent hover:text-on-accent`}
                      >
                        {task.kind}
                        <span className="sr-only"> (opens the code editor)</span>
                      </Link>
                    ) : (
                      <span className={`${pillClass} border-border bg-surface-strong text-muted`}>
                        {task.kind}
                      </span>
                    )}
                  </label>
                  {task.link && (
                    <Link href={task.link} className={questionsButtonClass}>
                      Open questions
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            {dayComplete && (
              <p
                role="status"
                className="mt-4 rounded-control border border-success/40 bg-success/10 px-4 py-3 text-sm text-success"
              >
                All done for today in {name}. Nice work! The next day will be waiting here.
              </p>
            )}
          </section>
        );
      })}

      {finished.length > 0 && active.length > 0 && (
        <p className="mt-4 text-sm text-muted">
          Completed:{" "}
          {finished.map((c) => getDomain(c.skill)?.name ?? "Roadmap").join(", ")}.{" "}
          <Link href="/roadmap" className="font-medium text-accent hover:underline">
            Add a subject
          </Link>
        </p>
      )}

      {/* Quick actions */}
      <section aria-label="Quick actions" className="mt-10">
        <h2 className="text-lg font-semibold">Jump back in</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            href="/roadmap"
            icon={icons.map}
            title={active.length > 0 ? "Your roadmaps" : "Build your roadmap"}
            text={roadmapsCardText}
          />
          <ActionCard
            href="/practice"
            icon={icons.code}
            title="Practice"
            text={practiceCardText}
          />
          {/* The code editor is desktop only, like the sidebar link */}
          <ActionCard
            href="/editor"
            icon={icons.terminal}
            title="Code Editor"
            text="Write code in C++, Java, Python or JavaScript, right in the browser."
            className="hidden md:flex"
          />
          <ActionCard
            href="/interview"
            icon={icons.mic}
            title="Interview"
            text="Three timed rounds: coding, core CS and HR. You get 2 free interviews a month."
          />
          <ActionCard
            href="/teacher"
            icon={icons.chat}
            title="AI Teacher"
            text="Stuck on a doubt? Ask in English or Hinglish and get hints, not just answers."
          />
          <ActionCard
            href="/partner"
            icon={icons.users}
            title="Teammates"
            text={teammateNote}
            badge={pendingRequests + unreadMessages}
          />
        </div>
      </section>

      {/* Practice progress for each subject */}
      {bySubject.length > 0 && (
        <section aria-label="Practice by subject" className="mt-10">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold">Practice by subject</h2>
            {bySubject.length > SUBJECTS_SHOWN && (
              <button
                type="button"
                onClick={() => setShowAllSubjects((v) => !v)}
                aria-expanded={showAllSubjects}
                className={`rounded-control text-sm font-medium text-accent hover:underline ${ring}`}
              >
                {showAllSubjects ? "Show fewer" : `Show all ${bySubject.length}`}
              </button>
            )}
          </div>
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-panel border border-border bg-surface">
            {visibleSubjects.map((s) => {
              const pct = s.total ? Math.round((s.solved / s.total) * 100) : 0;
              return (
                <li key={s.id}>
                  <Link
                    href={practiceHref(s.id)}
                    className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-strong ${ring}`}
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">{s.name}</span>
                    <div
                      role="progressbar"
                      aria-label={`${s.name} progress`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={pct}
                      className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-surface-strong sm:block"
                    >
                      <div
                        className="h-full rounded-full bg-linear-to-r from-accent to-glow"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right text-sm text-muted">
                      {s.solved} of {s.total}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Help and feedback */}
      <section aria-label="Help and feedback" className="glass mt-10 p-6 sm:p-8">
        <h2 className="text-lg font-semibold">Help and feedback</h2>
        <p className="mt-1.5 max-w-xl text-sm text-muted">
          Found a bug or have an idea? Write to us. SkillSangi is built by one student, and every
          message is read.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <a
            href={reportHref}
            className={`flex items-center gap-3 rounded-control border border-border bg-surface p-4 transition-colors hover:bg-surface-strong ${ring}`}
          >
            <span className="text-glow">{icons.flag}</span>
            <span>
              <span className="block font-medium">Report a problem</span>
              <span className="block text-xs text-muted">Opens your email app</span>
            </span>
          </a>
          <a
            href={feedbackHref}
            className={`flex items-center gap-3 rounded-control border border-border bg-surface p-4 transition-colors hover:bg-surface-strong ${ring}`}
          >
            <span className="text-glow">{icons.mail}</span>
            <span className="min-w-0">
              <span className="block font-medium">Contact us</span>
              <span className="block break-all text-xs text-muted">{SUPPORT_EMAIL}</span>
            </span>
          </a>
          <Link
            href="/privacy"
            className={`flex items-center gap-3 rounded-control border border-border bg-surface p-4 transition-colors hover:bg-surface-strong ${ring}`}
          >
            <span className="text-glow">{icons.shield}</span>
            <span>
              <span className="block font-medium">Privacy</span>
              <span className="block text-xs text-muted">How your data is used</span>
            </span>
          </Link>
        </div>
      </section>
    </AppShell>
  );
}