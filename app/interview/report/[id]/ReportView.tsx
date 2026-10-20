"use client";

// The final report screen: /interview/report/<interview id>
// Save as: app/interview/report/[id]/page.tsx

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import AppShell from "../../../components/AppShell";

type Band = "under8" | "8to10" | "above10";

type Report = {
  summary?: string;
  workOn?: { area: string; why: string; action: string }[];
  nextTwoWeeks?: string[];
  encouragement?: string;
  finalScore?: number;
  label?: string;
  band?: Band;
  stoppedAfter?: string | null;
  rounds?: { round: string; score: number; passed: boolean; passMark: number }[];
  weakTopics?: string[];
  note?: string;
};

const BAND_LABEL: Record<Band, string> = {
  under8: "Under 8 LPA",
  "8to10": "8 to 10 LPA",
  above10: "Above 10 LPA",
};

const ROUND_NAME: Record<string, string> = {
  coding: "Coding round",
  core: "Core CS round",
  hr: "HR and project round",
};

export default function ReportView() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const interviewId = typeof params?.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [band, setBand] = useState<Band | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [notOver, setNotOver] = useState(false);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState("");

  // Asks the server to write the report (only works when the interview is over).
  const writeReport = useCallback(async () => {
    setWriting(true);
    setError("");
    try {
      const res = await fetch("/api/interview/final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) setNotOver(true);
        else setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setBand(data.band ?? null);
        setFinalScore(typeof data.finalScore === "number" ? data.finalScore : null);
        setReport(data.report as Report);
      }
    } catch {
      setError("Could not reach the server. Check your internet and try again.");
    } finally {
      setWriting(false);
    }
  }, [interviewId]);

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

      const { data: interview } = await supabase
        .from("interviews")
        .select("id, band, status, final_score, final_report")
        .eq("id", interviewId)
        .maybeSingle();

      if (!interview) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setBand(interview.band as Band);
      setFinalScore(interview.final_score);

      if (interview.final_report) {
        setReport(interview.final_report as Report);
        setLoading(false);
        return;
      }

      // No report yet. Only ask for one if the interview is really over.
      const { data: rounds } = await supabase
        .from("interview_rounds")
        .select("status")
        .eq("interview_id", interview.id);
      const list = rounds ?? [];
      const over =
        list.some((r) => r.status === "failed") ||
        (list.length === 3 && list.every((r) => r.status === "passed"));

      setLoading(false);
      if (over) {
        writeReport();
      } else {
        setNotOver(true);
      }
    }

    if (interviewId) load();
  }, [interviewId, router, writeReport]);

  if (loading) {
    return (
      <div role="status" className="backdrop-wash flex min-h-screen items-center justify-center text-muted">
        Loading...
      </div>
    );
  }

  const score = report?.finalScore ?? finalScore;

  return (
    <AppShell userName={userName}>
      <Link href="/interview" className="text-sm font-medium text-accent hover:underline">
        Back to Mock Interview
      </Link>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Interview report</h1>
      {band && <p className="mt-2 text-muted">Target package: {BAND_LABEL[band]}</p>}

      {notFound && (
        <p role="alert" className="mt-6 text-danger">
          Interview not found.
        </p>
      )}

      {notOver && (
        <p className="glass mt-6 rounded-panel p-4 text-sm text-muted">
          This interview is not over yet. Finish your rounds first, and the report will appear here.
        </p>
      )}

      {writing && (
        <p role="status" className="mt-6 text-muted">
          Writing your report... this can take up to 30 seconds.
        </p>
      )}

      {error && (
        <div className="mt-6">
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
          <button
            type="button"
            onClick={writeReport}
            disabled={writing}
            className="mt-3 rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
          >
            Try again
          </button>
        </div>
      )}

      {report && (
        <div className="mt-6 space-y-4">
          <section className="glass rounded-panel p-4 sm:p-6">
            <p className="text-sm text-muted">Final score</p>
            <p className="mt-1 text-5xl font-semibold">
              {score ?? 0}
              <span className="text-xl text-muted"> / 100</span>
            </p>
            {report.label && <p className="mt-2 font-medium text-accent">{report.label}</p>}
            {report.stoppedAfter && (
              <p className="mt-2 text-sm text-muted">
                The interview stopped after the {ROUND_NAME[report.stoppedAfter] ?? report.stoppedAfter} because the
                pass mark was not reached. Rounds not reached count as 0.
              </p>
            )}
            <p className="mt-3 rounded-control border border-border bg-surface px-3 py-2 text-xs text-muted">
              {report.note ?? "AI estimate for practice. Not a prediction of real selection."}
            </p>
          </section>

          {(report.rounds ?? []).length > 0 && (
            <section className="glass rounded-panel p-4 sm:p-6">
              <h2 className="text-lg font-semibold">Round scores</h2>
              <ul className="mt-3 space-y-2">
                {(report.rounds ?? []).map((r) => (
                  <li key={r.round} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>{ROUND_NAME[r.round] ?? r.round}</span>
                    <span className="text-muted">
                      {r.score}/100 · pass mark {r.passMark} · {r.passed ? "Passed" : "Not passed"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {report.summary && (
            <section className="glass rounded-panel p-4 sm:p-6">
              <h2 className="text-lg font-semibold">Summary</h2>
              <p className="mt-2 text-sm leading-relaxed">{report.summary}</p>
            </section>
          )}

          {(report.workOn ?? []).length > 0 && (
            <section className="glass rounded-panel p-4 sm:p-6">
              <h2 className="text-lg font-semibold">Work on this</h2>
              <ul className="mt-3 space-y-4">
                {(report.workOn ?? []).map((w, i) => (
                  <li key={i}>
                    <p className="font-medium">{w.area}</p>
                    <p className="mt-1 text-sm text-muted">{w.why}</p>
                    <p className="mt-1 text-sm">
                      <span className="font-medium">This week: </span>
                      {w.action}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(report.nextTwoWeeks ?? []).length > 0 && (
            <section className="glass rounded-panel p-4 sm:p-6">
              <h2 className="text-lg font-semibold">Your next two weeks</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
                {(report.nextTwoWeeks ?? []).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ol>
            </section>
          )}

          {(report.weakTopics ?? []).length > 0 && (
            <section className="glass rounded-panel p-4 sm:p-6">
              <h2 className="text-lg font-semibold">Weak topics</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(report.weakTopics ?? []).map((t) => (
                  <span key={t} className="rounded-full border border-border bg-surface px-3 py-1 text-xs">
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {report.encouragement && <p className="text-sm text-muted">{report.encouragement}</p>}
        </div>
      )}
    </AppShell>
  );
}