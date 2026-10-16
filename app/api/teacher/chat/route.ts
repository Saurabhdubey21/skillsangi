import { createClient } from "@/lib/supabase/server";
import { generateReply, type ChatTurn } from "@/lib/ai/provider";
import { getRoadmapContext } from "@/lib/ai/roadmap-context";
import {
  buildSystemPrompt,
  MODES,
  LANGUAGES,
  HINT_LEVELS,
  type TeacherMode,
  type TeacherLanguage,
  type HintLevel,
} from "@/lib/ai/teacher-prompt";

const MAX_CHARS = 2000;
const CONTEXT_MESSAGES = 10;

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function isMode(v: unknown): v is TeacherMode {
  return typeof v === "string" && (MODES as readonly string[]).includes(v);
}
function isLanguage(v: unknown): v is TeacherLanguage {
  return typeof v === "string" && (LANGUAGES as readonly string[]).includes(v);
}
function isHintLevel(v: unknown): v is HintLevel {
  return typeof v === "number" && (HINT_LEVELS as readonly number[]).includes(v);
}

export async function POST(request: Request) {
  // 1. Login check
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return fail("Please log in.", 401);

  // 2. Read and check the message
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("Bad request.", 400);
  }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return fail("Please type a message.", 400);
  if (message.length > MAX_CHARS) {
    return fail(`Message is too long. Keep it under ${MAX_CHARS} characters.`, 400);
  }

  // 3. If continuing a chat, make sure it is this student's thread
  let threadId = typeof body.threadId === "string" ? body.threadId : null;
  let mode: TeacherMode = isMode(body.mode) ? body.mode : "beginner";
  // Language is not stored on the thread yet; it comes from the request.
  const language: TeacherLanguage = isLanguage(body.language) ? body.language : "english";
  // Highest hint level already used in this chat (0 for a new chat)
  let currentHint = 0;

  if (threadId) {
    const { data: thread } = await supabase
      .from("chat_threads")
      .select("id, mode, hint_level")
      .eq("id", threadId)
      .maybeSingle();
    if (!thread) return fail("Chat not found.", 404);
    if (isMode(thread.mode)) mode = thread.mode;
    currentHint = Number(thread.hint_level) || 0;
  }

  // The hint ladder: the student can only go one step up at a time.
  // 0 means a normal message (no hint). Level 4 is only reachable after level 3.
  const requestedHint: HintLevel = isHintLevel(body.hintLevel) ? body.hintLevel : 0;
  const hintLevel = (
    requestedHint === 0 ? 0 : Math.min(requestedHint, currentHint + 1)
  ) as HintLevel;

  // 4. Daily limit (the database function counts it safely)
  const limit = Number(process.env.AI_DAILY_LIMIT) || 30;
  const { data: used, error: usageError } = await supabase.rpc("bump_ai_usage", {
    p_limit: limit,
  });
  if (usageError) {
    console.error("[teacher] usage error:", usageError.message);
    return fail("Something went wrong. Please try again.", 500);
  }
  if (used === -1) {
    return fail(`Daily limit of ${limit} messages reached. Please come back tomorrow.`, 429);
  }

  // 5. Create the thread if this is a new chat
  if (!threadId) {
    const { data: created, error: threadError } = await supabase
      .from("chat_threads")
      .insert({ user_id: user.id, title: message.slice(0, 60), mode })
      .select("id")
      .single();
    if (threadError || !created) {
      console.error("[teacher] thread error:", threadError?.message);
      return fail("Something went wrong. Please try again.", 500);
    }
    threadId = created.id;
  }

  // 6. Last messages as context (9 old + the new one = 10)
  const { data: rows } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(CONTEXT_MESSAGES - 1);

  const history = ((rows ?? []) as ChatTurn[]).reverse();
  while (history.length > 0 && history[0].role !== "user") history.shift();
  const messages: ChatTurn[] = [...history, { role: "user", content: message }];

  // 7. Ask the AI (with a short summary of the student's roadmap)
  const roadmapContext = await getRoadmapContext(supabase, user.id);

  let result;
  try {
    result = await generateReply(
      buildSystemPrompt(mode, language, roadmapContext, hintLevel),
      messages
    );
  } catch {
    return fail("The AI is busy right now. Please try again in a minute.", 503);
  }

  // 8. Save both messages
  const now = Date.now();
  const { data: saved, error: saveError } = await supabase
    .from("chat_messages")
    .insert([
      {
        thread_id: threadId,
        user_id: user.id,
        role: "user",
        content: message,
        hint_level: hintLevel,
        created_at: new Date(now).toISOString(),
      },
      {
        thread_id: threadId,
        user_id: user.id,
        role: "assistant",
        content: result.text,
        hint_level: hintLevel,
        provider: result.provider,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
        created_at: new Date(now + 1).toISOString(),
      },
    ])
    .select("id, role");
  if (saveError) {
    console.error("[teacher] save error:", saveError.message);
    return fail("Something went wrong. Please try again.", 500);
  }

  // The chat remembers the highest hint level used so far
  const threadHintLevel = Math.max(currentHint, hintLevel);
  await supabase
    .from("chat_threads")
    .update({
      updated_at: new Date().toISOString(),
      hint_level: threadHintLevel,
    })
    .eq("id", threadId);

  // 9. Send the reply back
  const assistantRow = saved?.find((r) => r.role === "assistant");
  return Response.json({
    threadId,
    messageId: assistantRow?.id ?? null,
    reply: result.text,
    usedToday: used,
    dailyLimit: limit,
    hintLevel,
    threadHintLevel,
  });
}