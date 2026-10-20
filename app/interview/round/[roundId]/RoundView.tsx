"use client";

// The round screen: chat, timer, mic, read-aloud, code box (coding), project box and resume box (HR).
// Save as: app/interview/round/[roundId]/RoundView.tsx

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import AppShell from "../../../components/AppShell";
import { useSpeechInput, useSpeechOutput } from "./useVoice";
import CodeBox from "./CodeBox";
import ResumeBox from "./ResumeBox";

type Item = {
  kind: "code" | "voice" | "core" | "systemdesign" | "hr";
  label: string;
  difficulty?: string;
  topic?: string;
  url?: string | null;
  platform?: string | null;
};
type Msg = { role: "user" | "assistant"; content: string };
type Stage = "loading" | "ready" | "intro" | "chat" | "finishing" | "result" | "blocked";
type RoundResult = {
  score: number;
  passed: boolean;
  interviewOver: boolean;
  report?: { passMark?: number; summary?: string; improvements?: string[] };
};
type CallOptions = { rollback?: boolean; restore?: string };

const MAX_ANSWER = 1500; // same as LIMITS.answerChars on the server
const MAX_PROJECT = 6000; // same as LIMITS.projectChars on the server
const MAX_RESUME = 4000; // leaves room in the project box for the student's own project text
const RESUME_MARKER = "RESUME:\n";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const KIND_HELP: Record<Item["kind"], string> = {
  code: "Explain your approach first: the idea, the steps and the complexity. You can also submit code below. The AI reads it but cannot run it.",
  voice: "Spoken question. Explain how you would solve it in words: the idea, the steps, and the time and space complexity.",
  core: "The interviewer will choose the exact question. Answer in your own words.",
  systemdesign: "Start by asking or stating the requirements, then explain your design and its trade-offs.",
  hr: "Answer naturally, with real examples.",
};

