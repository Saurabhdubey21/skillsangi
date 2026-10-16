"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { getDomain } from "../../lib/roadmaps";
import { topics } from "../../lib/problems";
import AppShell from "../components/AppShell";

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

const TASK_COLUMNS = "id, day_number, position, title, kind, done, module, link";
const WARN_HOURS = 6;

const allProblemIds = new Set(topics.flatMap((t) => t.problems.map((p) => p.id)));
const totalProblems = allProblemIds.size;

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

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="glass px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 font-display text-xl font-semibold">{value}</dd>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
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
  const [solved, setSolved] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
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

      const [profileRes, roadmapRes, solvedRes, requestRes, messageRes, doneRes] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("full_name, college")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("roadmaps")
            .select("id, skill, level, hours_per_day")
            .eq("user_id", user.id),
          supabase
            .from("problem_progress")
            .select("problem_id")
            .eq("user_id", user.id)
            .eq("status", "solved"),
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
        ]);

      if (!active) return;

      setFullName(profileRes.data?.full_name?.trim() ?? "");
      setCollege(profileRes.data?.college ?? null);
      setSolved(
        (solvedRes.data ?? []).filter((r) => allProblemIds.has(r.problem_id)).length
      );
      setPendingRequests(requestRes.count ?? 0);
      setUnreadMessages(messageRes.count ?? 0);

      const map: Record<string, string> = {};
      (doneRes.data ?? []).forEach((t) => {
        if (t.completed_at) map[t.id] = t.completed_at;
      });
      setCompletions(map);

      let firstError =
        roadmapRes.error?.message ??
        solvedRes.error?.message ??
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

  const teammateNote =
    pendingRequests > 0
      ? `${pendingRequests} request${pendingRequests > 1 ? "s" : ""} waiting for you`
      : unreadMessages > 0
        ? `${unreadMessages} unread message${unreadMessages > 1 ? "s" : ""}`
        : "Find a study partner or a project teammate.";

  return (
    <AppShell userName={displayName}>
      <h1 className="text-3xl font-semibold sm:text-4xl">
        {greeting(now)}, {firstName}
      </h1>
      <p className="mt-2 text-muted">
        {active.length > 0
          ? `Here is what is on your plate today across ${active.length} roadmap${active.length > 1 ? "s" : ""}.`
          : "Set up a study plan in about a minute."}
      </p>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-control border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      {/* Quick numbers */}
      <dl className="mt-8 grid grid-cols-3 gap-3">
        <Stat
          label="Streak"
          value={`${stats.streak} day${stats.streak === 1 ? "" : "s"}`}
          hint={stats.streak === 0 ? "Finish a task to start one" : "Keep it going"}
        />
        <Stat
          label="Roadmaps"
          value={cards.length ? `${stats.percent}%` : "Not started"}
          hint={cards.length ? `${active.length} in progress` : undefined}
        />
        <Stat label="Practice" value={`${solved} of ${totalProblems}`} hint="questions solved" />
      </dl>

      {totalHours > WARN_HOURS && (
        <p className="mt-4 rounded-control border border-border bg-surface px-4 py-3 text-sm text-muted">
          You are planning {totalHours} hours of study a day. Remember to take breaks.
        </p>
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

      {active.map((card) => {
        const name = getDomain(card.skill)?.name ?? "Your roadmap";
        const pct = card.total ? Math.round((card.done / card.total) * 100) : 0;
        const dayComplete = card.tasks.length > 0 && card.tasks.every((t) => t.done);

        return (
          <section
            key={card.id}
            aria-label={`Today's plan: ${name}`}
            className="glass mt-6 p-6 sm:p-8"
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
                    <span className="rounded-full border border-border bg-surface-strong px-2.5 py-0.5 text-xs capitalize text-muted">
                      {task.kind}
                    </span>
                  </label>
                  {task.link && (
                    <Link
                      href={task.link}
                      className="shrink-0 rounded-control border border-border bg-surface px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-surface-strong"
                    >
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

      {!college && (
        <section className="mt-4 flex flex-col items-start justify-between gap-3 rounded-panel border border-border bg-surface p-5 sm:flex-row sm:items-center">
          <p className="text-sm">
            <span className="font-medium">Add your college.</span>{" "}
            <span className="text-muted">
              It helps us match you with classmates on the Teammates page.
            </span>
          </p>
          <Link
            href="/profile"
            className="shrink-0 text-sm font-medium text-accent hover:underline"
          >
            Update profile
          </Link>
        </section>
      )}

      {/* Shortcuts */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Keep going</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Link
            href="/practice"
            className="rounded-panel border border-border bg-surface p-5 transition-colors hover:bg-surface-strong"
          >
            <h3 className="font-semibold">Practice</h3>
            <p className="mt-2 text-sm text-muted">
              {solved === 0
                ? "Start with the first topic and solve your first question."
                : `${solved} of ${totalProblems} solved. Pick up where you left off.`}
            </p>
          </Link>

          <Link
            href="/partner"
            className="rounded-panel border border-border bg-surface p-5 transition-colors hover:bg-surface-strong"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">Teammates</h3>
              {pendingRequests + unreadMessages > 0 && (
                <span className="rounded-full bg-streak px-2 py-0.5 text-xs font-semibold text-background">
                  {pendingRequests + unreadMessages}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-muted">{teammateNote}</p>
          </Link>

          <div className="rounded-panel border border-border bg-surface p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">AI Teacher</h3>
              <span className="rounded-full border border-border bg-surface-strong px-2.5 py-0.5 text-xs font-medium text-muted">
                Coming soon
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">
              Ask a doubt in plain language and get a step-by-step explanation.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}