"use client";

import { useState } from "react";

const MAX_REVIEW_CODE_CHARS = 8000;
const MAX_PROBLEM_CHARS = 3000;

// Shows the AI text, with code blocks drawn as code boxes (no extra library)
function ReviewText({ text }: { text: string }) {
  const parts = text.split("```");
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          const code = part.replace(/^[^\n]*\n/, "");
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-control border border-border bg-surface-strong p-3 font-mono text-xs"
            >
              <code>{code.trimEnd()}</code>
            </pre>
          );
        }
        return part.trim() ? (
          <p key={i} className="whitespace-pre-wrap">
            {part.trim()}
          </p>
        ) : null;
      })}
    </div>
  );
}

export default function ReviewPanel({
  code,
  ensureSaved,
  deletedIds = [],
}: {
  code: string;
  ensureSaved: () => Promise<string | null>;
  // Ids of attempts the student has deleted. A review of one of these is hidden.
  deletedIds?: string[];
}) {
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState<"" | "review" | "fix">("");
  const [result, setResult] = useState<{
    text: string;
    kind: "review" | "fix";
    code: string;
    attemptId: string;
  } | null>(null);
  const [reviewed, setReviewed] = useState<{ id: string; code: string } | null>(null);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState("");

  async function run(fullFix: boolean) {
    setError("");
    if (!code.trim()) {
      setError("Write some code first.");
      return;
    }
    if (code.length > MAX_REVIEW_CODE_CHARS) {
      setError(`This code is too long to review. Keep it under ${MAX_REVIEW_CODE_CHARS} characters.`);
      return;
    }

    setBusy(fullFix ? "fix" : "review");
    try {
      const id = fullFix && reviewed ? reviewed.id : await ensureSaved();
      if (!id) {
        setError("Could not save your code first. Please try again.");
        return;
      }

      const res = await fetch("/api/teacher/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: id,
          fullFix,
          problem: problem.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setResult({ text: data.review, kind: fullFix ? "fix" : "review", code, attemptId: id });
      if (!fullFix) setReviewed({ id, code });
      setUsage(`Messages today: ${data.usedToday}/${data.dailyLimit}`);
    } catch {
      setError("Could not reach the server. Check your internet and try again.");
    } finally {
      setBusy("");
    }
  }

  // If the attempt this review belongs to was deleted, act as if there is no review
  const visibleResult =
    result !== null && !deletedIds.includes(result.attemptId) ? result : null;
  const reviewedStillExists = reviewed !== null && !deletedIds.includes(reviewed.id);

  const codeChanged = visibleResult !== null && visibleResult.code !== code;
  const canAskFullFix =
    visibleResult?.kind === "review" && reviewedStillExists && reviewed.code === code;

  return (
    <section aria-label="AI review" className="glass mt-6 rounded-panel p-4 sm:p-6">
      <h2 className="text-lg font-semibold">AI review</h2>
      <p className="mt-1 text-sm text-muted">
        The AI reads your code and gives hints. It cannot run your code.
      </p>

      <label htmlFor="problem-text" className="mt-4 block text-sm font-medium">
        Paste the problem here (optional)
      </label>
      <textarea
        id="problem-text"
        value={problem}
        onChange={(e) => setProblem(e.target.value)}
        maxLength={MAX_PROBLEM_CHARS}
        rows={3}
        placeholder="Without the problem, the AI can only check your code itself, not whether it solves the problem."
        className="mt-1.5 w-full resize-y rounded-control border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/30"
      />
      <p className="mt-1 text-xs text-muted">
        {problem.length}/{MAX_PROBLEM_CHARS}. Your code and this text are sent to the AI companies
        described on the Privacy page.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => run(false)}
          disabled={busy !== ""}
          className="rounded-control bg-accent px-5 py-2.5 font-medium text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
        >
          {busy === "review" ? "Reviewing..." : "Review my code"}
        </button>

        {canAskFullFix && (
          <button
            type="button"
            onClick={() => run(true)}
            disabled={busy !== ""}
            className="rounded-control border border-border bg-surface px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground disabled:opacity-60"
          >
            {busy === "fix" ? "Writing the fix..." : "Show me the full fix"}
          </button>
        )}

        {usage && <span className="text-xs text-muted">{usage}</span>}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}

      {visibleResult && (
        <div className="mt-5 rounded-control border border-border bg-surface p-4" aria-live="polite">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
            {visibleResult.kind === "fix" ? "Full fix" : "Review"} · AI-generated, may contain errors
          </p>
          {codeChanged && (
            <p className="mb-3 text-xs text-muted">
              You changed your code after this. Click Review my code again for a fresh review.
            </p>
          )}
          <ReviewText text={visibleResult.text} />
        </div>
      )}
    </section>
  );
}