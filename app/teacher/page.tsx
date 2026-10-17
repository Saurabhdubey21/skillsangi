"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { createClient } from "../../lib/supabase/client";
import AppShell from "../components/AppShell";

type Msg = {
  id?: string | null;
  role: "user" | "assistant";
  content: string;
  hint_level?: number | null;
};
type Thread = { id: string; title: string; updated_at: string };
type Mode = "beginner" | "exam" | "interview";
type Lang = "english" | "hinglish";

const MAX_CHARS = 2000;
const MAX_HINT = 4;
const DEFAULT_HINT_TEXT = "I am stuck. Please give me a hint.";
const EXPORT_PAGE = 1000; // rows read per request when exporting

const MODE_OPTIONS: { id: Mode; label: string; note: string }[] = [
  { id: "beginner", label: "Beginner", note: "Simple words and examples" },
  { id: "exam", label: "Exam", note: "Short, exam-style answers" },
  { id: "interview", label: "Interview", note: "Follow-up questions" },
];

const LANG_OPTIONS: { id: Lang; label: string }[] = [
  { id: "english", label: "English" },
  { id: "hinglish", label: "Hinglish" },
];

function isMode(v: unknown): v is Mode {
  return v === "beginner" || v === "exam" || v === "interview";
}
function isLang(v: unknown): v is Lang {
  return v === "english" || v === "hinglish";
}

// Button label for the NEXT hint level
const HINT_BUTTON: Record<number, string> = {
  1: "I'm stuck: give me a nudge",
  2: "Give me a stronger hint",
  3: "Explain the approach in words",
  4: "Show the full solution",
};

// How the AI's markdown looks. Raw HTML is never rendered. Links are shown as plain
// text (the AI must never invent links) and images are not loaded.
const markdownComponents: Components = {
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  h1: ({ children }) => <p className="my-2 text-base font-semibold">{children}</p>,
  h2: ({ children }) => <p className="my-2 text-base font-semibold">{children}</p>,
  h3: ({ children }) => <p className="my-2 font-semibold">{children}</p>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-border pl-3 text-muted">{children}</blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-surface-strong px-1 py-0.5 font-mono text-[0.85em]">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-control border border-border bg-surface-strong p-3 text-xs leading-relaxed [&>code]:rounded-none [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-[1em]">
      {children}
    </pre>
  ),
  a: ({ children }) => <span>{children}</span>,
  img: () => null,
};

// Reads every row of one table that belongs to this student, a page at a time
async function fetchAllRows(table: string, columns: string, userId: string) {
  const supabase = createClient();
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += EXPORT_PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + EXPORT_PAGE - 1);

    if (error) return { rows, failed: true };
    const batch = (data ?? []) as unknown as Record<string, unknown>[];
    rows.push(...batch);
    if (batch.length < EXPORT_PAGE) break;
  }
  return { rows, failed: false };
}

