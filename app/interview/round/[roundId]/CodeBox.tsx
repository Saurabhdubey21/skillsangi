"use client";

// Code box for coding questions. Wide screens use the CodeMirror editor, narrow screens a plain text box.
// The box can be locked (before the approach is explained, or when no submissions are left).
// Save as: app/interview/round/[roundId]/CodeBox.tsx

import { useState } from "react";
import CodeEditor, { type Language } from "../../../components/CodeEditor";

const MAX_CODE = 6000; // same as LIMITS.codeChars on the server

const LANGUAGES: { id: Language; label: string }[] = [
  { id: "cpp", label: "C++" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "javascript", label: "JavaScript" },
  { id: "c", label: "C" },
];

export default function CodeBox({
  busy,
  onSubmit,
  locked = false,
  lockedText = "",
  submissionsLeft,
}: {
  busy: boolean;
  onSubmit: (code: string, languageLabel: string) => void;
  locked?: boolean; // true = the editor cannot be used right now
  lockedText?: string; // short explanation shown while locked
  submissionsLeft?: number; // code submissions still allowed for this problem
}) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language>("cpp");

  const tooLong = code.length > MAX_CODE;
  const label = LANGUAGES.find((l) => l.id === language)?.label ?? language;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Your code</h3>
        <label className="flex items-center gap-2 text-xs text-muted">
          Language
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            disabled={locked}
            className="rounded-control border border-border bg-surface px-2 py-1 text-sm text-foreground disabled:opacity-60"
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {locked ? (
        <p role="status" className="mt-2 rounded-control border border-border bg-surface px-3 py-2 text-sm text-muted">
          {lockedText || "The code editor is locked right now."}
        </p>
      ) : (
        <p role="status" className="mt-2 text-sm text-accent">
          The editor is open. Write your code and press Submit code.
        </p>
      )}

      <div
        className={`mt-2 hidden overflow-hidden rounded-control border border-border md:block ${
          locked ? "pointer-events-none opacity-50" : ""
        }`}
        inert={locked}
      >
        <CodeEditor value={code} onChange={setCode} language={language} />
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={10}
        spellCheck={false}
        disabled={locked}
        aria-label="Your code"
        placeholder="Write your code here..."
        className="mt-2 w-full resize-y rounded-control border border-border bg-surface px-3 py-2.5 font-mono text-xs text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-50 md:hidden"
      />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className={`text-xs ${tooLong ? "text-danger" : "text-muted"}`}>
          {code.length}/{MAX_CODE} characters. The AI reads your code but cannot run it.
          {typeof submissionsLeft === "number" &&
            ` Code submissions left for this problem: ${submissionsLeft}.`}
        </span>
        <button
          type="button"
          onClick={() => onSubmit(code.trim(), label)}
          disabled={locked || busy || !code.trim() || tooLong}
          className="rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
        >
          Submit code
        </button>
      </div>
    </div>
  );
}