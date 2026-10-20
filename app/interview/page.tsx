"use client";

// The /interview page: choose a package, start or resume an interview, see the 3 rounds.
// Save as: app/interview/page.tsx

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import AppShell from "../components/AppShell";

type Band = "under8" | "8to10" | "above10";
type RoundStatus = "pending" | "active" | "passed" | "failed";

type Round = {
  id: string;
  round_type: "coding" | "core" | "hr";
  position: number;
  status: RoundStatus;
  score: number | null;
};
type Interview = { id: string; band: Band; expires_at: string };
type PastInterview = {
  id: string;
  band: Band;
  status: string;
  final_score: number | null;
  started_at: string;
};

const BANDS: { id: Band; label: string; note: string }[] = [
  { id: "under8", label: "Under 8 LPA", note: "Easier coding topics, core CS basics." },
  { id: "8to10", label: "8 to 10 LPA", note: "All coding topics, core CS with scenarios." },
  { id: "above10", label: "Above 10 LPA", note: "Adds spoken questions and one system design question." },
];

const BAND_LABEL: Record<Band, string> = {
  under8: "Under 8 LPA",
  "8to10": "8 to 10 LPA",
  above10: "Above 10 LPA",
};

const ROUND_INFO: Record<Round["round_type"], { title: string; text: string }> = {
  coding: { title: "Coding round", text: "3 problems, easy to hard. Explain your approach and write code." },
  core: { title: "Core CS round", text: "Computer Networks, DBMS and OOPs questions." },
  hr: { title: "HR and project round", text: "About you, your project and behavioural questions." },
};

const STATUS_TEXT: Record<RoundStatus, string> = {
  pending: "Not started",
  active: "In progress",
  passed: "Passed",
  failed: "Not passed",
};

function scoreLabel(score: number) {
  if (score >= 75) return "Strong";
  if (score >= 55) return "Almost there";
  return "Needs more practice";
}

function isBand(v: unknown): v is Band {
  return v === "under8" || v === "8to10" || v === "above10";
}

