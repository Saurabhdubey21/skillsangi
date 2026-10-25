import { createClient } from "@/lib/supabase/server";
import { generateReply } from "@/lib/ai/provider";
import { LANGUAGES, type TeacherLanguage } from "@/lib/ai/teacher-prompt";
import { buildReviewPrompt } from "@/lib/ai/review-prompt";

const MAX_REVIEW_CODE_CHARS = 8000;
const MAX_PROBLEM_CHARS = 3000;

const LANGUAGE_NAMES: Record<string, string> = {
  c: "C",
  cpp: "C++",
  java: "Java",
  python: "Python",
  javascript: "JavaScript",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function isLanguage(v: unknown): v is TeacherLanguage {
  return typeof v === "string" && (LANGUAGES as readonly string[]).includes(v);
}

// Stop student text from closing our <code> or <problem> markers
function clean(text: string) {
  return text.replace(/<\/?(code|problem)>/gi, "");
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

  const attemptId = typeof body.attemptId === "string" ? body.attemptId : "";
  if (!UUID.test(attemptId)) return fail("Bad request.", 400);

  const problemText = typeof body.problem === "string" ? body.problem.trim() : "";
  if (problemText.length > MAX_PROBLEM_CHARS) {
    return fail(`The problem text is too long. Keep it under ${MAX_PROBLEM_CHARS} characters.`, 400);
  }
  const wantsFullFix = body.fullFix === true;

  // 3. Load the saved attempt (the database only returns this student's own)
  const { data: attempt } = await supabase
    .from("code_attempts")
    .select("id, question_id, language, code, ai_feedback")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt) return fail("Attempt not found. Please save your code first.", 404);

  if (attempt.code.length > MAX_REVIEW_CODE_CHARS) {
    return fail(
      `This code is too long to review. Keep it under ${MAX_REVIEW_CODE_CHARS} characters.`,
      400
    );
  }

  // The full fix is only allowed after a normal review of the same attempt
  if (wantsFullFix && !attempt.ai_feedback) {
    return fail("Please get a hint review first. Then you can ask for the full fix.", 400);
  }

  // 4. Daily limit (shared with the chat). The limit lives INSIDE the database
  // function, so the browser cannot choose it. We only read it to show it.
  const { data: used, error: usageError } = await supabase.rpc("bump_ai_usage");
  if (usageError) {
    console.error("[review] usage error:", usageError.message);
    return fail("Something went wrong. Please try again.", 500);
  }
  const { data: limitData } = await supabase.rpc("ai_daily_limit");
  const limit = typeof limitData === "number" ? limitData : 30;
  if (used === -1) {
    return fail(`Daily limit of ${limit} messages reached. Please come back tomorrow.`, 429);
  }

  // 5. Language comes from the student's own profile. Fall back to English.
  let language: TeacherLanguage = "english";
  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_language")
    .eq("id", user.id)
    .maybeSingle();
  if (isLanguage(profile?.ai_language)) language = profile.ai_language;

  // 6. The question title (title only, never a statement)
  let questionTitle = "";
  if (attempt.question_id) {
    const { data: q } = await supabase
      .from("questions")
      .select("title")
      .eq("id", attempt.question_id)
      .maybeSingle();
    if (q?.title) questionTitle = String(q.title);
  }

  // 7. Build the message: numbered code, marked as data
  const numbered = clean(attempt.code)
    .split(/\r?\n/)
    .map((line: string, i: number) => `${i + 1}: ${line}`)
    .join("\n");

  const parts = [
    `Programming language: ${LANGUAGE_NAMES[attempt.language] ?? attempt.language}`,
    questionTitle ? `Question title: ${clean(questionTitle)}` : "Question title: not given",
  ];
  if (problemText) parts.push(`<problem>\n${clean(problemText)}\n</problem>`);
  parts.push(`<code>\n${numbered}\n</code>`);

  // 8. Ask the AI
  let result;
  try {
    result = await generateReply(
      buildReviewPrompt(language, wantsFullFix, problemText.length > 0),
      [{ role: "user", content: parts.join("\n\n") }]
    );
  } catch {
    return fail("The AI is busy right now. Please try again in a minute.", 503);
  }

  // Token log, so you can see costs. No code or student text is logged.
  console.log(
    `[review] provider=${result.provider} model=${result.model ?? "?"} in=${result.inputTokens ?? "?"} out=${result.outputTokens ?? "?"} fullFix=${wantsFullFix}`
  );

  // 9. Save a normal review on the attempt. A full fix is returned but not saved.
  if (!wantsFullFix) {
    const { error: saveError } = await supabase
      .from("code_attempts")
      .update({ ai_feedback: result.text.slice(0, 10000) })
      .eq("id", attempt.id);
    if (saveError) console.error("[review] save error:", saveError.message);
  }

  // 10. Send the review back
  return Response.json({
    review: result.text,
    fullFix: wantsFullFix,
    canAskFullFix: !wantsFullFix,
    usedToday: used,
    dailyLimit: limit,
  });
}