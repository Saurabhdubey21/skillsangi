"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Message = {
  id: string;
  from_user: string;
  to_user: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

const MESSAGE_COLUMNS = "id, from_user, to_user, body, created_at, read_at";

function formatTime(iso: string) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const today = new Date();
  const sameDay =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  if (sameDay) return time;
  return `${d.toLocaleDateString([], { day: "numeric", month: "short" })}, ${time}`;
}

// ---------- The message thread ----------

function ChatThread({
  me,
  otherId,
  otherName,
}: {
  me: string;
  otherId: string;
  otherName: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function markRead() {
      await supabase
        .from("partner_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("to_user", me)
        .eq("from_user", otherId)
        .is("read_at", null);
    }

    async function load() {
      const { data, error: loadError } = await supabase
        .from("partner_messages")
        .select(MESSAGE_COLUMNS)
        .or(
          `and(from_user.eq.${me},to_user.eq.${otherId}),and(from_user.eq.${otherId},to_user.eq.${me})`
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (!active) return;
      if (loadError) {
        setError("Could not load the chat: " + loadError.message);
      } else {
        setMessages(((data ?? []) as Message[]).reverse());
        await markRead();
      }
      setLoading(false);
    }

    load();

    // New messages from this friend arrive live
    const channel = supabase
      .channel(`chat-thread-${otherId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "partner_messages",
          filter: `to_user=eq.${me}`,
        },
        (payload) => {
          const m = payload.new as Message;
          if (m.from_user !== otherId) return;
          setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
          markRead();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [me, otherId]);

  // Keep the newest message in view
  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const body = text.trim();
    if (!body || sending) return;

    setSending(true);
    setError("");
    const supabase = createClient();
    const { data, error: sendError } = await supabase
      .from("partner_messages")
      .insert({ from_user: me, to_user: otherId, body })
      .select(MESSAGE_COLUMNS)
      .single();

    if (sendError || !data) {
      setError("Could not send. You may no longer be connected with this student.");
    } else {
      const m = data as Message;
      setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
      setText("");
    }
    setSending(false);
  }

  return (
    <div className="mt-3">
      <div
        ref={boxRef}
        role="log"
        aria-live="polite"
        aria-label={`Chat with ${otherName}`}
        className="flex h-72 flex-col gap-2 overflow-y-auto rounded-control border border-border bg-background/40 p-3"
      >
        {loading && <p className="m-auto text-sm text-muted">Loading messages...</p>}

        {!loading && messages.length === 0 && (
          <p className="m-auto text-center text-sm text-muted">
            No messages yet. Say hi to {otherName}!
          </p>
        )}

        {messages.map((m) => {
          const mine = m.from_user === me;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                  mine
                    ? "rounded-br-sm bg-accent text-on-accent"
                    : "rounded-bl-sm bg-surface-strong"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`mt-1 text-[11px] ${mine ? "opacity-80" : "text-muted"}`}>
                  {formatTime(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}

      <form onSubmit={send} className="mt-3 flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor={`chat-${otherId}`} className="sr-only">
            Message to {otherName}
          </label>
          <textarea
            id={`chat-${otherId}`}
            rows={2}
            maxLength={1000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Write a message. Enter to send, Shift+Enter for a new line."
            className="w-full rounded-control border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <button
          type="submit"
          disabled={sending || text.trim() === ""}
          className="rounded-control bg-accent px-4 py-2.5 text-sm font-medium text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
        >
          Send
        </button>
      </form>

      <p className="mt-2 text-xs text-muted">
        Be kind. Never share passwords or one-time codes. Messages are not end-to-end encrypted.
      </p>
    </div>
  );
}

// ---------- The Chat button with an unread count ----------

export default function ChatToggle({
  otherId,
  otherName,
}: {
  otherId: string;
  otherName: string;
}) {
  const [me, setMe] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (active) setMe(data.user?.id ?? null);
    });
    return () => {
      active = false;
    };
  }, []);

  // While the chat is closed: count unread messages and watch for new ones
  useEffect(() => {
    if (!me || open) return;
    const supabase = createClient();
    let active = true;

    supabase
      .from("partner_messages")
      .select("id", { count: "exact", head: true })
      .eq("to_user", me)
      .eq("from_user", otherId)
      .is("read_at", null)
      .then(({ count }) => {
        if (active) setUnread(count ?? 0);
      });

    const channel = supabase
      .channel(`chat-unread-${otherId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "partner_messages",
          filter: `to_user=eq.${me}`,
        },
        (payload) => {
          const m = payload.new as Message;
          if (m.from_user === otherId) setUnread((n) => n + 1);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [me, otherId, open]);

  function toggle() {
    setOpen((o) => !o);
    setUnread(0);
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-strong"
      >
        {open ? "Close chat" : `Chat with ${otherName}`}
        {!open && unread > 0 && (
          <span className="rounded-full bg-streak px-2 py-0.5 text-xs font-semibold text-background">
            {unread} new
          </span>
        )}
      </button>

      {open && me && <ChatThread me={me} otherId={otherId} otherName={otherName} />}
    </div>
  );
}