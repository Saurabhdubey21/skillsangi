"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "../../../components/AppShell";
import AttemptHistory from "../../../components/AttemptHistory";
import ReviewPanel from "../../../components/ReviewPanel";
import { createClient } from "../../../../lib/supabase/client";
import { useProblemProgress } from "../../../../lib/useProblemProgress";
import { getQuestions, platformLabel, type Question } from "../../../../lib/questions";
import type { Language } from "./CodeEditor";

// The editor is loaded only on this page, so the rest of the site stays light.
const CodeEditor = dynamic(() => import("./CodeEditor"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      className="flex h-[360px] items-center justify-center rounded-control border border-border bg-surface text-muted"
    >
      Loading editor...
    </div>
  ),
});

const SUBJECT = "dsa";
const MAX_CODE_CHARS = 20000;

const languages: { value: Language; label: string }[] = [
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
];

const starters: Record<Language, string> = {
  c: "#include <stdio.h>\n\nint main() {\n    // write your code here\n    return 0;\n}\n",
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // write your code here\n    return 0;\n}\n",
  java: "public class Main {\n    public static void main(String[] args) {\n        // write your code here\n    }\n}\n",
  python: "# write your code here\n",
  javascript: "// write your code here\n",
};

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function EditorClient() {
  const params = useParams<{ topic: string; questionId: string }>();
  const questionId = safeDecode(params.questionId);
  const { loading, userName } = useProblemProgress();

  const [question, setQuestion] = useState<Question | null>(null);
  const [questionLoading, setQuestionLoading] = useState(true);
  const [questionError, setQuestionError] = useState("");

  const [language, setLanguage] = useState<Language>("cpp");
  const [code, setCode] = useState(starters.cpp);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const [lastSaved, setLastSaved] = useState<{ id: string; code: string; language: Language } | null>(null);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  // Wait for the sign-in check before asking for data
  useEffect(() => {
    if (loading) return;
    let active = true;
    async function load() {
      setQuestionLoading(true);
      const res = await getQuestions(SUBJECT, params.topic);
      if (!active) return;
      setQuestion(res.data.find((q) => q.id === questionId) ?? null);
      setQuestionError(res.error);
      setQuestionLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [loading, params.topic, questionId]);

  function handleLanguageChange(next: Language) {
    // Swap the starter code only if the student has not changed it
    if (code === starters[language] || code.trim() === "") {
      setCode(starters[next]);
    }
    setLanguage(next);
    setMessage("");
  }

  function handleLoadAttempt(attempt: { language: Language; code: string; created_at: string }) {
    setLanguage(attempt.language);
    setCode(attempt.code);
    setIsError(false);
    setMessage(`Loaded the attempt from ${new Date(attempt.created_at).toLocaleString()}.`);
  }

  // An attempt was deleted: hide its review and forget it if it was the last save
  function handleDeleted(id: string) {
    setDeletedIds((list) => [...list, id]);
    setLastSaved((saved) => (saved && saved.id === id ? null : saved));
  }

  // Saves the current code and returns the new attempt id (or null on failure)
  async function saveAttempt(): Promise<string | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("code_attempts")
      .insert({
        question_id: question?.id ?? null,
        language,
        code,
      })
      .select("id")
      .single();
    if (error || !data) return null;
    setLastSaved({ id: data.id, code, language });
    setHistoryKey((k) => k + 1);
    return data.id;
  }

  // Used by the AI review: reuse the last save if nothing changed since
  async function ensureSaved(): Promise<string | null> {
    if (lastSaved && lastSaved.code === code && lastSaved.language === language) {
      return lastSaved.id;
    }
    return saveAttempt();
  }

  async function handleSave() {
    setMessage("");
    if (!code.trim()) {
      setIsError(true);
      setMessage("Write some code first.");
      return;
    }
    if (code.length > MAX_CODE_CHARS) {
      setIsError(true);
      setMessage(`Your code is too long. Keep it under ${MAX_CODE_CHARS} characters.`);
      return;
    }

    setSaving(true);
    const id = await saveAttempt();
    setSaving(false);

    if (!id) {
      setIsError(true);
      setMessage("Could not save your attempt. Please try again.");
    } else {
      setIsError(false);
      setMessage("Attempt saved.");
    }
  }

  if (loading || questionLoading) {
    return (
      <div
        role="status"
        className="backdrop-wash flex min-h-screen items-center justify-center text-muted"
      >
        Loading...
      </div>
    );
  }

  if (questionError || !question) {
    return (
      <AppShell userName={userName}>
        <h1 className="text-3xl font-semibold">Question not found</h1>
        <p role="alert" className="mt-2 text-muted">
          {questionError || "That question does not exist."}
        </p>
        <Link
          href={`/practice/${params.topic}`}
          className="mt-4 inline-block text-accent hover:underline"
        >
          Back to the topic
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell userName={userName}>
      <Link
        href={`/practice/${params.topic}`}
        className="text-sm text-muted hover:text-foreground"
      >
        Back to {question.topic}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">{question.title}</h1>
      <p className="mt-2 text-sm text-muted">
        {question.subtopic ? `${question.subtopic} · ` : ""}
        <span className="capitalize">{question.difficulty}</span> ·{" "}
        <a
          href={question.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          Read the problem on {platformLabel[question.platform] ?? question.platform}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>

      <section className="glass mt-6 rounded-panel p-4 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label htmlFor="language" className="text-sm font-medium">
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="rounded-control border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            {languages.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-control border border-border">
          <CodeEditor value={code} onChange={setCode} language={language} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-control bg-accent px-5 py-2.5 font-medium text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save attempt"}
          </button>
          <span className="text-xs text-muted">
            {code.length}/{MAX_CODE_CHARS}
          </span>
          {message && (
            <p
              role={isError ? "alert" : "status"}
              className={`text-sm ${isError ? "text-danger" : "text-success"}`}
            >
              {message}
            </p>
          )}
        </div>

        <p className="mt-4 text-xs text-muted">
          Your code is never run. It is only saved so you can come back to it.
        </p>
      </section>

      <ReviewPanel code={code} ensureSaved={ensureSaved} deletedIds={deletedIds} />

      <AttemptHistory
        questionId={question.id}
        refreshKey={historyKey}
        onLoad={handleLoadAttempt}
        onDeleted={handleDeleted}
      />
    </AppShell>
  );
}