"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import type { Difficulty, Status } from "../../../lib/problems";
import {
  getQuestions,
  platformLabel,
  topicDescription,
  type Question,
} from "../../../lib/questions";
import { useProblemProgress } from "../../../lib/useProblemProgress";

const SUBJECT = "dsa";

const statusOptions: { value: Status; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "attempted", label: "Attempted" },
  { value: "solved", label: "Solved" },
  { value: "revisit", label: "Revisit later" },
];

const difficultyStyle: Record<Difficulty, string> = {
  easy: "bg-success/15 text-success",
  medium: "bg-streak/15 text-streak",
  hard: "bg-danger/15 text-danger",
};

const linkClass =
  "rounded-control border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-strong";

export default function TopicClient() {
  const params = useParams<{ topic: string }>();
  const { loading, userName, progress, error, save } = useProblemProgress();
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");
  const [coreOnly, setCoreOnly] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState("");

  // Wait for the sign-in check in useProblemProgress before asking for data
  useEffect(() => {
    if (loading) return;
    let active = true;
    async function load() {
      setQuestionsLoading(true);
      const res = await getQuestions(SUBJECT, params.topic);
      if (!active) return;
      setQuestions(res.data);
      setQuestionsError(res.error);
      setQuestionsLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [loading, params.topic]);

  if (loading || questionsLoading) {
    return (
      <div
        role="status"
        className="backdrop-wash flex min-h-screen items-center justify-center text-muted"
      >
        Loading questions...
      </div>
    );
  }

  if (questionsError) {
    return (
      <AppShell userName={userName}>
        <h1 className="text-3xl font-semibold">Could not load questions</h1>
        <p role="alert" className="mt-2 text-danger">
          {questionsError}
        </p>
        <Link href="/practice" className="mt-4 inline-block text-accent hover:underline">
          Back to practice
        </Link>
      </AppShell>
    );
  }

  if (questions.length === 0) {
    return (
      <AppShell userName={userName}>
        <h1 className="text-3xl font-semibold">Topic not found</h1>
        <p className="mt-2 text-muted">That topic does not exist or has no questions yet.</p>
        <Link href="/practice" className="mt-4 inline-block text-accent hover:underline">
          Back to practice
        </Link>
      </AppShell>
    );
  }

  const topicName = questions[0].topic;
  const hasCore = questions.some((q) => q.core);
  const visible = questions.filter(
    (q) =>
      (difficulty === "all" || q.difficulty === difficulty) &&
      (!coreOnly || q.core)
  );
  const solved = questions.filter((q) => progress[q.id]?.status === "solved").length;

  // Group by subtopic, keeping the order the questions arrive in (by position)
  const groups: { name: string; items: Question[] }[] = [];
  for (const q of visible) {
    const last = groups[groups.length - 1];
    if (last && last.name === q.subtopic) last.items.push(q);
    else groups.push({ name: q.subtopic, items: [q] });
  }

  return (
    <AppShell userName={userName}>
      <Link href="/practice" className="text-sm text-muted hover:text-foreground">
        Back to practice
      </Link>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{topicName}</h1>
      <p className="mt-2 text-muted">
        {solved} of {questions.length} solved. {topicDescription[params.topic] ?? ""}
      </p>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-control border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(["all", "easy", "medium", "hard"] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDifficulty(d)}
            aria-pressed={difficulty === d}
            className={`rounded-full border px-4 py-1.5 text-sm capitalize transition-colors ${
              difficulty === d
                ? "border-accent bg-accent text-on-accent"
                : "border-border bg-surface text-muted hover:text-foreground"
            }`}
          >
            {d}
          </button>
        ))}
        {hasCore && (
          <label className="ml-2 flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={coreOnly}
              onChange={(e) => setCoreOnly(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            Must-do only
          </label>
        )}
      </div>

      {visible.length === 0 && (
        <p className="glass mt-6 p-6 text-center text-muted">
          No questions match these filters.
        </p>
      )}

      {groups.map((g, gi) => (
        <section key={`${g.name}-${gi}`} className="mt-6">
          {g.name && (
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
              {g.name}
            </h2>
          )}
          <ul className="glass divide-y divide-border overflow-hidden">
            {g.items.map((p) => {
              const current = progress[p.id] ?? { status: "not_started" as Status, bookmarked: false };
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1 basis-60">
                    <p className={`font-medium ${current.status === "solved" ? "text-muted line-through" : ""}`}>
                      {p.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className={`rounded-full px-2 py-0.5 capitalize ${difficultyStyle[p.difficulty]}`}>
                        {p.difficulty}
                      </span>
                      <span className="text-muted">{platformLabel[p.platform] ?? p.platform}</span>
                      {p.core && <span className="text-muted">Must-do</span>}
                    </div>
                  </div>

                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    Open
                    <span className="sr-only"> {p.title} on {platformLabel[p.platform] ?? p.platform} (opens in a new tab)</span>
                  </a>

                  <select
                    aria-label={`Status for ${p.title}`}
                    value={current.status}
                    onChange={(e) =>
                      save(p.id, { status: e.target.value as Status, bookmarked: current.bookmarked })
                    }
                    className="rounded-control border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent"
                  >
                    {statusOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => save(p.id, { status: current.status, bookmarked: !current.bookmarked })}
                    aria-pressed={current.bookmarked}
                    aria-label={`Bookmark ${p.title}`}
                    className={`rounded-control p-2 transition-colors ${
                      current.bookmarked ? "text-streak" : "text-muted hover:text-foreground"
                    }`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill={current.bookmarked ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <p className="mt-4 text-sm text-muted">
        Links open the problem on the original site. Mark your own progress here,
        because we cannot see your account on those sites.
      </p>
    </AppShell>
  );
}