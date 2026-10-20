"use client";

// Resume helper for the HR round: paste text, remove contact details, review, then use.
// Save as: app/interview/round/[roundId]/ResumeBox.tsx

import { useState } from "react";
import { cleanResumeText, type CleanResult } from "../../../../lib/resume-clean";

type Props = {
  maxChars: number; // same limit as the project box
  disabled?: boolean;
  onUse: (text: string) => void; // called with the cleaned, edited text
};

const MAX_RAW = 20000; // the pasted text can be longer; cleaning cuts it to maxChars

export default function ResumeBox({ maxChars, disabled, onUse }: Props) {
  const [raw, setRaw] = useState("");
  const [cleaned, setCleaned] = useState<CleanResult | null>(null);
  const [text, setText] = useState("");

  function handleClean() {
    if (!raw.trim()) return;
    const result = cleanResumeText(raw, maxChars);
    setCleaned(result);
    setText(result.text);
  }

  function handleUse() {
    const t = text.trim();
    if (!t) return;
    onUse(t);
    setRaw("");
    setCleaned(null);
    setText("");
  }

  function handleDiscard() {
    setCleaned(null);
    setText("");
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <h3 className="text-sm font-semibold">Your resume (optional)</h3>
      <p className="mt-1 text-xs text-danger">
        Your resume is sent to AI services (Gemini or Groq). We remove emails, phone numbers and links, but we cannot
        find your name, address, college ID or date of birth. Delete those lines yourself before you continue.
      </p>

      {!cleaned && (
        <>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            maxLength={MAX_RAW}
            rows={6}
            aria-label="Paste your resume text"
            placeholder="Copy the text from your resume and paste it here."
            className="mt-2 w-full resize-y rounded-control border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
          <button
            type="button"
            onClick={handleClean}
            disabled={disabled || !raw.trim()}
            className="mt-2 rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-surface-strong disabled:opacity-60"
          >
            Remove contact details and review
          </button>
        </>
      )}

      {cleaned && (
        <>
          <p role="status" className="mt-2 text-xs text-muted">
            Removed {cleaned.removed.emails} email(s), {cleaned.removed.phones} phone number(s) and{" "}
            {cleaned.removed.links} link(s).
            {cleaned.truncated ? ` The text was cut to ${maxChars} characters.` : ""} Read it below and delete your name,
            address and anything private.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={maxChars}
            rows={10}
            aria-label="Cleaned resume text. You can edit it."
            className="mt-2 w-full resize-y rounded-control border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
          <p className="mt-1 text-xs text-muted">
            {text.length}/{maxChars}
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleUse}
              disabled={disabled || !text.trim()}
              className="rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
            >
              Add to project details
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Start again
            </button>
          </div>
        </>
      )}
    </div>
  );
}