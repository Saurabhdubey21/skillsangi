// POST /api/interview/start
// Creates a mock interview (or resumes the open one) and returns its 3 rounds.
// Body: { band: "under8" | "8to10" | "above10", domain?: "software" }
//
// Save as: app/api/interview/start/route.ts

import { createClient } from "@/lib/supabase/server";
import { BANDS, type Band } from "@/lib/ai/interview-prompt";
import { trackServer } from "@/lib/admin/track";

const MONTHLY_LIMIT = 2; // must match start_interview() in 004_interviews.sql

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function isBand(v: unknown): v is Band {
  return typeof v === "string" && (BANDS as readonly string[]).includes(v);
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
  if (!isBand(body.band)) return fail("Please choose a package.", 400);
  const band: Band = body.band;

  const domain = body.domain === undefined ? "software" : body.domain;
  if (domain !== "software") {
    return fail("Only software development interviews are available right now.", 400);
  }

  // 3. Is there already an open interview? (then this request resumes it)
  const { data: open } = await supabase
    .from("interviews")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();
  const resumed = Boolean(open);

  // 4. Start or resume. The monthly limit is enforced inside the database function.
  const { data: interviewId, error: startError } = await supabase.rpc("start_interview", {
    p_domain: domain,
    p_band: band,
  });
  if (startError) {
    console.error("[interview] start error:", startError.message);
    return fail("Something went wrong. Please try again.", 500);
  }
  if (!interviewId) {
    return fail(
      `You have used your ${MONTHLY_LIMIT} mock interviews for this month. The limit resets on the 1st.`,
      429
    );
  }

  // Admin analytics: count only brand-new interviews, never resumes.
  // trackServer never throws, so it cannot break the start. No answers or resume text here.
  if (!resumed) {
    await trackServer("mock_interview_started", { band });
  }

  // 5. Read back the interview and its rounds (row-level security lets students read their own)
  const { data: interview, error: readError } = await supabase
    .from("interviews")
    .select("id, band, status, expires_at")
    .eq("id", interviewId)
    .single();
  const { data: rounds, error: roundsError } = await supabase
    .from("interview_rounds")
    .select("id, round_type, position, status, deadline, score")
    .eq("interview_id", interviewId)
    .order("position", { ascending: true });
  if (readError || roundsError || !interview || !rounds) {
    console.error("[interview] read error:", readError?.message ?? roundsError?.message);
    return fail("Something went wrong. Please try again.", 500);
  }

  // 6. Reply. If a student resumes an older interview, its package may differ from the one they picked.
  return Response.json({
    interviewId: interview.id,
    band: interview.band,
    resumed,
    bandChanged: interview.band !== band,
    expiresAt: interview.expires_at,
    rounds: rounds.map((r) => ({
      id: r.id,
      type: r.round_type,
      position: r.position,
      status: r.status,
      deadline: r.deadline,
      score: r.score,
    })),
  });
}