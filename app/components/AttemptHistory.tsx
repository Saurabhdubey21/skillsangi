"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import type { Language } from "./CodeEditor";

type Attempt = {
  id: string;
  language: string;
  code: string;
  created_at: string;
};

const labels: Record<string, string> = {
  c: "C",
  cpp: "C++",
  java: "Java",
  python: "Python",
  javascript: "JavaScript",
};

function isLanguage(value: string): value is Language {
  return value in labels;
}

export default function AttemptHistory({
  questionId,
  refreshKey,
  onLoad,
  onDeleted,
}: {
  questionId: string | null;
  refreshKey: number;
  onLoad: (attempt: { language: Language; code: string; created_at: string }) => void;
  // Called with the id of an attempt after it was really deleted
  onDeleted?: (id: string) => void;
}) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAttempts = useCallback(async () => {
    const supabase = createClient();
    let query = supabase
      .from("code_attempts")
      .select("id, language, code, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    query = questionId === null ? query.is("question_id", null) : query.eq("question_id", questionId);

    const { data, error: loadError } = await query;
    if (loadError) {
      setError("Could not load your earlier attempts.");
    } else {
      setError("");
      setAttempts(data ?? []);
    }
    setLoading(false);
  }, [questionId]);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts, refreshKey]);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this attempt? This cannot be undone.")) return;
    setError("");

    const supabase = createClient();
    // Ask for the deleted row back, so we know a row was really removed
    const { data, error: deleteError } = await supabase
      .from("code_attempts")
      .delete()
      .eq("id", id)
      .select("id");

    if (deleteError || !data || data.length === 0) {
      setError("Could not delete that attempt. Please refresh the page and try again.");
      fetchAttempts();
      return;
    }

    setAttempts((list) => list.filter((a) => a.id !== id));
    onDeleted?.(id);
  }

  return (
    <section aria-label="Earlier attempts" className="glass mt-6 rounded-panel p-4 sm:p-6">
      <h2 className="text-lg font-semibold">Earlier attempts</h2>

      {loading && (
        <p role="status" className="mt-3 text-sm text-muted">
          Loading...
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      {!loading && !error && attempts.length === 0 && (
        <p className="mt-3 text-sm text-muted">
          No saved attempts yet. Write some code and click Save attempt.
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {attempts.map((a) => {
          const firstLine = a.code.split("\n").find((l) => l.trim() !== "") ?? "";
          return (
            <li
              key={a.id}
              className="flex flex-wrap items-center gap-3 rounded-control border border-border bg-surface px-3 py-2"
            >
              <div className="min-w-0 flex-1 basis-48">
                <p className="text-sm font-medium">
                  {labels[a.language] ?? a.language}
                  <span className="ml-2 font-normal text-muted">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </p>
                <p className="mt-0.5 truncate font-mono text-xs text-muted">{firstLine}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  isLanguage(a.language) &&
                  onLoad({ language: a.language, code: a.code, created_at: a.created_at })
                }
                className="rounded-control border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-strong"
              >
                Load
              </button>
              <button
                type="button"
                onClick={() => handleDelete(a.id)}
                className="rounded-control px-3 py-1.5 text-sm text-danger transition-colors hover:bg-danger/10"
              >
                Delete
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}