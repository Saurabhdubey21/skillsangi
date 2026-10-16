"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import AppShell from "../components/AppShell";

type Msg = { role: "user" | "assistant"; content: string };
type Thread = { id: string; title: string; updated_at: string };

const MAX_CHARS = 2000;

export default function TeacherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  const [threads, setThreads] = useState<Thread[]>([]);
  const [listError, setListError] = useState("");
  const [showList, setShowList] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);

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

      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      setUserName(data?.full_name?.trim() || (user.email ?? "").split("@")[0]);
      await fetchThreads();
      setLoading(false);
    }

    load();
  }, [router, fetchThreads]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function openThread(id: string) {
    if (sending || openingChat || id === threadId) {
      setShowList(false);
      return;
    }
    setOpeningChat(true);
    setError("");

    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("thread_id", id)
      .order("created_at", { ascending: true });

    if (loadError) {
      setError("Could not open that chat. Please try again.");
    } else {
      setMessages((data ?? []) as Msg[]);
      setThreadId(id);
      setShowList(false);
    }
    setOpeningChat(false);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending || openingChat) return;

    setError("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/teacher/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, message: text }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setMessages((m) => m.slice(0, -1));
        setInput(text);
      } else {
        setThreadId(data.threadId);
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
        setUsage({ used: data.usedToday, limit: data.dailyLimit });
        fetchThreads();
      }
    } catch {
      setError("Could not reach the server. Check your internet and try again.");
      setMessages((m) => m.slice(0, -1));
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  function handleNewChat() {
    setMessages([]);
    setThreadId(null);
    setError("");
    setShowList(false);
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
            disabled={sending || (messages.length === 0 && !threadId)}
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
          </div>
        </aside>

        {/* Chat */}
        <section className="glass flex min-w-0 flex-col rounded-panel p-4 sm:p-6">
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
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-control px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-accent text-on-accent"
                        : "border border-border bg-surface"
                    }`}
                  >
                    {m.content}
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

          <div className="mt-4 flex items-end gap-3">
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
              disabled={sending || openingChat || !input.trim()}
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