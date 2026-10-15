"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { skills } from "../../lib/roadmaps";
import { topics } from "../../lib/problems";
import AppShell from "../components/AppShell";

type Roadmap = {
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
  completed_at: string | null;
};

const allProblemIds = new Set(topics.flatMap((t) => t.problems.map((p) => p.id)));
const totalProblems = allProblemIds.size;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function localDay(d: Date) {
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD in the student's own timezone
}

// Consecutive days with at least one finished task. Today does not break the streak until it ends.
function computeStreak(tasks: Task[]) {
  const days = new Set(
    tasks
      .filter((t) => t.done && t.completed_at)
      .map((t) => localDay(new Date(t.completed_at as string)))
  );
  const cursor = new Date();
  if (!days.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDay(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function sortTasks(list: Task[]) {
  return [...list].sort(
    (a, b) => a.day_number - b.day_number || a.position - b.position
  );
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
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dayShown, setDayShown] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [error, setError] = useState("");

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

      const [profileRes, roadmapRes, solvedRes, requestRes, messageRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, college")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("roadmaps")
          .select("id, skill, level, hours_per_day")
          .eq("user_id", user.id)
          .maybeSingle(),
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
      ]);

      if (!active) return;

      setFullName(profileRes.data?.full_name?.trim() ?? "");
      setCollege(profileRes.data?.college ?? null);
      setSolved(
        (solvedRes.data ?? []).filter((r) => allProblemIds.has(r.problem_id)).length
      );
      setPendingRequests(requestRes.count ?? 0);
      setUnreadMessages(messageRes.count ?? 0);

      const firstError =
        roadmapRes.error?.message ??
        solvedRes.error?.message ??
        requestRes.error?.message ??
        messageRes.error?.message;
      if (firstError) setError("Some details could not be loaded: " + firstError);

      const rm = roadmapRes.data as Roadmap | null;
      if (rm) {
        const { data: list, error: taskError } = await supabase
          .from("roadmap_tasks")
          .select("id, day_number, position, title, kind, done, completed_at")
          .eq("roadmap_id", rm.id);

        if (!active) return;

        if (taskError) {
          setError("Could not load your tasks: " + taskError.message);
        } else {
          const sorted = sortTasks((list ?? []) as Task[]);
          const firstUndone = sorted.find((t) => !t.done);
          setRoadmap(rm);
          setTasks(sorted);
          setDayShown(firstUndone ? firstUndone.day_number : null);
        }
      }
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [router]);

  async function toggleTask(task: Task) {
    const next = !task.done;
    const stamp = next ? new Date().toISOString() : null;
    setError("");
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done: next, completed_at: stamp } : t))
    );

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("roadmap_tasks")
      .update({ done: next, completed_at: stamp })
      .eq("id", task.id);

    if (updateError) {
      // Put the checkbox back and tell the student
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, done: task.done, completed_at: task.completed_at } : t
        )
      );
      setError("Could not save that change: " + updateError.message);
    }
  }

  const stats = useMemo(() => {
    const total = tasks.length;
    const doneCount = tasks.filter((t) => t.done).length;
    return {
      total,
      doneCount,
      percent: total ? Math.round((doneCount / total) * 100) : 0,
      lastDay: total ? Math.max(...tasks.map((t) => t.day_number)) : 0,
      streak: computeStreak(tasks),
    };
  }, [tasks]);

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

  const todayTasks = tasks.filter((t) => t.day_number === dayShown);
  const dayComplete = todayTasks.length > 0 && todayTasks.every((t) => t.done);
  const roadmapComplete = stats.total > 0 && stats.doneCount === stats.total;
  const skillName = skills.find((s) => s.id === roadmap?.skill)?.name ?? "Your roadmap";

  const teammateNote =
    pendingRequests > 0
      ? `${pendingRequests} request${pendingRequests > 1 ? "s" : ""} waiting for you`
      : unreadMessages > 0
        ? `${unreadMessages} unread message${unreadMessages > 1 ? "s" : ""}`
        : "Find a study partner or a project teammate.";

  return (
    <AppShell userName={displayName}>
      <h1 className="text-3xl font-semibold sm:text-4xl">
        {greeting()}, {firstName}
      </h1>
      <p className="mt-2 text-muted">
        {roadmap
          ? "Here is what is on your plate today."
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
          label="Roadmap"
          value={roadmap ? `${stats.percent}%` : "Not started"}
          hint={roadmap ? `${stats.doneCount} of ${stats.total} tasks` : undefined}
        />
        <Stat label="Practice" value={`${solved} of ${totalProblems}`} hint="questions solved" />
      </dl>

      {/* Today's plan */}
      <section aria-label="Today's plan" className="glass mt-6 p-6 sm:p-8">
        {!roadmap ? (
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold">You do not have a plan yet</h2>
              <p className="mt-2 max-w-md text-muted">
                Pick a goal and how much time you have, and we will build a day-by-day roadmap.
              </p>
            </div>
            <Link href="/roadmap" className={primaryLink}>
              Build my roadmap
            </Link>
          </div>
        ) : roadmapComplete ? (
          <div>
            <h2 className="text-xl font-semibold">Roadmap complete</h2>
            <p className="mt-2 text-muted">
              You finished every task in {skillName}. Start a new roadmap to keep going.
            </p>
            <Link href="/roadmap" className={`${primaryLink} mt-4`}>
              Open roadmap
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Today: Day {dayShown}</h2>
                <p className="mt-1 text-sm text-muted">
                  {skillName}, day {dayShown} of {stats.lastDay}
                </p>
              </div>
              <Link
                href="/roadmap"
                className="text-sm font-medium text-accent hover:underline"
              >
                Open full roadmap
              </Link>
            </div>

            <div
              role="progressbar"
              aria-label="Overall roadmap progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={stats.percent}
              className="mt-4 h-2 overflow-hidden rounded-full bg-surface-strong"
            >
              <div
                className="h-full rounded-full bg-linear-to-r from-accent to-glow transition-[width] duration-500"
                style={{ width: `${stats.percent}%` }}
              />
            </div>

            <ul className="mt-5 space-y-2">
              {todayTasks.map((task) => (
                <li key={task.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-control p-2 transition-colors hover:bg-surface-strong">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task)}
                      className="peer sr-only"
                    />
                    <CheckBox done={task.done} />
                    <span className={`flex-1 ${task.done ? "text-muted line-through" : ""}`}>
                      {task.title}
                    </span>
                    <span className="rounded-full border border-border bg-surface-strong px-2.5 py-0.5 text-xs capitalize text-muted">
                      {task.kind}
                    </span>
                  </label>
                </li>
              ))}
            </ul>

            {dayComplete && (
              <p
                role="status"
                className="mt-4 rounded-control border border-success/40 bg-success/10 px-4 py-3 text-sm text-success"
              >
                All done for today. Nice work! Tomorrow&apos;s tasks will be waiting here.
              </p>
            )}
          </>
        )}
      </section>

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