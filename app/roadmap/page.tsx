"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { skills, generateTasks, type Level } from "../../lib/roadmaps";
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
};

function sortTasks(list: Task[]) {
  return [...list].sort(
    (a, b) => a.day_number - b.day_number || a.position - b.position
  );
}

function ChoiceCard({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block cursor-pointer">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <div className="h-full rounded-panel border border-border bg-surface p-4 transition-colors hover:bg-surface-strong peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:ring-2 peer-checked:ring-accent/30 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
        {children}
      </div>
    </label>
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

export default function RoadmapPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");

  const [skill, setSkill] = useState("dsa");
  const [level, setLevel] = useState<Level>("beginner");
  const [hours, setHours] = useState(1);
  const [creating, setCreating] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      setUserName(profile?.full_name?.trim() || (user.email ?? "").split("@")[0]);

      const { data: rm, error: rmError } = await supabase
        .from("roadmaps")
        .select("id, skill, level, hours_per_day")
        .eq("user_id", user.id)
        .maybeSingle();

      if (rmError) {
        setError("Could not load your roadmap: " + rmError.message);
        setLoading(false);
        return;
      }

      if (rm) {
        const { data: list, error: taskError } = await supabase
          .from("roadmap_tasks")
          .select("id, day_number, position, title, kind, done")
          .eq("roadmap_id", rm.id);

        if (taskError) {
          setError("Could not load your tasks: " + taskError.message);
        } else {
          setRoadmap(rm);
          setTasks(sortTasks(list ?? []));
        }
      }
      setLoading(false);
    }

    load();
  }, [router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: rm, error: rmError } = await supabase
        .from("roadmaps")
        .insert({ user_id: user.id, skill, level, hours_per_day: hours })
        .select("id, skill, level, hours_per_day")
        .single();

      if (rmError || !rm) {
        throw new Error(rmError?.message ?? "Could not create your roadmap.");
      }

      const rows = generateTasks(skill, level, hours).map((t) => ({
        ...t,
        roadmap_id: rm.id,
        user_id: user.id,
      }));

      const { data: inserted, error: taskError } = await supabase
        .from("roadmap_tasks")
        .insert(rows)
        .select("id, day_number, position, title, kind, done");

      if (taskError || !inserted) {
        // Clean up so the student can try again
        await supabase.from("roadmaps").delete().eq("id", rm.id);
        throw new Error(taskError?.message ?? "Could not create your tasks.");
      }

      setRoadmap(rm);
      setTasks(sortTasks(inserted));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setCreating(false);
    }
  }

  async function toggleTask(task: Task) {
    const next = !task.done;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done: next } : t))
    );

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("roadmap_tasks")
      .update({
        done: next,
        completed_at: next ? new Date().toISOString() : null,
      })
      .eq("id", task.id);

    if (updateError) {
      // Put the checkbox back and tell the student
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, done: task.done } : t))
      );
      setError("Could not save that change: " + updateError.message);
    }
  }

  async function handleRestart() {
    if (!roadmap) return;

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("roadmaps")
      .delete()
      .eq("id", roadmap.id);

    setConfirmRestart(false);

    if (deleteError) {
      setError("Could not delete your roadmap: " + deleteError.message);
      return;
    }
    setRoadmap(null);
    setTasks([]);
    setError("");
  }

  if (loading) {
    return (
      <div
        role="status"
        className="backdrop-wash flex min-h-screen items-center justify-center text-muted"
      >
        Loading your roadmap...
      </div>
    );
  }

  // Values for the plan view
  const total = tasks.length;
  const doneCount = tasks.filter((t) => t.done).length;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;
  const undone = tasks.filter((t) => !t.done);
  const currentDay = undone.length
    ? Math.min(...undone.map((t) => t.day_number))
    : null;
  const todayTasks = tasks.filter((t) => t.day_number === currentDay);
  const lastDay = total ? Math.max(...tasks.map((t) => t.day_number)) : 0;
  const upcoming =
    currentDay === null
      ? []
      : Array.from({ length: 5 }, (_, i) => currentDay + 1 + i).filter(
          (d) => d <= lastDay
        );
  const daysDone = currentDay === null ? lastDay : Math.max(currentDay - 1, 0);
  const skillName = skills.find((s) => s.id === roadmap?.skill)?.name ?? "";

  // Preview shown on the form
  const previewCount = generateTasks(skill, level, hours).length;
  const previewDays = Math.ceil(previewCount / hours);

  return (
    <AppShell userName={userName}>
      {error && (
        <p
          role="alert"
          className="mb-6 rounded-control border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      {!roadmap ? (
        <>
          <h1 className="text-3xl font-semibold sm:text-4xl">Build your roadmap</h1>
          <p className="mt-2 max-w-xl text-muted">
            Pick a goal and how much time you have. We will turn it into a
            day-by-day plan.
          </p>

          <form onSubmit={handleCreate} className="mt-8 space-y-8">
            <fieldset>
              <legend className="mb-3 font-semibold">What do you want to learn?</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {skills.map((s) => (
                  <ChoiceCard
                    key={s.id}
                    name="skill"
                    checked={skill === s.id}
                    onChange={() => setSkill(s.id)}
                  >
                    <p className="font-medium">{s.name}</p>
                    <p className="mt-1 text-sm text-muted">{s.description}</p>
                  </ChoiceCard>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-3 font-semibold">Where are you now?</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <ChoiceCard
                  name="level"
                  checked={level === "beginner"}
                  onChange={() => setLevel("beginner")}
                >
                  <p className="font-medium">Beginner</p>
                  <p className="mt-1 text-sm text-muted">Start from the basics</p>
                </ChoiceCard>
                <ChoiceCard
                  name="level"
                  checked={level === "intermediate"}
                  onChange={() => setLevel("intermediate")}
                >
                  <p className="font-medium">Intermediate</p>
                  <p className="mt-1 text-sm text-muted">I know the basics already</p>
                </ChoiceCard>
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-3 font-semibold">
                How much time can you study each day?
              </legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {[1, 2, 3].map((h) => (
                  <ChoiceCard
                    key={h}
                    name="hours"
                    checked={hours === h}
                    onChange={() => setHours(h)}
                  >
                    <p className="font-medium">{h === 1 ? "1 hour" : `${h} hours`}</p>
                    <p className="mt-1 text-sm text-muted">
                      {h} task{h > 1 ? "s" : ""} a day
                    </p>
                  </ChoiceCard>
                ))}
              </div>
            </fieldset>

            <div className="glass px-5 py-4 text-sm text-muted">
              Your plan will have{" "}
              <span className="font-semibold text-foreground">{previewCount} tasks</span>{" "}
              over about{" "}
              <span className="font-semibold text-foreground">{previewDays} study days</span>.
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-control bg-accent py-3 font-medium text-on-accent shadow-[0_8px_30px_-8px_var(--accent)] transition hover:bg-accent-hover disabled:opacity-60"
            >
              {creating ? "Building your plan..." : "Create my roadmap"}
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold sm:text-4xl">{skillName}</h1>
              <p className="mt-1 text-muted">
                {roadmap.level === "beginner" ? "Beginner" : "Intermediate"} plan,{" "}
                {roadmap.hours_per_day} hour{roadmap.hours_per_day > 1 ? "s" : ""} a day
              </p>
            </div>
            {!confirmRestart && (
              <button
                type="button"
                onClick={() => setConfirmRestart(true)}
                className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Start over
              </button>
            )}
          </div>

          {confirmRestart && (
            <div
              role="alertdialog"
              aria-label="Confirm start over"
              className="mt-4 flex flex-col items-start justify-between gap-3 rounded-panel border border-danger/40 bg-danger/10 p-4 sm:flex-row sm:items-center"
            >
              <p className="text-sm">
                <span className="font-medium">Delete this plan?</span>{" "}
                <span className="text-muted">
                  Your tasks and progress will be removed. This cannot be undone.
                </span>
              </p>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmRestart(false)}
                  className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium"
                >
                  Keep plan
                </button>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="rounded-control bg-danger px-4 py-2 text-sm font-medium text-background"
                >
                  Delete plan
                </button>
              </div>
            </div>
          )}

          <section className="glass mt-6 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall progress</span>
              <span className="text-muted">
                {doneCount} of {total} tasks, {percent}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Overall progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="mt-3 h-2 overflow-hidden rounded-full bg-surface-strong"
            >
              <div
                className="h-full rounded-full bg-linear-to-r from-accent to-glow transition-[width] duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </section>

          {currentDay === null ? (
            <section className="glass mt-8 p-8 text-center">
              <h2 className="text-xl font-semibold">Roadmap complete</h2>
              <p className="mt-2 text-muted">
                You finished every task. Start over to build a new roadmap and
                keep going.
              </p>
            </section>
          ) : (
            <section className="mt-10" aria-label="Your path">
              <h2 className="text-xl font-semibold">
                Day {currentDay} of {lastDay}
              </h2>
              {daysDone > 0 && (
                <p className="mt-1 text-sm text-muted">
                  {daysDone} day{daysDone > 1 ? "s" : ""} completed so far.
                </p>
              )}

              <ol className="relative mt-6 space-y-8 border-l border-border pl-8">
                {/* Today */}
                <li className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[41px] top-4 h-4 w-4 rounded-full bg-glow ring-4 ring-glow/25"
                  />
                  <div className="glass p-5">
                    <p className="text-sm font-medium text-glow">Today, Day {currentDay}</p>
                    <ul className="mt-3 space-y-2">
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
                            <span
                              className={`flex-1 ${task.done ? "text-muted line-through" : ""}`}
                            >
                              {task.title}
                            </span>
                            <span className="rounded-full border border-border bg-surface-strong px-2.5 py-0.5 text-xs capitalize text-muted">
                              {task.kind}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>

                {/* Coming up */}
                {upcoming.map((day) => (
                  <li key={day} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[39px] top-1 h-3 w-3 rounded-full border-2 border-muted bg-background"
                    />
                    <p className="text-sm font-medium text-muted">Day {day}</p>
                    <ul className="mt-1.5 space-y-1 text-sm">
                      {tasks
                        .filter((t) => t.day_number === day)
                        .map((t) => (
                          <li key={t.id}>{t.title}</li>
                        ))}
                    </ul>
                  </li>
                ))}
              </ol>

              {lastDay > currentDay + upcoming.length && (
                <p className="mt-6 pl-8 text-sm text-muted">
                  and {lastDay - currentDay - upcoming.length} more day
                  {lastDay - currentDay - upcoming.length > 1 ? "s" : ""} after that.
                </p>
              )}
            </section>
          )}
        </>
      )}
    </AppShell>
  );
}