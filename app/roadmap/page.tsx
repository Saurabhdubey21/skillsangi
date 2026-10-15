"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import {
  MAX_DAYS,
  MAX_HOURS,
  MIN_DAYS,
  basicsTopicCount,
  buildPlan,
  countTopics,
  domains,
  getDomain,
  languageChoices,
  levelOptions,
  resolveLanguage,
  resolveStack,
  type Level,
} from "../../lib/roadmaps";
import AppShell from "../components/AppShell";

type Config = { language?: string; stack?: string } | null;

type Roadmap = {
  id: string;
  skill: string;
  level: string;
  hours_per_day: number;
  duration_days: number | null;
  config: Config;
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

const ROADMAP_COLUMNS = "id, skill, level, hours_per_day, duration_days, config";
const TASK_COLUMNS = "id, day_number, position, title, kind, done, module, link";
const CHUNK = 400; // tasks saved per request

const controlClass =
  "w-full rounded-control border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/30";

const durationChoices = [
  { id: "30", label: "30 days", note: "About a month" },
  { id: "60", label: "60 days", note: "Two months" },
  { id: "90", label: "90 days", note: "Three months" },
  { id: "180", label: "6 months", note: "Steady pace" },
  { id: "365", label: "1 year", note: "In depth" },
  { id: "custom", label: "Custom", note: `${MIN_DAYS} to ${MAX_DAYS} days` },
];

const groups = Array.from(new Set(domains.map((d) => d.group)));

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

  // What the student picks on the form
  const [domainId, setDomainId] = useState<string | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [languageChoice, setLanguageChoice] = useState("");
  const [stackChoice, setStackChoice] = useState("");
  const [durationChoice, setDurationChoice] = useState("180");
  const [customDays, setCustomDays] = useState("200");
  const [hours, setHours] = useState(2);
  const [creating, setCreating] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);

  const domain = domainId ? getDomain(domainId) : undefined;
  const stack = domain ? resolveStack(domain, stackChoice) : undefined;
  const languages = domain && level ? languageChoices(domain, level) : [];
  const language = domain && level ? resolveLanguage(domain, level, languageChoice) : undefined;
  const languageId = language?.id;

  const customNumber = Math.round(Number(customDays));
  const customValid =
    customDays.trim() !== "" &&
    Number.isFinite(customNumber) &&
    customNumber >= MIN_DAYS &&
    customNumber <= MAX_DAYS;
  const duration =
    durationChoice === "custom" ? (customValid ? customNumber : null) : Number(durationChoice);

  const plan = useMemo(() => {
    if (!domainId || !level || !duration) return null;
    return buildPlan({ domainId, level, hours, duration, language: languageId, stack });
  }, [domainId, level, hours, duration, languageId, stack]);

  // Progress per module in the saved roadmap
  const moduleRows = useMemo(() => {
    const map = new Map<string, { name: string; total: number; done: number }>();
    tasks.forEach((t) => {
      if (!t.module) return;
      const row = map.get(t.module) ?? { name: t.module, total: 0, done: 0 };
      row.total += 1;
      if (t.done) row.done += 1;
      map.set(t.module, row);
    });
    return Array.from(map.values());
  }, [tasks]);

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
        .select(ROADMAP_COLUMNS)
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
          .select(TASK_COLUMNS)
          .eq("roadmap_id", rm.id)
          .order("day_number", { ascending: true })
          .limit(2000);

        if (taskError) {
          setError("Could not load your tasks: " + taskError.message);
        } else {
          setRoadmap(rm as Roadmap);
          setTasks(sortTasks((list ?? []) as Task[]));
        }
      }
      setLoading(false);
    }

    load();
  }, [router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!plan || !plan.feasible || !domainId || !level || !duration) return;

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

      const config: { language?: string; stack?: string } = {};
      if (languageId) config.language = languageId;
      if (stack) config.stack = stack;

      const { data: rm, error: rmError } = await supabase
        .from("roadmaps")
        .insert({
          user_id: user.id,
          skill: domainId,
          level,
          hours_per_day: hours,
          duration_days: duration,
          config,
        })
        .select(ROADMAP_COLUMNS)
        .single();

      if (rmError || !rm) {
        throw new Error(rmError?.message ?? "Could not create your roadmap.");
      }

      const rows = plan.tasks.map((t) => ({
        ...t,
        roadmap_id: rm.id,
        user_id: user.id,
      }));

      const saved: Task[] = [];
      for (let i = 0; i < rows.length; i += CHUNK) {
        const { data: inserted, error: taskError } = await supabase
          .from("roadmap_tasks")
          .insert(rows.slice(i, i + CHUNK))
          .select(TASK_COLUMNS);

        if (taskError || !inserted) {
          // Clean up so the student can try again
          await supabase.from("roadmaps").delete().eq("id", rm.id);
          throw new Error(taskError?.message ?? "Could not create your tasks.");
        }
        saved.push(...(inserted as Task[]));
      }

      setRoadmap(rm as Roadmap);
      setTasks(sortTasks(saved));
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

  // Values for the saved plan
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

  const viewDomain = roadmap ? getDomain(roadmap.skill) : undefined;
  const skillName = viewDomain?.name ?? "Your roadmap";
  const levelLabel = roadmap?.level
    ? roadmap.level.charAt(0).toUpperCase() + roadmap.level.slice(1)
    : "";
  const viewLanguage = roadmap?.config?.language
    ? getDomain(roadmap.config.language)?.name
    : undefined;
  const viewStack = viewDomain?.stacks?.find((s) => s.id === roadmap?.config?.stack)?.name;
  const subtitle = roadmap
    ? [
        `${levelLabel} plan`,
        viewStack,
        viewLanguage ? `starts with ${viewLanguage}` : null,
        `${roadmap.hours_per_day} hour${roadmap.hours_per_day > 1 ? "s" : ""} a day`,
        `${lastDay} days`,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  const hoursLabel = `${hours} hour${hours > 1 ? "s" : ""} a day`;

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
            Choose what you want to learn, tell us your level and how long you have, and we will
            build a day-by-day plan. Every topic stays in your plan, whatever time you choose.
          </p>

          <form onSubmit={handleCreate} className="mt-8 space-y-8">
            {/* 1. Subject */}
            <fieldset>
              <legend className="mb-3 font-semibold">What do you want to learn?</legend>
              <div className="space-y-5">
                {groups.map((g) => (
                  <div key={g}>
                    <p className="mb-2 text-sm text-muted">{g}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {domains
                        .filter((d) => d.group === g)
                        .map((d) => (
                          <ChoiceCard
                            key={d.id}
                            name="domain"
                            checked={domainId === d.id}
                            onChange={() => {
                              setDomainId(d.id);
                              setLanguageChoice("");
                              setStackChoice("");
                            }}
                          >
                            <p className="font-medium">{d.name}</p>
                            <p className="mt-1 text-sm text-muted">{d.description}</p>
                          </ChoiceCard>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>

            {/* 2. Level */}
            {domain && (
              <fieldset>
                <legend className="mb-3 font-semibold">
                  What is your level in {domain.name}?
                </legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  {levelOptions.map((l) => (
                    <ChoiceCard
                      key={l.id}
                      name="level"
                      checked={level === l.id}
                      onChange={() => setLevel(l.id)}
                    >
                      <p className="font-medium">{l.name}</p>
                      <p className="mt-1 text-sm text-muted">{l.note}</p>
                      <p className="mt-2 text-xs text-muted">
                        {countTopics(domain.id, l.id, stack, languageChoice)} topics
                      </p>
                    </ChoiceCard>
                  ))}
                </div>
              </fieldset>
            )}

            {/* 3a. Language first */}
            {domain && level && languages.length > 0 && (
              <fieldset>
                <legend className="mb-1 font-semibold">Pick a language to start with</legend>
                <p className="mb-3 text-sm text-muted">
                  To learn {domain.name} from scratch you first need one programming language.
                  Choose the one you want to code in. The first part of your plan covers its
                  basics.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {languages.map((l) => (
                    <ChoiceCard
                      key={l.id}
                      name="language"
                      checked={languageId === l.id}
                      onChange={() => setLanguageChoice(l.id)}
                    >
                      <p className="font-medium">{l.name}</p>
                      <p className="mt-1 text-sm text-muted">
                        Basics: {basicsTopicCount(l)} topics
                      </p>
                    </ChoiceCard>
                  ))}
                </div>
              </fieldset>
            )}

            {/* 3b. Tech stack */}
            {domain && level && domain.stacks && (
              <fieldset>
                <legend className="mb-1 font-semibold">Choose your tech stack</legend>
                <p className="mb-3 text-sm text-muted">
                  Everyone starts with HTML, CSS and JavaScript. The stack decides the backend you
                  learn after that.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {domain.stacks.map((s) => (
                    <ChoiceCard
                      key={s.id}
                      name="stack"
                      checked={stack === s.id}
                      onChange={() => setStackChoice(s.id)}
                    >
                      <p className="font-medium">{s.name}</p>
                      <p className="mt-1 text-sm text-muted">{s.note}</p>
                    </ChoiceCard>
                  ))}
                </div>
              </fieldset>
            )}

            {domain && level && (
              <>
                {/* 4. Duration */}
                <fieldset>
                  <legend className="mb-3 font-semibold">How long do you have?</legend>
                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {durationChoices.map((d) => (
                      <ChoiceCard
                        key={d.id}
                        name="duration"
                        checked={durationChoice === d.id}
                        onChange={() => setDurationChoice(d.id)}
                      >
                        <p className="font-medium">{d.label}</p>
                        <p className="mt-1 text-sm text-muted">{d.note}</p>
                      </ChoiceCard>
                    ))}
                  </div>

                  {durationChoice === "custom" && (
                    <div className="mt-3 max-w-xs">
                      <label htmlFor="custom-days" className="mb-1.5 block text-sm font-medium">
                        Number of days
                      </label>
                      <input
                        id="custom-days"
                        type="number"
                        inputMode="numeric"
                        min={MIN_DAYS}
                        max={MAX_DAYS}
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value)}
                        className={controlClass}
                      />
                      <p className="mt-1 text-xs text-muted">
                        Between {MIN_DAYS} and {MAX_DAYS} days (one year at most).
                      </p>
                    </div>
                  )}
                </fieldset>

                {/* 5. Hours */}
                <fieldset>
                  <legend className="mb-3 font-semibold">
                    How much time can you study each day?
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-4">
                    {Array.from({ length: MAX_HOURS }, (_, i) => i + 1).map((h) => (
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

                {/* Preview */}
                <div className="glass space-y-3 px-5 py-4 text-sm text-muted" aria-live="polite">
                  {!duration && (
                    <p>
                      Enter a number of days between {MIN_DAYS} and {MAX_DAYS} to see your plan.
                    </p>
                  )}

                  {plan && plan.feasible && (
                    <>
                      <p>
                        Your plan has{" "}
                        <span className="font-semibold text-foreground">
                          {plan.tasks.length} tasks
                        </span>{" "}
                        over{" "}
                        <span className="font-semibold text-foreground">
                          {plan.days} study days
                        </span>
                        . It covers all{" "}
                        <span className="font-semibold text-foreground">{plan.topics} topics</span>
                        , nothing is skipped.
                      </p>

                      {plan.languageName && (
                        <p>
                          It starts with {plan.languageName} basics, about {plan.languageDays}{" "}
                          days, so you can write code before the main topics begin.
                        </p>
                      )}

                      {plan.tasks.length < plan.topics * 1.5 && (
                        <p>
                          Time is tight, so each topic gets one combined learn-and-practice task.
                          More days add separate practice sets and reviews.
                        </p>
                      )}

                      {plan.earlyFinish && (
                        <p>
                          You can finish in about {plan.days} days, earlier than the {duration}{" "}
                          days you chose. Use the extra time for the Practice section.
                        </p>
                      )}

                      <details>
                        <summary className="cursor-pointer font-medium text-accent">
                          See everything in your plan ({plan.modules.length} modules)
                        </summary>
                        <ul className="mt-3 space-y-1.5">
                          {plan.modules.map((m) => (
                            <li key={m.name} className="flex justify-between gap-4">
                              <span className="text-foreground">{m.name}</span>
                              <span className="shrink-0">
                                {m.topics} topics, {m.tasks} tasks
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    </>
                  )}

                  {plan && !plan.feasible && (
                    <>
                      <p className="font-medium text-foreground">
                        That is too short to cover all {plan.topics} topics at {hoursLabel}.
                      </p>
                      {plan.minDays <= MAX_DAYS ? (
                        <>
                          <p>
                            Covering everything at this pace needs at least{" "}
                            <span className="font-semibold text-foreground">
                              {plan.minDays} days
                            </span>
                            . Nothing is skipped, so the plan needs this much time. You can also
                            study more hours a day.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setDurationChoice("custom");
                              setCustomDays(String(Math.max(MIN_DAYS, plan.minDays)));
                            }}
                            className="rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent transition hover:bg-accent-hover"
                          >
                            Use {plan.minDays} days
                          </button>
                        </>
                      ) : (
                        <>
                          <p>
                            Even a full year is not enough at this pace. You need at least{" "}
                            <span className="font-semibold text-foreground">
                              {plan.minHours} hours a day
                            </span>{" "}
                            to cover everything within one year.
                          </p>
                          <button
                            type="button"
                            onClick={() => setHours(Math.min(MAX_HOURS, plan.minHours))}
                            className="rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent transition hover:bg-accent-hover"
                          >
                            Use {Math.min(MAX_HOURS, plan.minHours)} hours a day
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={creating || !plan || !plan.feasible}
                  className="w-full rounded-control bg-accent py-3 font-medium text-on-accent shadow-[0_8px_30px_-8px_var(--accent)] transition hover:bg-accent-hover disabled:opacity-60"
                >
                  {creating ? "Building your plan..." : "Create my roadmap"}
                </button>
              </>
            )}
          </form>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold sm:text-4xl">{skillName}</h1>
              <p className="mt-1 text-muted">{subtitle}</p>
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

          {moduleRows.length > 0 && (
            <details className="glass mt-4 p-5">
              <summary className="cursor-pointer text-sm font-medium">
                Progress by module ({moduleRows.length})
              </summary>
              <ul className="mt-4 space-y-3">
                {moduleRows.map((m) => {
                  const pct = Math.round((m.done / m.total) * 100);
                  return (
                    <li key={m.name}>
                      <div className="flex justify-between gap-4 text-sm">
                        <span>{m.name}</span>
                        <span className="shrink-0 text-muted">
                          {m.done} of {m.total}
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={`${m.name} progress`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={pct}
                        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-strong"
                      >
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </details>
          )}

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
                        <li key={task.id} className="flex items-center gap-2">
                          <label className="flex flex-1 cursor-pointer items-start gap-3 rounded-control p-2 transition-colors hover:bg-surface-strong">
                            <input
                              type="checkbox"
                              checked={task.done}
                              onChange={() => toggleTask(task)}
                              className="peer sr-only"
                            />
                            <CheckBox done={task.done} />
                            <span className="flex-1">
                              <span className={task.done ? "text-muted line-through" : ""}>
                                {task.title}
                              </span>
                              {task.module && (
                                <span className="mt-0.5 block text-xs text-muted">
                                  {task.module}
                                </span>
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