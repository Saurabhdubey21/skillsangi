"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { languageResources } from "../../lib/problems";
import {
  getSolvedByTopic,
  getTopics,
  subjects,
  topicDescription,
  type TopicSummary,
} from "../../lib/questions";
import { useProblemProgress } from "../../lib/useProblemProgress";

const DEFAULT_SUBJECT = "dsa";

export default function PracticePage() {
  const { loading, userName, progress, error } = useProblemProgress();
  // null until we have read ?subject= from the address bar
  const [subject, setSubject] = useState<string | null>(null);
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [solvedByTopic, setSolvedByTopic] = useState<Record<string, number>>({});
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState("");

  // Read ?subject= once. Unknown or missing values fall back to DSA.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("subject");
    setSubject(subjects.find((s) => s.id === wanted)?.id ?? DEFAULT_SUBJECT);
  }, []);

  // Wait for the sign-in check in useProblemProgress before asking for data
  useEffect(() => {
    if (loading || !subject) return;
    const current = subject;
    let active = true;
    async function load() {
      const [t, s] = await Promise.all([
        getTopics(current),
        getSolvedByTopic(current),
      ]);
      if (!active) return;
      setTopics(t.data);
      setSolvedByTopic(s.data);
      setTopicsError(t.error || s.error);
      setTopicsLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [loading, subject]);

  function chooseSubject(id: string) {
    if (id === subject) return;
    setTopicsLoading(true);
    setTopicsError("");
    setTopics([]);
    setSolvedByTopic({});
    setSubject(id);
    const url = id === DEFAULT_SUBJECT ? "/practice" : `/practice?subject=${id}`;
    window.history.replaceState(null, "", url);
  }

  if (loading || !subject) {
    return (
      <div
        role="status"
        className="backdrop-wash flex min-h-screen items-center justify-center text-muted"
      >
        Loading practice...
      </div>
    );
  }

  const subjectName = subjects.find((s) => s.id === subject)?.name ?? subject;

  // Progress rows are keyed by question id, e.g. dsa-leetcode-two-sum or web-dev-001
  const mine = Object.entries(progress).filter(([id]) => id.startsWith(`${subject}-`));
  const total = topics.reduce((sum, t) => sum + t.total, 0);
  const solved = Object.values(solvedByTopic).reduce((sum, n) => sum + n, 0);
  const revisit = mine.filter(([, p]) => p.status === "revisit").length;
  const saved = mine.filter(([, p]) => p.bookmarked).length;

  return (
    <AppShell userName={userName}>
      <h1 className="text-3xl font-semibold sm:text-4xl">Practice</h1>
      <p className="mt-2 max-w-xl text-muted">
        Pick a subject and a topic, solve the questions on the original sites,
        and track your progress here.
      </p>

      <div
        role="group"
        aria-label="Subjects"
        className="mt-6 flex flex-wrap gap-2"
      >
        {subjects.map((s) => {
          const active = s.id === subject;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => chooseSubject(s.id)}
              aria-pressed={active}
              className={
                "max-w-full rounded-control border px-3 py-2 text-left text-sm transition-colors " +
                (active
                  ? "border-transparent bg-accent text-on-accent"
                  : "border-border bg-surface text-muted hover:bg-surface-strong")
              }
            >
              {s.name}
            </button>
          );
        })}
      </div>

      {(error || topicsError) && (
        <p
          role="alert"
          className="mt-6 rounded-control border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error || "Could not load the topics: " + topicsError}
        </p>
      )}

      <dl className="mt-8 grid grid-cols-3 gap-3">
        {[
          {
            label: "Solved",
            value: topicsLoading ? "..." : `${solved} of ${total}`,
          },
          { label: "To revisit", value: String(revisit) },
          { label: "Bookmarked", value: String(saved) },
        ].map((s) => (
          <div key={s.label} className="glass px-4 py-3">
            <dt className="text-sm text-muted">{s.label}</dt>
            <dd className="mt-1 font-display text-xl font-semibold">{s.value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-10 text-xl font-semibold">{subjectName}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {topicsLoading && (
          <p role="status" className="text-muted">
            Loading topics...
          </p>
        )}
        {!topicsLoading && !topicsError && topics.length === 0 && (
          <p className="text-muted">No topics yet.</p>
        )}
        {!topicsLoading &&
          topics.map((t) => {
            const done = solvedByTopic[t.topic_id] ?? 0;
            const pct = t.total ? Math.round((done / t.total) * 100) : 0;
            return (
              <Link
                key={t.topic_id}
                href={`/practice/${t.topic_id}`}
                className="rounded-panel border border-border bg-surface p-5 transition-colors hover:bg-surface-strong"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-semibold">{t.topic}</h3>
                  <span className="shrink-0 whitespace-nowrap text-sm text-muted">
                    {done} of {t.total}
                  </span>
                </div>
                {topicDescription[t.topic_id] && (
                  <p className="mt-1 text-sm text-muted">
                    {topicDescription[t.topic_id]}
                  </p>
                )}
                <div
                  role="progressbar"
                  aria-label={`${t.topic} progress`}
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