export default function TeacherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [threads, setThreads] = useState<Thread[]>([]);
  const [listError, setListError] = useState("");
  const [showList, setShowList] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [hintUsed, setHintUsed] = useState(0); // highest hint level used in this chat
  const [mode, setMode] = useState<Mode>("beginner");
  const [language, setLanguage] = useState<Lang>("english");
  const [savingLang, setSavingLang] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);

  // Thumbs: message id -> 1 (up) or -1 (down)
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [votingId, setVotingId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchThreads = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("chat_threads")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(30);

    if (error) {
      setListError("Could not load your past chats.");
    } else {
      setListError("");
      setThreads(data ?? []);
    }
  }, []);

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
      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("full_name, ai_language")
        .eq("id", user.id)
        .maybeSingle();

      setUserName(data?.full_name?.trim() || (user.email ?? "").split("@")[0]);
      if (isLang(data?.ai_language)) setLanguage(data.ai_language);
      await fetchThreads();
      setLoading(false);
    }

    load();
  }, [router, fetchThreads]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Saves the language on the student's own profile. The server reads it from there.
  async function changeLanguage(next: Lang) {
    if (next === language || savingLang || sending || !userId) return;

    const previous = language;
    setLanguage(next);
    setSavingLang(true);
    setError("");

    const supabase = createClient();
    const { error: saveError } = await supabase
      .from("profiles")
      .update({ ai_language: next })
      .eq("id", userId);

    if (saveError) {
      setLanguage(previous);
      setError("Could not save your language. Please try again.");
    }
    setSavingLang(false);
  }

  // Thumbs up (1) or down (-1). Same button again removes the vote.
  async function vote(messageId: string, rating: 1 | -1) {
    if (!userId || votingId) return;

    const previous = votes[messageId] ?? 0;
    const next = previous === rating ? 0 : rating;

    setVotingId(messageId);
    setError("");
    setVotes((v) => {
      const copy = { ...v };
      if (next === 0) delete copy[messageId];
      else copy[messageId] = next;
      return copy;
    });

    const supabase = createClient();

    // Remove any old vote of this student on this reply, then add the new one
    const { error: delError } = await supabase
      .from("ai_feedback")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", userId);

    let failed = !!delError;

    if (!failed && next !== 0) {
      const { error: insError } = await supabase
        .from("ai_feedback")
        .insert({ message_id: messageId, user_id: userId, rating: next });
      failed = !!insError;
    }

    if (failed) {
      setVotes((v) => {
        const copy = { ...v };
        if (previous === 0) delete copy[messageId];
        else copy[messageId] = previous;
        return copy;
      });
      setError("Could not save your feedback. Please try again.");
    }
    setVotingId(null);
  }

  // Downloads the student's own AI Teacher data as one JSON file.
  // No name, email or phone is included. Runs in the browser, so nothing is sent anywhere.
  async function exportData() {
    if (!userId || exporting || deleting || sending || openingChat) return;

    setExporting(true);
    setError("");

    const [threadRes, messageRes, feedbackRes] = await Promise.all([
      fetchAllRows("chat_threads", "id, title, mode, hint_level, created_at, updated_at", userId),
      fetchAllRows(
        "chat_messages",
        "id, thread_id, role, content, hint_level, provider, model, input_tokens, output_tokens, created_at",
        userId
      ),
      fetchAllRows("ai_feedback", "id, message_id, rating, created_at", userId),
    ]);

    if (threadRes.failed || messageRes.failed || feedbackRes.failed) {
      setError("Could not export your data. Please try again.");
      setExporting(false);
      return;
    }

    const file = {
      exported_at: new Date().toISOString(),
      note: "Your SkillSangi AI Teacher data. Chats, messages and feedback votes only.",
      chats: threadRes.rows,
      messages: messageRes.rows,
      feedback: feedbackRes.rows,
    };

    const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `skillsangi-ai-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setExporting(false);
  }

  // Deletes ALL of this student's chats. Messages and votes go with them (cascade).
  // The daily message counter is NOT touched, so this cannot be used to reset the limit.
  async function deleteHistory() {
    if (!userId || deleting || exporting || sending || openingChat) return;

    const ok = window.confirm(
      "Delete ALL your AI Teacher chats, messages and feedback? This cannot be undone. Your daily message count will not reset."
    );
    if (!ok) return;

    setDeleting(true);
    setError("");

    const supabase = createClient();
    const { data: removed, error: delError } = await supabase
      .from("chat_threads")
      .delete()
      .eq("user_id", userId)
      .select("id");

    if (delError) {
      setError("Could not delete your history. Please try again.");
    } else if (threads.length > 0 && (removed ?? []).length === 0) {
      // Nothing was deleted even though chats exist, so do not pretend it worked
      setError("Nothing was deleted. Please try again, or contact support if it keeps happening.");
    } else {
      setThreads([]);
      setMessages([]);
      setThreadId(null);
      setHintUsed(0);
      setVotes({});
      setShowList(false);
      await fetchThreads();
    }
    setDeleting(false);
  }

  async function openThread(id: string) {
    if (sending || openingChat || deleting || id === threadId) {
      setShowList(false);
      return;
    }
    setOpeningChat(true);
    setError("");

    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("chat_messages")
      .select("id, role, content, hint_level")
      .eq("thread_id", id)
      .order("created_at", { ascending: true });

    if (loadError) {
      setError("Could not open that chat. Please try again.");
    } else {
      const rows = (data ?? []) as Msg[];
      setMessages(rows);
      setHintUsed(Math.max(0, ...rows.map((r) => r.hint_level ?? 0)));

      // Show the mode this chat was saved with
      const { data: thread } = await supabase
        .from("chat_threads")
        .select("mode")
        .eq("id", id)
        .maybeSingle();
      if (isMode(thread?.mode)) setMode(thread.mode);

      // Load this student's earlier votes for these replies
      const replyIds = rows
        .filter((r) => r.role === "assistant" && r.id)
        .map((r) => r.id as string);
      const loaded: Record<string, number> = {};
      if (replyIds.length > 0) {
        const { data: fb } = await supabase
          .from("ai_feedback")
          .select("message_id, rating")
          .in("message_id", replyIds);
        (fb ?? []).forEach((f) => {
          if (f.rating === 1 || f.rating === -1) loaded[f.message_id as string] = f.rating;
        });
      }
      setVotes(loaded);

      setThreadId(id);
      setShowList(false);
    }
    setOpeningChat(false);
  }

  // Sends one message. hintLevel 0 = a normal message, 1 to 4 = ask for a hint.
  async function send(text: string, hintLevel: number, restoreOnFail: boolean) {
    if (!text || sending || openingChat || deleting) return;

    setError("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/teacher/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, message: text, hintLevel, mode }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setMessages((m) => m.slice(0, -1));
        if (restoreOnFail) setInput(text);
      } else {
        setThreadId(data.threadId);
        setHintUsed(Number(data.threadHintLevel) || 0);
        setMessages((m) => [
          ...m,
          {
            id: data.messageId ?? null,
            role: "assistant",
            content: data.reply,
            hint_level: Number(data.hintLevel) || 0,
          },
        ]);
        setUsage({ used: data.usedToday, limit: data.dailyLimit });
        fetchThreads();
      }
    } catch {
      setError("Could not reach the server. Check your internet and try again.");
      setMessages((m) => m.slice(0, -1));
      if (restoreOnFail) setInput(text);
    } finally {
      setSending(false);
    }
  }

  function handleSend() {
    send(input.trim(), 0, true);
  }

  function handleHint() {
    const next = Math.min(hintUsed + 1, MAX_HINT);
    if (next === MAX_HINT) {
      const ok = window.confirm(
        "Have you tried the problem yourself? The full solution is best after you have tried. Show it now?"
      );
      if (!ok) return;
    }
    const typed = input.trim();
    send(typed || DEFAULT_HINT_TEXT, next, typed.length > 0);
  }

  function handleNewChat() {
    setMessages([]);
    setThreadId(null);
    setHintUsed(0);
    setVotes({});
    setError("");
    setShowList(false);
  }

  const nextHint = Math.min(hintUsed + 1, MAX_HINT);
  const hintsDone = hintUsed >= MAX_HINT;
  const canHint =
    !sending &&
    !openingChat &&
    !deleting &&
    !hintsDone &&
    (messages.length > 0 || input.trim().length > 0);

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">AI Teacher</h1>
          <p className="mt-2 max-w-xl text-muted">
            Ask a doubt in plain language and get a step-by-step explanation.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowList((v) => !v)}
            className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground md:hidden"
          >
            Past chats
          </button>
          <button
            type="button"
            onClick={handleNewChat}
            disabled={sending || deleting || (messages.length === 0 && !threadId)}
            className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground disabled:opacity-50"
          >
            New chat
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[220px_1fr]">
        {/* Past chats */}
        <aside
          aria-label="Past chats"
          className={`${showList ? "block" : "hidden"} md:block`}
        >
          <div className="glass rounded-panel p-3">
            <h2 className="px-2 pb-2 text-sm font-semibold">Past chats</h2>

            {listError && (
              <p role="alert" className="px-2 py-2 text-sm text-danger">
                {listError}
              </p>
            )}

            {!listError && threads.length === 0 && (
              <p className="px-2 py-2 text-sm text-muted">
                No chats yet. Ask your first question!
              </p>
            )}

            <ul className="max-h-[55vh] space-y-1 overflow-y-auto">
              {threads.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => openThread(t.id)}
                    aria-current={t.id === threadId ? "true" : undefined}
                    className={`w-full truncate rounded-control px-3 py-2 text-left text-sm transition-colors ${
                      t.id === threadId
                        ? "bg-accent text-on-accent"
                        : "text-muted hover:bg-surface-strong hover:text-foreground"
                    }`}
                  >
                    {t.title}
                  </button>
                </li>
              ))}
            </ul>

            {threads.length > 0 && (
              <div className="mt-3 flex flex-col items-start gap-2 border-t border-border px-2 pt-3">
                <button
                  type="button"
                  onClick={exportData}
                  disabled={exporting || deleting || sending || openingChat}
                  className="text-xs font-medium text-accent hover:underline disabled:opacity-60"
                >
                  {exporting ? "Preparing file..." : "Export my data"}
                </button>
                <button
                  type="button"
                  onClick={deleteHistory}
                  disabled={deleting || exporting || sending || openingChat}
                  className="text-xs font-medium text-danger hover:underline disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete my AI history"}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Chat */}
        <section className="glass flex min-w-0 flex-col rounded-panel p-4 sm:p-6">
          {/* Mode and language switches */}
          <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div role="group" aria-label="Teaching mode" className="flex flex-wrap gap-2">
              {MODE_OPTIONS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  disabled={sending || openingChat}
                  aria-pressed={mode === m.id}
                  title={m.note}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                    mode === m.id
                      ? "border-accent bg-accent text-on-accent"
                      : "border-border bg-surface text-muted hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div role="group" aria-label="Reply language" className="flex flex-wrap gap-2">
              {LANG_OPTIONS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => changeLanguage(l.id)}
                  disabled={sending || openingChat || savingLang}
                  aria-pressed={language === l.id}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                    language === l.id
                      ? "border-accent bg-accent text-on-accent"
                      : "border-border bg-surface text-muted hover:text-foreground"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <p className="mb-4 text-xs text-muted">
            {MODE_OPTIONS.find((m) => m.id === mode)?.note}.{" "}
            {language === "hinglish"
              ? "Replies in simple Hinglish (English words, Hindi connectors)."
              : "Replies in simple English."}
          </p>

          <div
            className="max-h-[55vh] min-h-[200px] space-y-4 overflow-y-auto pr-1"
            aria-live="polite"
          >
            {openingChat && (
              <p role="status" className="py-10 text-center text-muted">
                Opening chat...
              </p>
            )}

            {!openingChat && messages.length === 0 && !sending && (
              <p className="py-10 text-center text-muted">
                Ask your first question. For example: &quot;What is an array?&quot;
              </p>
            )}

            {!openingChat &&
              messages.map((m, i) => (
                <div
                  key={m.id ?? i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[85%] min-w-0">
                    {m.role === "user" ? (
                      <div className="whitespace-pre-wrap break-words rounded-control bg-accent px-4 py-3 text-sm leading-relaxed text-on-accent">
                        {m.content}
                      </div>
                    ) : (
                      <div className="break-words rounded-control border border-border bg-surface px-4 py-3 text-sm leading-relaxed">
                        <ReactMarkdown components={markdownComponents}>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    )}

                    {m.role === "assistant" && (
                      <div className="mt-1 flex flex-wrap items-center gap-2 px-1">
                        {(m.hint_level ?? 0) > 0 && (
                          <span className="text-xs text-muted">
                            Hints used: {m.hint_level} of {MAX_HINT}
                          </span>
                        )}
                        {m.id && (
                          <span className="ml-auto flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => vote(m.id as string, 1)}
                              disabled={votingId !== null}
                              aria-label="This answer was helpful"
                              aria-pressed={votes[m.id] === 1}
                              className={`rounded-control border px-2 py-0.5 text-sm transition-colors disabled:opacity-60 ${
                                votes[m.id] === 1
                                  ? "border-accent bg-accent/15"
                                  : "border-border bg-surface opacity-70 hover:opacity-100"
                              }`}
                            >
                              👍
                            </button>
                            <button
                              type="button"
                              onClick={() => vote(m.id as string, -1)}
                              disabled={votingId !== null}
                              aria-label="This answer was not helpful"
                              aria-pressed={votes[m.id] === -1}
                              className={`rounded-control border px-2 py-0.5 text-sm transition-colors disabled:opacity-60 ${
                                votes[m.id] === -1
                                  ? "border-accent bg-accent/15"
                                  : "border-border bg-surface opacity-70 hover:opacity-100"
                              }`}
                            >
                              👎
                            </button>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

            {sending && (
              <div className="flex justify-start">
                <div
                  role="status"
                  className="rounded-control border border-border bg-surface px-4 py-3 text-sm text-muted"
                >
                  Teacher is thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {error}
            </p>
          )}

          {/* Hint ladder */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleHint}
              disabled={!canHint}
              className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-surface-strong disabled:opacity-50"
            >
              {hintsDone ? "All hints used" : HINT_BUTTON[nextHint]}
            </button>
            <span className="text-xs text-muted">Hints used: {hintUsed} of {MAX_HINT}</span>
          </div>

          <div className="mt-3 flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              maxLength={MAX_CHARS}
              rows={2}
              placeholder="Type your doubt here..."
              aria-label="Your question"
              className="w-full resize-none rounded-control border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || openingChat || deleting || !input.trim()}
              className="rounded-control bg-accent px-5 py-3 font-medium text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
            >
              Send
            </button>
          </div>

          <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted">
            <span>AI can be wrong. Please check important answers.</span>
            <span>
              {input.length}/{MAX_CHARS}
              {usage ? ` · Messages today: ${usage.used}/${usage.limit}` : ""}
            </span>
          </div>
        </section>
      </div>
    </AppShell>
  );
}