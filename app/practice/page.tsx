"use client";

import Link from "next/link";
import AppShell from "../components/AppShell";
import { topics, languageResources } from "../../lib/problems";
import { useProblemProgress } from "../../lib/useProblemProgress";

export default function PracticePage() {
  const { loading, userName, progress, error } = useProblemProgress();

  if (loading) {
    return (
      <div
        role="status"
        className="backdrop-wash flex min-h-screen items-center justify-center text-muted"
      >
        Loading practice...
      </div>
    );
  }

  const all = topics.flatMap((t) => t.problems);
  const solved = all.filter((p) => progress[p.id]?.status === "solved").length;
  const revisit = all.filter((p) => progress[p.id]?.status === "revisit").length;
  const saved = all.filter((p) => progress[p.id]?.bookmarked).length;

  return (
    <AppShell userName={userName}>
      <h1 className="text-3xl font-semibold sm:text-4xl">Practice</h1>
      <p className="mt-2 max-w-xl text-muted">
        Pick a topic, solve the questions on LeetCode or GeeksforGeeks, and
        track your progress here.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-control border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <dl className="mt-8 grid grid-cols-3 gap-3">
        {[
          { label: "Solved", value: `${solved} of ${all.length}` },
          { label: "To revisit", value: String(revisit) },
          { label: "Bookmarked", value: String(saved) },
        ].map((s) => (
          <div key={s.label} className="glass px-4 py-3">
            <dt className="text-sm text-muted">{s.label}</dt>
            <dd className="mt-1 font-display text-xl font-semibold">{s.value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-10 text-xl font-semibold">Topics</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {topics.map((t) => {
          const done = t.problems.filter((p) => progress[p.id]?.status === "solved").length;
          const pct = t.problems.length ? Math.round((done / t.problems.length) * 100) : 0;
          return (
            <Link
              key={t.id}
              href={`/practice/${t.id}`}
              className="rounded-panel border border-border bg-surface p-5 transition-colors hover:bg-surface-strong"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold">{t.name}</h3>
                <span className="text-sm text-muted">
                  {done} of {t.problems.length}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{t.description}</p>
              <div
                role="progressbar"
                aria-label={`${t.name} progress`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-strong"
              >
                <div
                  className="h-full rounded-full bg-linear-to-r from-accent to-glow"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>

      <h2 className="mt-12 text-xl font-semibold">New to a programming language?</h2>
      <p className="mt-1 max-w-xl text-sm text-muted">
        Practise the basics of your language here first, then come back to the
        topics above.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {languageResources.map((r) => (
          <li key={r.name}>
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full rounded-panel border border-border bg-surface p-4 transition-colors hover:bg-surface-strong"
            >
              <span className="font-medium">{r.name}</span>
              <span className="mt-1 block text-sm text-muted">{r.note}</span>
            </a>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}