export default function InterviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  const [active, setActive] = useState<Interview | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [past, setPast] = useState<PastInterview[]>([]);

  const [band, setBand] = useState<Band>("under8");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

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

      // The student's open interview, if any (RLS shows only their own rows)
      const { data: open } = await supabase
        .from("interviews")
        .select("id, band, expires_at")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (open && isBand(open.band)) {
        setActive({ id: open.id, band: open.band, expires_at: open.expires_at });
        const { data: r } = await supabase
          .from("interview_rounds")
          .select("id, round_type, position, status, score")
          .eq("interview_id", open.id)
          .order("position", { ascending: true });
        setRounds((r ?? []) as Round[]);
        setBand(open.band);
      }

      const { data: older } = await supabase
        .from("interviews")
        .select("id, band, status, final_score, started_at")
        .neq("status", "active")
        .order("started_at", { ascending: false })
        .limit(5);
      setPast((older ?? []) as PastInterview[]);

      setLoading(false);
    }

    load();
  }, [router]);

  async function startInterview() {
    if (starting) return;
    setStarting(true);
    setError("");
    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ band }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          res.status === 429
            ? "You have used both interviews for this month. Please come back next month."
            : data.error ?? "Something went wrong. Please try again."
        );
      } else {
        setActive({ id: data.interviewId, band: data.band, expires_at: data.expiresAt });
        setRounds(
          (data.rounds ?? []).map((r: { id: string; type: Round["round_type"]; position: number; status: RoundStatus; score: number | null }) => ({
            id: r.id,
            round_type: r.type,
            position: r.position,
            status: r.status,
            score: r.score,
          }))
        );
      }
    } catch {
      setError("Could not reach the server. Check your internet and try again.");
    } finally {
      setStarting(false);
    }
  }

  // The round the student can open now: the first one not passed, if all earlier rounds passed.
  const nextRound = rounds.find((r) => r.status === "pending" || r.status === "active");
  const allPassed = rounds.length === 3 && rounds.every((r) => r.status === "passed");

  if (loading) {
    return (
      <div role="status" className="backdrop-wash flex min-h-screen items-center justify-center text-muted">
        Loading...
      </div>
    );
  }

  return (
    <AppShell userName={userName}>
      <h1 className="text-3xl font-semibold sm:text-4xl">Mock Interview</h1>
      <p className="mt-2 max-w-xl text-muted">
        Practise a real-style interview in 3 rounds. Each round has a 1-hour timer.
      </p>

      <p className="mt-4 rounded-control border border-border bg-surface px-4 py-3 text-sm text-muted">
        Scores are AI practice estimates, not a prediction of real selection. The AI reads your code but cannot run it.
        You can take 2 interviews per month. Do not share phone numbers, email or address in your answers.
      </p>

      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}

      {/* No open interview: choose a package */}
      {!active && (
        <section className="glass mt-6 rounded-panel p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Choose your target package</h2>
          <div role="group" aria-label="Target package" className="mt-4 grid gap-3 sm:grid-cols-3">
            {BANDS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBand(b.id)}
                aria-pressed={band === b.id}
                className={`rounded-control border px-4 py-3 text-left transition-colors ${
                  band === b.id
                    ? "border-accent bg-accent text-on-accent"
                    : "border-border bg-surface text-muted hover:text-foreground"
                }`}
              >
                <span className="block font-medium">{b.label}</span>
                <span className="mt-1 block text-xs opacity-90">{b.note}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">Domain: Software (more domains will come later).</p>
          <button
            type="button"
            onClick={startInterview}
            disabled={starting}
            className="mt-4 rounded-control bg-accent px-5 py-3 font-medium text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
          >
            {starting ? "Starting..." : "Start interview"}
          </button>
        </section>
      )}

      {/* Open interview: the 3 rounds */}
      {active && (
        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Your open interview: {BAND_LABEL[active.band]}</h2>
            <span className="text-xs text-muted">
              Open until {new Date(active.expires_at).toLocaleDateString()}
            </span>
          </div>

          <ol className="mt-4 space-y-3">
            {rounds.map((r) => {
              const info = ROUND_INFO[r.round_type];
              const isNext = nextRound?.id === r.id;
              return (
                <li key={r.id} className="glass rounded-panel p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold">
                        Round {r.position}: {info.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted">{info.text}</p>
                    </div>
                    <span className="rounded-full border border-border px-3 py-1 text-xs font-medium">
                      {STATUS_TEXT[r.status]}
                      {r.score !== null ? ` · ${r.score}/100` : ""}
                    </span>
                  </div>
                  {isNext && (
                    <Link
                      href={`/interview/round/${r.id}`}
                      className="mt-3 inline-block rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent transition hover:bg-accent-hover"
                    >
                      {r.status === "active" ? "Resume round" : "Start round"}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>

          {allPassed && (
            <Link
              href={`/interview/report/${active.id}`}
              className="mt-4 inline-block rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent transition hover:bg-accent-hover"
            >
              See final report
            </Link>
          )}
        </section>
      )}

      {/* Earlier interviews */}
      {past.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Earlier interviews</h2>
          <ul className="mt-3 space-y-2">
            {past.map((p) => (
              <li key={p.id} className="glass flex flex-wrap items-center justify-between gap-2 rounded-panel px-4 py-3 text-sm">
                <span>
                  {new Date(p.started_at).toLocaleDateString()} · {BAND_LABEL[p.band] ?? p.band}
                </span>
                <span className="flex items-center gap-3">
                  {p.final_score !== null ? (
                    <span className="text-muted">
                      {p.final_score}/100 · {scoreLabel(p.final_score)}
                    </span>
                  ) : (
                    <span className="text-muted">No report yet</span>
                  )}
                  <Link href={`/interview/report/${p.id}`} className="font-medium text-accent hover:underline">
                    Report
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}