// POST /api/interview/final
// Builds the final report once the interview is over (a round failed, or all 3 rounds passed).
// The CODE computes the final score; the AI only writes the advice. Safe to call twice.
// Body: { interviewId }
//
// Save as: app/api/interview/final/route.ts

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateReply } from "@/lib/ai/provider";
import { LANGUAGES, type TeacherLanguage } from "@/lib/ai/teacher-prompt";
import {
  buildFinalReportMessage,
  buildFinalReportPrompt,
  computeFinalScore,
  parseFinalReport,
  scoreLabel,
  type Band,
  type FinalReport,
  type FinishedRound,
  type RoundReport,
  type RoundType,
} from "@/lib/ai/interview-prompt";

export const maxDuration = 60;

type RoundRow = {
  round_type: RoundType;
  position: number;
  status: string;
  score: number | null;
  report: RoundReport | null;
};

function fail(message: string, status: number, detail?: string) {
  const dev = process.env.NODE_ENV !== "production";
  return Response.json({ error: message, ...(dev && detail ? { detail } : {}) }, { status });
}

function isLanguage(v: unknown): v is TeacherLanguage {
  return typeof v === "string" && (LANGUAGES as readonly string[]).includes(v);
}

async function writeFinalReport(
  band: Band,
  language: TeacherLanguage,
  rounds: FinishedRound[],
  stoppedAfter?: RoundType
): Promise<FinalReport | null> {
  const system = buildFinalReportPrompt(language);
  const message = buildFinalReportMessage(band, rounds, stoppedAfter);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await generateReply(system, [message], {
        json: true,
        temperature: 0.3,
        maxTokens: 2500,
      });
      const parsed = parseFinalReport(result.text);
      if (parsed.ok) return parsed.report;
      console.error("[interview] final parse failed:", parsed.reason);
    } catch {
      console.error("[interview] final AI call failed");
    }
  }
  return null;
}

export async function POST(request: Request) {
  // 1. Login check
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return fail("Please log in.", 401);

  // 2. Read the request
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Bad request.", 400);
  }
  const interviewId = typeof body.interviewId === "string" ? body.interviewId : "";
  if (!interviewId || interviewId.length > 64) return fail("Bad request.", 400);

  // 3. Load the student's own interview
  const { data: interview } = await supabase
    .from("interviews")
    .select("id, band, status, final_score, final_report")
    .eq("id", interviewId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!interview) return fail("Interview not found.", 404);

  // Already done: return the saved report (no AI call).
  if (interview.final_report) {
    return Response.json({
      alreadyFinished: true,
      band: interview.band,
      status: interview.status,
      finalScore: interview.final_score,
      report: interview.final_report,
    });
  }

  // 4. Load the rounds and check the interview is really over
  const { data: roundRows } = await supabase
    .from("interview_rounds")
    .select("round_type, position, status, score, report")
    .eq("interview_id", interview.id)
    .eq("user_id", user.id)
    .order("position", { ascending: true });
  const rounds = (roundRows ?? []) as RoundRow[];

  const failedRound = rounds.find((r) => r.status === "failed");
  const allPassed = rounds.length === 3 && rounds.every((r) => r.status === "passed");
  if (!failedRound && !allPassed) {
    return fail("The interview is not over yet. Finish the current round first.", 409);
  }

  const band = interview.band as Band;
  const finished: FinishedRound[] = rounds
    .filter((r) => (r.status === "passed" || r.status === "failed") && r.report && r.score !== null)
    .map((r) => ({ round: r.round_type, score: r.score as number, report: r.report as RoundReport }));
  if (finished.length === 0) return fail("No scored rounds found.", 409);

  // 5. The CODE computes the final score. A round never reached counts as 0.
  const scores: Partial<Record<RoundType, number>> = {};
  for (const r of finished) scores[r.round] = r.score;
  const finalScore = computeFinalScore(scores);
  const stoppedAfter = failedRound ? failedRound.round_type : undefined;

  // 6. Language from the student's profile
  let language: TeacherLanguage = "english";
  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_language")
    .eq("id", user.id)
    .maybeSingle();
  if (isLanguage(profile?.ai_language)) language = profile.ai_language;

  // 7. The AI writes the advice (one retry). If it fails twice, nothing is saved: the student can retry.
  const advice = await writeFinalReport(band, language, finished, stoppedAfter);
  if (!advice) return fail("Could not write the final report right now. Please try again in a minute.", 503);

  const fullReport = {
    ...advice,
    finalScore,
    label: scoreLabel(finalScore),
    band,
    stoppedAfter: stoppedAfter ?? null,
    rounds: finished.map((r) => ({
      round: r.round,
      score: r.score,
      passed: r.report.passed,
      passMark: r.report.passMark,
    })),
    weakTopics: Array.from(new Set(finished.flatMap((r) => r.report.weakTopics))).slice(0, 8),
    note: "AI estimate for practice. Not a prediction of real selection.",
  };

  // 8. Save. The database function returns nothing, so we read the result back afterwards.
  const admin = createAdminClient();
  const { error: saveError } = await admin.rpc("finish_interview", {
    p_user: user.id,
    p_id: interview.id,
    p_final_score: finalScore,
    p_final_report: fullReport,
  });
  if (saveError) {
    console.error("[interview] finish_interview error:", saveError.message);
    return fail("Something went wrong. Please try again.", 500, saveError.message);
  }

  const { data: saved } = await supabase
    .from("interviews")
    .select("status, final_score, final_report")
    .eq("id", interview.id)
    .maybeSingle();
  if (!saved?.final_report) {
    return fail("Something went wrong. Please try again.", 500, "final report was not saved");
  }

  // 9. Reply (if a double click saved first, this is that saved report)
  return Response.json({
    alreadyFinished: false,
    band,
    status: saved.status,
    finalScore: saved.final_score,
    report: saved.final_report,
  });
}