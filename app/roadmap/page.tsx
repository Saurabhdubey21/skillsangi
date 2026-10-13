"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";
import { skills, generateTasks, type Level } from "../../lib/roadmaps";
import ThemePicker from "../components/ThemePicker";

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
      <div className="rounded-xl border border-slate-200 bg-white p-4 peer-checked:border-accent peer-checked:ring-2 peer-checked:ring-accent/30 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
        {children}
      </div>
    </label>
  );
}

export default function RoadmapPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");

  const [skill, setSkill] = useState("dsa");
  const [level, setLevel] = useState<Level>("beginner");
  const [hours, setHours] = useState(1);
  const [creating, setCreating] = useState(false);

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
    const ok = window.confirm(
      "Start over? Your current plan and progress will be deleted."
    );
    if (!ok) return;

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("roadmaps")
      .delete()
      .eq("id", roadmap.id);

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading...
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
  const skillName = skills.find((s) => s.id === roadmap?.skill)?.name ?? "";

  // Preview shown on the form
  const previewCount = generateTasks(skill, level, hours).length;
  const previewDays = Math.ceil(previewCount / hours);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <span className="text-xl font-bold text-accent">SkillSangi</span>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100"
          >
            Back to dashboard
          </Link>
          <ThemePicker />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16 pt-4">
        {error && (
          <p
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {!roadmap ? (
          <>
            <h1 className="text-3xl font-bold tracking-tight">Build your roadmap</h1>
            <p className="mt-2 text-slate-600">
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
                      <p className="mt-1 text-sm text-slate-500">{s.description}</p>
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
                    <p className="mt-1 text-sm text-slate-500">Start from the basics</p>
                  </ChoiceCard>
                  <ChoiceCard
                    name="level"
                    checked={level === "intermediate"}
                    onChange={() => setLevel("intermediate")}
                  >
                    <p className="font-medium">Intermediate</p>
                    <p className="mt-1 text-sm text-slate-500">I know the basics already</p>
                  </ChoiceCard>
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 font-semibold">How much time can you study each day?</legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[1, 2, 3].map((h) => (
                    <ChoiceCard
                      key={h}
                      name="hours"
                      checked={hours === h}
                      onChange={() => setHours(h)}
                    >
                      <p className="font-medium">{h === 3 ? "3 hours" : h === 1 ? "1 hour" : "2 hours"}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {h} task{h > 1 ? "s" : ""} a day
                      </p>
                    </ChoiceCard>
                  ))}
                </div>
              </fieldset>

              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                Your plan will have {previewCount} tasks over about {previewDays} study days.
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-lg bg-accent py-3 font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
              >
                {creating ? "Building your plan..." : "Create my roadmap"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{skillName}</h1>
                <p className="mt-1 text-slate-600">
                  {roadmap.level === "beginner" ? "Beginner" : "Intermediate"} plan,{" "}
                  {roadmap.hours_per_day} hour{roadmap.hours_per_day > 1 ? "s" : ""} a day
                </p>
              </div>
              <button
                type="button"
                onClick={handleRestart}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100"
              >
                Start over
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Overall progress</span>
                <span className="text-slate-500">
                  {doneCount} of {total} tasks, {percent}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {currentDay === null ? (
              <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center">
                <h2 className="text-xl font-semibold">Roadmap complete</h2>
                <p className="mt-2 text-slate-600">
                  You finished every task. Start a new roadmap to keep going.
                </p>
              </div>
            ) : (
              <>
                <h2 className="mt-8 text-xl font-semibold">
                  Today: Day {currentDay} of {lastDay}
                </h2>
                <ul className="mt-4 space-y-3">
                  {todayTasks.map((task) => (
                    <li key={task.id}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleTask(task)}
                          className="mt-0.5 h-5 w-5 shrink-0 accent-accent"
                        />
                        <span className="flex-1">
                          <span className={task.done ? "text-slate-400 line-through" : ""}>
                            {task.title}
                          </span>
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs capitalize text-slate-600">
                          {task.kind}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>

                {upcoming.length > 0 && (
                  <>
                    <h2 className="mt-10 text-xl font-semibold">Coming up</h2>
                    <div className="mt-4 space-y-4">
                      {upcoming.map((day) => (
                        <div key={day} className="rounded-xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-medium text-slate-500">Day {day}</p>
                          <ul className="mt-2 space-y-1 text-sm">
                            {tasks
                              .filter((t) => t.day_number === day)
                              .map((t) => (
                                <li key={t.id}>{t.title}</li>
                              ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}