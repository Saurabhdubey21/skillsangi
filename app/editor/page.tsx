"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import AppShell from "../components/AppShell";
import AttemptHistory from "../components/AttemptHistory";
import ReviewPanel from "../components/ReviewPanel";

type Language = "c" | "cpp" | "java" | "python" | "javascript";

// The editor is loaded only on this page, so the rest of the site stays light.
const CodeEditor = dynamic(() => import("../components/CodeEditor"), {
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

export default function FreeEditorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  const [language, setLanguage] = useState<Language>("cpp");
  const [code, setCode] = useState(starters.cpp);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const [lastSaved, setLastSaved] = useState<{ id: string; code: string; language: Language } | null>(null);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

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

      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      setUserName(data?.full_name?.trim() || (user.email ?? "").split("@")[0]);
      setLoading(false);
    }

    load();
  }, [router]);

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
        question_id: null,
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

  if (loading) {
    return (
      <div
        role="status"
        className="backdrop-wash flex min-h-screen items-center justify-center text-muted"
      >
        Loading...
      </div>
    );
  }

  return (
    <AppShell userName={userName}>
      <h1 className="text-3xl font-semibold sm:text-4xl">Code Editor</h1>
      <p className="mt-2 max-w-xl text-muted">
        Write and save code for any practice. This is not tied to a question.
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
        questionId={null}
        refreshKey={historyKey}
        onLoad={handleLoadAttempt}
        onDeleted={handleDeleted}
      />
    </AppShell>
  );
}