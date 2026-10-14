"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import AppShell from "../../components/AppShell";
import {
  topics,
  leetcodeUrl,
  type Difficulty,
  type Status,
} from "../../../lib/problems";
import { useProblemProgress } from "../../../lib/useProblemProgress";

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

export default function TopicPage() {
  const params = useParams<{ topic: string }>();
  const { loading, userName, progress, error, save } = useProblemProgress();
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");
  const [coreOnly, setCoreOnly] = useState(false);

  if (loading) {
    return (
      <div
        role="status"
        className="backdrop-wash flex min-h-screen items-center justify-center text-muted"
      >
        Loading questions...
      </div>
    );
  }

  const topic = topics.find((t) => t.id === params.topic);

  if (!topic) {
    return (
      <AppShell userName={userName}>
        <h1 className="text-3xl font-semibold">Topic not found</h1>
        <p className="mt-2 text-muted">That topic does not exist.</p>
        <Link href="/practice" className="mt-4 inline-block text-accent hover:underline">
          Back to practice
        </Link>
      </AppShell>
    );
  }

  const visible = topic.problems.filter(
    (p) =>
      (difficulty === "all" || p.difficulty === difficulty) &&
      (!coreOnly || p.core)
  );
  const solved = topic.problems.filter((p) => progress[p.id]?.status === "solved").length;

  return (
    <AppShell userName={userName}>
      <Link href="/practice" className="text-sm text-muted hover:text-foreground">
        Back to practice
      </Link>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{topic.name}</h1>
      <p className="mt-2 text-muted">
        {solved} of {topic.problems.length} solved. {topic.description}
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
        <label className="ml-2 flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={coreOnly}
            onChange={(e) => setCoreOnly(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          Must-do only
        </label>
      </div>

      <ul className="glass mt-6 divide-y divide-border overflow-hidden">
        {visible.length === 0 && (
          <li className="p-6 text-center text-muted">No questions match these filters.</li>
        )}
        {visible.map((p) => {
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
                  {p.core && <span className="text-muted">Must-do</span>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {p.leetcode && (
                  <a
                    href={leetcodeUrl(p.leetcode)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    LeetCode
                    <span className="sr-only"> (opens in a new tab) for {p.title}</span>
                  </a>
                )}
                {p.gfg && (
                  <a
                    href={p.gfg}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    GFG
                    <span className="sr-only"> (opens in a new tab) for {p.title}</span>
                  </a>
                )}
              </div>

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

      <p className="mt-4 text-sm text-muted">
        Links open the problem on the original site. Mark your own progress here,
        because we cannot see your account on those sites.
      </p>
    </AppShell>
  );
}