// POST /api/interview/round/start
// Starts a round (sets the 60-minute timer in the database) and picks its questions.
// Calling it again for the same round RESUMES it: same deadline, same questions.
// Body: { roundId: "<uuid from /api/interview/start>" }
//
// Save as: app/api/interview/round/start/route.ts

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CODING_PLAN, ROUND_LABEL, ROUND_MINUTES, type Band, type RoundType } from "@/lib/ai/interview-prompt";
import {
  buildCodingPlan,
  buildCorePlan,
  buildHrPlan,
  summarisePlan,
  type PlanItem,
  type QuestionRow,
} from "@/lib/ai/interview-plan";

const COLUMNS = "id, title, difficulty, topic_id, topic, url, platform";

function fail(message: string, status: number, detail?: string) {
  const dev = process.env.NODE_ENV !== "production";
  return Response.json({ error: message, ...(dev && detail ? { detail } : {}) }, { status });
}

type Admin = ReturnType<typeof createAdminClient>;

// Active DSA questions of the given topics and difficulties.
// One query per difficulty, because Supabase returns at most 1000 rows per query.
async function fetchDsa(admin: Admin, topics: string[], difficulties: string[]): Promise<QuestionRow[]> {
  const all: QuestionRow[] = [];
  for (const difficulty of difficulties) {
    const { data, error } = await admin
      .from("questions")
      .select(COLUMNS)
      .eq("subject", "dsa")
      .or("is_active.is.null,is_active.eq.true")
      .eq("difficulty", difficulty)
      .in("topic_id", topics)
      .limit(1000);
    if (error) throw new Error(error.message);
    all.push(...((data ?? []) as QuestionRow[]));
  }
  return all;
}

async function fetchDesignQuestions(admin: Admin): Promise<QuestionRow[]> {
  const { data, error } = await admin
    .from("questions")
    .select(COLUMNS)
    .in("subject", ["hld", "lld"])
    .or("is_active.is.null,is_active.eq.true")
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as QuestionRow[];
}

async function buildPlan(admin: Admin, round: RoundType, band: Band): Promise<PlanItem[]> {
  if (round === "coding") {
    const plan = CODING_PLAN[band];
    const codeRows = await fetchDsa(admin, plan.topics, ["easy", "medium", "hard"]);
    const voiceRows =
      plan.voiceQuestions > 0 ? await fetchDsa(admin, plan.voiceTopics, ["medium", "hard"]) : [];
    return buildCodingPlan(band, codeRows, voiceRows);
  }
  if (round === "core") {
    const designRows = band === "above10" ? await fetchDesignQuestions(admin) : [];
    return buildCorePlan(band, designRows);
  }
  return buildHrPlan();
}

export async function POST(request: Request) {
  // 1. Login check
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return fail("Please log in.", 401);

  // 2. Read and check the request
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Bad request.", 400);
  }
  const roundId = typeof body.roundId === "string" ? body.roundId : "";
  if (!roundId || roundId.length > 64) return fail("Bad request.", 400);

  // 3. Make sure this is the student's own round
  const { data: round } = await supabase
    .from("interview_rounds")
    .select("id, interview_id, round_type, position, questions")
    .eq("id", roundId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!round) return fail("Round not found.", 404);

  const { data: interview } = await supabase
    .from("interviews")
    .select("band")
    .eq("id", round.interview_id)
    .single();
  if (!interview) return fail("Interview not found.", 404);
  const band = interview.band as Band;
  const roundType = round.round_type as RoundType;

  // 4. Start the round. The database sets the 60-minute deadline and checks the order of rounds.
  const { data: deadline, error: startError } = await supabase.rpc("start_round", {
    p_round_id: round.id,
  });
  if (startError) {
    const m = startError.message;
    if (m.includes("previous round")) return fail("Finish the previous round first.", 409);
    if (m.includes("not open")) return fail("This interview has ended or expired.", 410);
    if (m.includes("already finished")) return fail("This round is already finished.", 409);
    console.error("[interview] start_round error:", m);
    return fail("Something went wrong. Please try again.", 500,m);
  }

  // 5. Pick the questions the FIRST time only. Later calls reuse the saved plan.
  let plan = round.questions as PlanItem[] | null;
  if (!plan) {
    try {
      const admin = createAdminClient();
      const fresh = await buildPlan(admin, roundType, band);
      if (fresh.length === 0) return fail("Could not find questions for this round.", 500);

      // "is null" makes sure two quick requests cannot overwrite each other's plan.
      const { error: saveError } = await admin
        .from("interview_rounds")
        .update({ questions: fresh, state: { index: 0, phase: "intro", followUpsUsed: 0 } })
        .eq("id", round.id)
        .eq("user_id", user.id)
        .is("questions", null);
      if (saveError) throw new Error(saveError.message);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "unknown";
      console.error("[interview] plan error:", reason);
      return fail("Something went wrong. Please try again.", 500, reason);
    }

    // Read the saved plan back (it may be the other request's plan, which is fine).
    const { data: saved } = await supabase
      .from("interview_rounds")
      .select("questions")
      .eq("id", round.id)
      .single();
    plan = (saved?.questions as PlanItem[] | null) ?? null;
    if (!plan) return fail("Something went wrong. Please try again.", 500);
  }

  // 6. Reply (only the safe summary, never the full plan)
  return Response.json({
    roundId: round.id,
    type: roundType,
    title: ROUND_LABEL[roundType],
    minutes: ROUND_MINUTES,
    deadline,
    total: plan.length,
    items: summarisePlan(plan),
  });
}