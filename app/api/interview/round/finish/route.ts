// POST /api/interview/round/finish
// Scores a finished round: the AI reads the transcript, the CODE adds up the score,
// and the database saves the result. Calling it again returns the saved report.
// Body: { roundId }
//
// For coding problems where the student submitted code twice, the scoring sees BOTH versions
// (state.firstCodes holds the first one, state.codes the latest).
//
// If the timer ran out and the student sent ZERO answers, the round gets ONE free restart
// (database function restart_round_if_empty). The response is then { restarted: true }.
//
// Save as: app/api/interview/round/finish/route.ts

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateReply, type ChatTurn } from "@/lib/ai/provider";
import { LANGUAGES, type TeacherLanguage } from "@/lib/ai/teacher-prompt";
import {
  buildRoundScoringPrompt,
  buildTranscriptMessage,
  parseRoundReport,
  type Band,
  type RoundReport,
  type RoundType,
} from "@/lib/ai/interview-prompt";
import { summarisePlan, type PlanItem } from "@/lib/ai/interview-plan";

// Scoring can take two AI calls. This lets Vercel wait longer than its default.
export const maxDuration = 60;

function fail(message: string, status: number, detail?: string) {
  const dev = process.env.NODE_ENV !== "production";
  return Response.json({ error: message, ...(dev && detail ? { detail } : {}) }, { status });
}

function isLanguage(v: unknown): v is TeacherLanguage {
  return typeof v === "string" && (LANGUAGES as readonly string[]).includes(v);
}

// Reads a { "0": "text", ... } map from the saved state. Anything else gives an empty map.
function readStringMap(v: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (v && typeof v === "object") {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (typeof val === "string") out[k] = val;
    }
  }
  return out;
}

// Asks the AI to score. One retry if the AI fails or its JSON is unusable.
async function scoreRound(
  roundType: RoundType,
  band: Band,
  language: TeacherLanguage,
  message: ChatTurn
): Promise<RoundReport | null> {
  const system = buildRoundScoringPrompt(roundType, band, language);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await generateReply(system, [message], {
        json: true,
        temperature: 0.2,
        maxTokens: 2500, // room for hidden "thinking" tokens
      });
      const parsed = parseRoundReport(result.text, roundType, band);
      if (parsed.ok) return parsed.report;
      console.error("[interview] score parse failed:", parsed.reason);
    } catch {
      console.error("[interview] score AI call failed");
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
  const roundId = typeof body.roundId === "string" ? body.roundId : "";
  if (!roundId || roundId.length > 64) return fail("Bad request.", 400);

  // 3. Load the student's own round
  const { data: round } = await supabase
    .from("interview_rounds")
    .select("id, interview_id, round_type, position, status, questions, state, deadline, score, report")
    .eq("id", roundId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!round) return fail("Round not found.", 404);

  const passedAlready = round.status === "passed";
  const finishedAlready = passedAlready || round.status === "failed";

  // Already scored: return the saved result (safe to call twice).
  if (finishedAlready) {
    return Response.json({
      alreadyFinished: true,
      score: round.score,
      passed: passedAlready,
      interviewOver: !passedAlready || round.position === 3,
      report: round.report,
    });
  }
  if (round.status !== "active") return fail("This round has not started.", 409);

  // 4. Only finish when all questions are done or the timer has ended
  const state = (round.state ?? {}) as Record<string, unknown>;
  const timeUp = !!round.deadline && Date.parse(round.deadline) < Date.now();
  if (state.phase !== "done" && !timeUp) return fail("The round is not finished yet.", 409);

  const admin = createAdminClient();

  // 4b. Timer ran out and the student answered nothing: one free restart.
  // The database decides (zero user messages, restarts_used < 1, interview still open).
  // If anything goes wrong here we log it and continue to normal scoring.
  if (timeUp && state.phase !== "done") {
    const { data: restarted, error: restartError } = await admin.rpc("restart_round_if_empty", {
      p_user: user.id,
      p_round_id: round.id,
    });
    if (restartError) {
      console.error("[interview] restart error:", restartError.message);
    } else if (restarted === true) {
      return Response.json({ restarted: true });
    }
  }

  const plan = round.questions as PlanItem[] | null;
  if (!plan || plan.length === 0) return fail("Start the round first.", 409);

  const { data: interview } = await supabase
    .from("interviews")
    .select("band")
    .eq("id", round.interview_id)
    .single();
  if (!interview) return fail("Interview not found.", 404);
  const band = interview.band as Band;
  const roundType = round.round_type as RoundType;

  // 5. Language from the student's profile
  let language: TeacherLanguage = "english";
  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_language")
    .eq("id", user.id)
    .maybeSingle();
  if (isLanguage(profile?.ai_language)) language = profile.ai_language;

  // 6. Build the transcript
  const { data: rows } = await supabase
    .from("interview_messages")
    .select("role, content")
    .eq("round_id", round.id)
    .order("created_at", { ascending: true })
    .limit(300);
  const turns = (rows ?? []) as ChatTurn[];

  const codeSubmissions: { title: string; code: string; earlierCode?: string }[] = [];
  const codes = readStringMap(state.codes);
  const firstCodes = readStringMap(state.firstCodes);
  for (const [key, value] of Object.entries(codes)) {
    const item = plan[Number(key)];
    if (item && item.kind === "code" && value.trim()) {
      const earlier = firstCodes[key];
      codeSubmissions.push({
        title: item.question.title,
        code: value,
        ...(earlier && earlier.trim() ? { earlierCode: earlier } : {}),
      });
    }
  }

  const message = buildTranscriptMessage({
    turns,
    questions: plan.map((item) => summarisePlan([item])[0].label),
    codeSubmissions,
  });

  // 7. Score. If the AI fails twice, save nothing: the student can press retry.
  const report = await scoreRound(roundType, band, language, message);
  if (!report) {
    return fail("Could not score this round right now. Please try again in a minute.", 503);
  }

  // 8. Save the result (the database also stops the interview if the round failed)
  const { error: finishError } = await admin.rpc("finish_round", {
    p_user: user.id,
    p_round_id: round.id,
    p_score: report.score,
    p_report: report,
    p_passed: report.passed,
  });
  if (finishError) {
    // A double click may have finished it already. If so, return the saved result.
    const { data: again } = await supabase
      .from("interview_rounds")
      .select("status, score, report, position")
      .eq("id", round.id)
      .maybeSingle();
    if (again && (again.status === "passed" || again.status === "failed")) {
      return Response.json({
        alreadyFinished: true,
        score: again.score,
        passed: again.status === "passed",
        interviewOver: again.status === "failed" || again.position === 3,
        report: again.report,
      });
    }
    console.error("[interview] finish_round error:", finishError.message);
    return fail("Something went wrong. Please try again.", 500, finishError.message);
  }

  // 9. Reply
  return Response.json({
    alreadyFinished: false,
    score: report.score,
    passed: report.passed,
    interviewOver: !report.passed || round.position === 3,
    report,
  });
}