export default function RoundView() {
  const router = useRouter();
  const params = useParams<{ roundId: string }>();
  const roundId = typeof params?.roundId === "string" ? params.roundId : "";

  const [userName, setUserName] = useState("");
  const [stage, setStage] = useState<Stage>("loading");
  const [blockedText, setBlockedText] = useState("");
  const [interviewId, setInterviewId] = useState("");
  const [roundType, setRoundType] = useState("");

  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [items, setItems] = useState<Item[]>([]);
  const [index, setIndex] = useState(0);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [projectText, setProjectText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [result, setResult] = useState<RoundResult | null>(null);
  const [finishFailed, setFinishFailed] = useState(false);
  const [finalState, setFinalState] = useState<"idle" | "writing" | "done" | "failed">("idle");

  const [autoRead, setAutoRead] = useState(false);

  const finishingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Voice: the mic adds the spoken words to the answer box; read-aloud speaks the replies.
  const mic = useSpeechInput((text) => {
    setInput((prev) => ((prev ? prev + " " : "") + text).slice(0, MAX_ANSWER));
  });
  const voiceOut = useSpeechOutput();
  const { stop: stopMic } = mic;
  const { cancel: cancelSpeech } = voiceOut;

  // ---- Final report (only called when the interview is over) ----
  const writeFinal = useCallback(async (id: string) => {
    setFinalState("writing");
    try {
      const res = await fetch("/api/interview/final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId: id }),
      });
      setFinalState(res.ok ? "done" : "failed");
    } catch {
      setFinalState("failed");
    }
  }, []);

  // ---- Finish the round: the server scores it ----
  const finishRound = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setStage("finishing");
    setFinishFailed(false);
    setError("");

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch("/api/interview/round/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roundId }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setResult(data as RoundResult);
          setStage("result");
          finishingRef.current = false;
          if (data.interviewOver && interviewId) writeFinal(interviewId);
          return;
        }
        // 409 can happen if our clock is a little ahead of the server clock. Wait and try again.
        if (res.status === 409 && attempt < 2) {
          await sleep(3000);
          continue;
        }
        setError(data.error ?? "Could not score this round right now.");
        break;
      } catch {
        setError("Could not reach the server. Check your internet and try again.");
        break;
      }
    }
    finishingRef.current = false;
    setFinishFailed(true);
  }, [roundId, interviewId, writeFinal]);

  // ---- Start (or resume) the round: this is what starts the 60-minute timer ----
  const startRound = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/interview/round/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 404 || res.status === 409 || res.status === 410) {
          setBlockedText(data.error ?? "This round cannot be opened.");
          setStage("blocked");
        } else {
          setError(data.error ?? "Something went wrong. Please try again.");
          setStage("ready");
        }
        return;
      }

      setTitle(data.title ?? "");
      setRoundType(typeof data.type === "string" ? data.type : "");
      setDeadline(data.deadline ?? null);
      setItems((data.items ?? []) as Item[]);

      // Read the saved progress and earlier messages (the database only shows this student's rows)
      const supabase = createClient();
      const { data: row } = await supabase
        .from("interview_rounds")
        .select("state")
        .eq("id", roundId)
        .maybeSingle();
      const { data: rows } = await supabase
        .from("interview_messages")
        .select("role, content")
        .eq("round_id", roundId)
        .order("created_at", { ascending: true })
        .limit(300);
      setMessages((rows ?? []) as Msg[]);

      const st = (row?.state ?? {}) as { phase?: string; index?: number; projectDetails?: string };
      setIndex(Number.isInteger(st.index) ? Number(st.index) : 0);
      if (typeof st.projectDetails === "string") setProjectText(st.projectDetails);
      if (st.phase === "done") {
        finishRound();
      } else {
        setStage(st.phase === "intro" ? "intro" : "chat");
      }
    } catch {
      setError("Could not reach the server. Check your internet and try again.");
      setStage("ready");
    }
  }, [roundId, finishRound]);

  // ---- First load ----
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      setUserName(profile?.full_name?.trim() || (user.email ?? "").split("@")[0]);

      const { data: round } = await supabase
        .from("interview_rounds")
        .select("id, interview_id, status")
        .eq("id", roundId)
        .maybeSingle();
      if (!round) {
        setBlockedText("Round not found.");
        setStage("blocked");
        return;
      }
      setInterviewId(round.interview_id);

      if (round.status === "passed" || round.status === "failed") {
        setBlockedText("This round is already finished.");
        setStage("blocked");
      } else if (round.status === "active") {
        await startRound(); // resume
      } else {
        setStage("ready");
      }
    }

    if (roundId) load();
  }, [roundId, router, startRound]);

  // ---- Countdown ----
  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const remaining = deadline ? Date.parse(deadline) - now : null;

  useEffect(() => {
    if (remaining !== null && remaining <= 0 && (stage === "intro" || stage === "chat")) {
      finishRound();
    }
  }, [remaining, stage, finishRound]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  // Stop the mic and the voice when the round is being scored.
  useEffect(() => {
    if (stage === "finishing" || stage === "result") {
      stopMic();
      cancelSpeech();
    }
  }, [stage, stopMic, cancelSpeech]);

  // ---- One turn with the interviewer ----
  // rollback: remove the message we just added if the call fails.
  // restore: put this text back in the answer box if the call fails.
  async function callAnswer(body: Record<string, unknown>, opts: CallOptions = {}) {
    setBusy(true);
    setError("");

    const project = projectText.trim();
    const extra = roundType === "hr" && project ? { projectDetails: project } : {};

    function undo() {
      if (opts.rollback) setMessages((m) => m.slice(0, -1));
      if (opts.restore !== undefined) setInput(opts.restore);
    }

    try {
      const res = await fetch("/api/interview/round/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId, ...body, ...extra }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        undo();
        return;
      }

      if (data.timeUp) {
        finishRound();
        return;
      }
      if (typeof data.reply === "string" && data.reply) {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
        if (autoRead && voiceOut.supported && !data.roundComplete) voiceOut.speak(data.reply);
      }
      if (Number.isInteger(data.index)) setIndex(data.index);
      setStage((s) => (s === "intro" ? "chat" : s));
      if (data.roundComplete) finishRound();
    } catch {
      setError("Could not reach the server. Check your internet and try again.");
      undo();
    } finally {
      setBusy(false);
    }
  }

  function handleBegin() {
    if (busy) return;
    callAnswer({ action: "begin" });
  }

  function handleSend() {
    const text = input.trim();
    if (!text || busy) return;
    stopMic();
    cancelSpeech();
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    callAnswer({ action: "answer", message: text }, { rollback: true, restore: text });
  }

  function handleSubmitCode(code: string, languageLabel: string) {
    if (!code || busy) return;
    stopMic();
    cancelSpeech();
    const text = `I submitted my ${languageLabel} code for review.`;
    setMessages((m) => [...m, { role: "user", content: text }]);
    callAnswer({ action: "answer", message: text, code }, { rollback: true });
  }

  function handleNext() {
    if (busy) return;
    const last = index >= items.length - 1;
    const ok = window.confirm(
      last
        ? "Finish the round now? Your answers so far will be scored."
        : "Skip the rest of this question and move on?"
    );
    if (!ok) return;
    stopMic();
    cancelSpeech();
    callAnswer({ action: "next" });
  }

  function replayLast() {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (last) voiceOut.speak(last.content);
  }

  // Puts the cleaned resume into the project box under a RESUME heading.
  // The student's own project text is kept; an older resume block is replaced.
  function handleUseResume(text: string) {
    setProjectText((prev) => {
      const at = prev.indexOf(RESUME_MARKER);
      const own = (at >= 0 ? prev.slice(0, at) : prev).trim();
      const joined = own ? `${own}\n\n${RESUME_MARKER}${text}` : `${RESUME_MARKER}${text}`;
      return joined.slice(0, MAX_PROJECT);
    });
  }

  // ---- Screens ----
  if (stage === "loading") {
    return (
      <div role="status" className="backdrop-wash flex min-h-screen items-center justify-center text-muted">
        Loading...
      </div>
    );
  }

  const current = items[index];
  const showChat = stage === "intro" || stage === "chat" || stage === "finishing" || stage === "result";
  const lowTime = remaining !== null && remaining <= 5 * 60 * 1000;
  const isHr = roundType === "hr";

  const resumeBox = <ResumeBox maxChars={MAX_RESUME} disabled={busy} onUse={handleUseResume} />;

  const projectBox = (
    <div className="mt-4 border-t border-border pt-4">
      <h3 className="text-sm font-semibold">Your project details</h3>
      <p className="mt-1 text-xs text-danger">
        Do not paste your phone number, email, home address or any private data. The text is sent to AI services
        (Gemini or Groq) to run the interview.
      </p>
      <textarea
        value={projectText}
        onChange={(e) => setProjectText(e.target.value)}
        maxLength={MAX_PROJECT}
        rows={6}
        aria-label="Your project details"
        placeholder="Describe one project: what it does, the tech you used, which parts you built, and a problem you solved."
        className="mt-2 w-full resize-y rounded-control border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/30"
      />
      <p className="mt-1 text-xs text-muted">
        {projectText.length}/{MAX_PROJECT}. You can edit this during the round; the newest text is used on your next
        answer.
      </p>
    </div>
  );

  return (
    <AppShell userName={userName}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/interview" className="text-sm font-medium text-accent hover:underline">
            Back to Mock Interview
          </Link>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{title || "Interview round"}</h1>
        </div>
        {remaining !== null && stage !== "result" && (
          <div
            role="timer"
            aria-label="Time left in this round"
            className={`rounded-control border px-4 py-2 text-lg font-semibold tabular-nums ${
              lowTime ? "border-danger text-danger" : "border-border bg-surface"
            }`}
          >
            {formatTime(remaining)}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}

      {stage === "blocked" && (
        <section className="glass mt-6 rounded-panel p-4 sm:p-6">
          <p>{blockedText}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
            <Link href="/interview" className="text-accent hover:underline">
              Back to Mock Interview
            </Link>
            {interviewId && (
              <Link href={`/interview/report/${interviewId}`} className="text-accent hover:underline">
                See report
              </Link>
            )}
          </div>
        </section>
      )}

      {stage === "ready" && (
        <section className="glass mt-6 rounded-panel p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Ready to begin?</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
            <li>You get 60 minutes. The timer starts when you press Start and does not stop if you leave this page.</li>
            <li>The interviewer asks one question at a time and may ask follow-up questions.</li>
            <li>Scores are AI practice estimates. The AI reads your answers but cannot run code.</li>
            <li>Do not share phone numbers, email or address.</li>
          </ul>
          <button
            type="button"
            onClick={() => {
              setStage("loading");
              startRound();
            }}
            className="mt-4 rounded-control bg-accent px-5 py-3 font-medium text-on-accent transition hover:bg-accent-hover"
          >
            Start round
          </button>
        </section>
      )}

      {showChat && (
        <>
          {current && stage !== "result" && (
            <section className="glass mt-6 rounded-panel p-4 sm:p-5">
              <p className="text-xs text-muted">
                Question {Math.min(index + 1, items.length)} of {items.length}
              </p>
              <h2 className="mt-1 font-semibold">{current.label}</h2>
              {(current.difficulty || current.topic) && (
                <p className="mt-1 text-xs text-muted">
                  {[current.difficulty, current.topic].filter(Boolean).join(" · ")}
                </p>
              )}
              <p className="mt-2 text-sm text-muted">{KIND_HELP[current.kind]}</p>
              {current.url && (
                <a
                  href={current.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
                >
                  Open the problem{current.platform ? ` on ${current.platform}` : ""}
                </a>
              )}
            </section>
          )}

          <section className="glass mt-4 flex min-w-0 flex-col rounded-panel p-4 sm:p-6">
            {voiceOut.supported && (stage === "intro" || stage === "chat") && (
              <div className="mb-3 flex flex-wrap items-center gap-4 text-sm">
                <label className="flex items-center gap-2 text-muted">
                  <input
                    type="checkbox"
                    checked={autoRead}
                    onChange={(e) => {
                      setAutoRead(e.target.checked);
                      if (!e.target.checked) cancelSpeech();
                    }}
                  />
                  Read replies aloud
                </label>
                {messages.some((m) => m.role === "assistant") && (
                  <button
                    type="button"
                    onClick={voiceOut.speaking ? voiceOut.cancel : replayLast}
                    className="font-medium text-accent hover:underline"
                  >
                    {voiceOut.speaking ? "Stop voice" : "Replay last reply"}
                  </button>
                )}
              </div>
            )}

            <div className="max-h-[50vh] min-h-[160px] space-y-4 overflow-y-auto pr-1" aria-live="polite">
              {messages.length === 0 && !busy && (
                <p className="py-8 text-center text-muted">
                  {stage === "intro" ? "Press Begin when you are ready." : "No messages yet."}
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] min-w-0 whitespace-pre-wrap break-words rounded-control px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-accent text-on-accent"
                        : "border border-border bg-surface"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div
                    role="status"
                    className="rounded-control border border-border bg-surface px-4 py-3 text-sm text-muted"
                  >
                    Interviewer is thinking...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {stage === "intro" && (
              <>
                {isHr && resumeBox}
                {isHr && projectBox}
                <button
                  type="button"
                  onClick={handleBegin}
                  disabled={busy}
                  className="mt-4 self-start rounded-control bg-accent px-5 py-3 font-medium text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
                >
                  {busy ? "Starting..." : "Begin"}
                </button>
              </>
            )}

            {stage === "chat" && (
              <>
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
                    maxLength={MAX_ANSWER}
                    rows={3}
                    placeholder="Type your answer here, or use the microphone..."
                    aria-label="Your answer"
                    className="w-full resize-none rounded-control border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                  <div className="flex flex-col gap-2">
                    {mic.supported && (
                      <button
                        type="button"
                        onClick={mic.listening ? mic.stop : mic.start}
                        disabled={busy}
                        aria-pressed={mic.listening}
                        className={`rounded-control border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                          mic.listening
                            ? "border-danger text-danger"
                            : "border-border bg-surface text-muted hover:text-foreground"
                        }`}
                      >
                        {mic.listening ? "Stop mic" : "Use mic"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={busy || !input.trim()}
                      className="rounded-control bg-accent px-5 py-3 font-medium text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
                    >
                      Send
                    </button>
                  </div>
                </div>

                {mic.listening && (
                  <p role="status" className="mt-2 text-xs text-danger">
                    Listening... speak your answer, then press Stop mic and check the text before sending.
                  </p>
                )}
                {mic.micError && (
                  <p role="alert" className="mt-2 text-xs text-danger">
                    {mic.micError}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted">
                  {mic.supported
                    ? "The microphone works in Chrome and Edge. These browsers send your voice to their own speech service to turn it into text."
                    : "Voice input works in Chrome or Edge. You can type your answer here."}
                </p>

                {current?.kind === "code" && (
                  <CodeBox key={index} busy={busy} onSubmit={handleSubmitCode} />
                )}
                {isHr && resumeBox}
                {isHr && projectBox}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={busy}
                    className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground disabled:opacity-60"
                  >
                    {index >= items.length - 1 ? "Finish round" : "Next question"}
                  </button>
                  <span>
                    {input.length}/{MAX_ANSWER}
                  </span>
                </div>
              </>
            )}
          </section>
        </>
      )}

      {stage === "finishing" && (
        <section className="glass mt-4 rounded-panel p-4 sm:p-6">
          {!finishFailed ? (
            <p role="status" className="text-muted">
              Scoring your round... this can take up to 30 seconds.
            </p>
          ) : (
            <>
              <p className="text-sm">Your answers are saved. The score could not be created yet.</p>
              <button
                type="button"
                onClick={finishRound}
                className="mt-3 rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent transition hover:bg-accent-hover"
              >
                Try again
              </button>
            </>
          )}
        </section>
      )}

      {stage === "result" && result && (
        <section className="glass mt-4 rounded-panel p-4 sm:p-6">
          <p className="text-sm text-muted">Round score</p>
          <p className="mt-1 text-5xl font-semibold">
            {result.score}
            <span className="text-xl text-muted"> / 100</span>
          </p>
          <p className={`mt-2 font-medium ${result.passed ? "text-accent" : "text-danger"}`}>
            {result.passed ? "Passed" : "Not passed"}
            {result.report?.passMark ? ` (pass mark ${result.report.passMark})` : ""}
          </p>
          {result.report?.summary && <p className="mt-3 text-sm leading-relaxed">{result.report.summary}</p>}
          {(result.report?.improvements ?? []).length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {(result.report?.improvements ?? []).map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}
          <p className="mt-3 rounded-control border border-border bg-surface px-3 py-2 text-xs text-muted">
            AI estimate for practice. Not a prediction of real selection.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {result.interviewOver ? (
              <>
                {finalState === "writing" && (
                  <span role="status" className="text-sm text-muted">
                    Writing your final report...
                  </span>
                )}
                {finalState === "failed" && (
                  <button
                    type="button"
                    onClick={() => writeFinal(interviewId)}
                    className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-surface-strong"
                  >
                    Try the final report again
                  </button>
                )}
                {(finalState === "done" || finalState === "failed") && (
                  <Link
                    href={`/interview/report/${interviewId}`}
                    className="rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent transition hover:bg-accent-hover"
                  >
                    See final report
                  </Link>
                )}
              </>
            ) : (
              <Link
                href="/interview"
                className="rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent transition hover:bg-accent-hover"
              >
                Continue to the next round
              </Link>
            )}
          </div>
        </section>
      )}
    </AppShell>
  );
}