// POST /api/interview/round/answer
// One turn of the interview. The SERVER decides what happens next; the AI only writes the reply text.
//
// Body: { roundId, action?: "begin" | "answer" | "next", message?, code?, projectDetails? }
//   begin  : the student is ready. The AI greets and asks question 1. (no message needed)
//   answer : the student answers. If follow-ups are left, the AI asks one. If not, the next question comes.
//   next   : the student skips the rest of this question. The next question comes. (no message needed)
//
// Coding questions (kind "code") run in three stages, kept in the saved state:
//   approach : the AI asked for the approach. The student's next answer opens the code stage
//              with a fixed reply (no AI call). Code is rejected in this stage.
//   code     : the code editor is open. Only a code submission is accepted (words are rejected).
//   review   : the AI has read the code. The student answers in words, or submits one improved
//              version (MAX_CODE_SUBMISSIONS in total). A code submission counts as a follow-up.
//
// Project details are cleaned here (emails, phone numbers, links removed) before they are saved
// or sent to the AI. If projectDetails is sent as an empty string, the saved text is cleared.
//
// Save as: app/api/interview/round/answer/route.ts

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateReply, type ChatTurn } from "@/lib/ai/provider";
import { LANGUAGES, type TeacherLanguage } from "@/lib/ai/teacher-prompt";
import {
  buildInterviewerPrompt,
  FOLLOW_UPS,
  LIMITS,
  MAX_CODE_SUBMISSIONS,
  type Band,
  type InterviewerContext,
  type InterviewPhase,
  type RoundType,
} from "@/lib/ai/interview-prompt";
import { summarisePlan, type PlanItem } from "@/lib/ai/interview-plan";
import { cleanResumeText } from "@/lib/resume-clean";

const CONTEXT_MESSAGES = 10;
const ACTIONS = ["begin", "answer", "next"] as const;
type Action = (typeof ACTIONS)[number];

type CodeStage = "approach" | "code" | "review";

// What we keep in interview_rounds.state. The start route creates it as
// { index: 0, phase: "intro", followUpsUsed: 0 }; the other fields get defaults when read.
type StoredState = {
  index: number;
  phase: "intro" | "answering" | "done";
  followUpsUsed: number;
  codes: Record<string, string>; // latest code per question index
  firstCodes: Record<string, string>; // the first version, kept when an improved version is submitted
  projectDetails: string;
  codeStage: CodeStage; // only meaningful while the current question is a coding question
  codeCount: number; // code submissions for the current question
  canSubmitCode: boolean; // is the code editor open right now? (the screen reads this)
};

const WRAPUP_TEXT: Record<TeacherLanguage, string> = {
  english: "Thank you, that is the end of this round. Your report will appear on the screen.",
  hinglish: "Thank you, yahan is round ka end hota hai. Aapki report screen par dikhegi.",
};

// Fixed reply after the student has explained the approach (no AI call).
const APPROACH_DONE_TEXT: Record<TeacherLanguage, string> = {
  english: "Thanks. Now write your code in the editor below and press Submit code.",
  hinglish: "Thanks. Ab neeche editor mein apna code likhiye aur Submit code dabaiye.",
};

function fail(message: string, status: number, detail?: string) {
  const dev = process.env.NODE_ENV !== "production";
  return Response.json({ error: message, ...(dev && detail ? { detail } : {}) }, { status });
}

function isLanguage(v: unknown): v is TeacherLanguage {
  return typeof v === "string" && (LANGUAGES as readonly string[]).includes(v);
}

function readStringMap(v: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (v && typeof v === "object") {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (typeof val === "string") out[k] = val;
    }
  }
  return out;
}

function parseState(v: unknown): StoredState | null {
  if (!v || typeof v !== "object") return null;
  const s = v as Record<string, unknown>;
  const index = Number(s.index);
  const used = Number(s.followUpsUsed);
  if (!Number.isInteger(index) || index < 0 || !Number.isInteger(used) || used < 0) return null;
  if (s.phase !== "intro" && s.phase !== "answering" && s.phase !== "done") return null;
  const count = Number(s.codeCount);
  return {
    index,
    phase: s.phase,
    followUpsUsed: used,
    codes: readStringMap(s.codes),
    firstCodes: readStringMap(s.firstCodes),
    projectDetails: typeof s.projectDetails === "string" ? s.projectDetails : "",
    codeStage: s.codeStage === "code" || s.codeStage === "review" ? s.codeStage : "approach",
    codeCount: Number.isInteger(count) && count >= 0 ? count : 0,
    canSubmitCode: s.canSubmitCode === true,
  };
}

function budgetFor(item: PlanItem): number {
  switch (item.kind) {
    case "code":
      return FOLLOW_UPS.coding;
    case "voice":
      return FOLLOW_UPS.voice;
    case "core":
      return FOLLOW_UPS.core;
    case "systemdesign":
      return FOLLOW_UPS.systemdesign;
    case "hr":
      return FOLLOW_UPS.hr;
  }
}

// The part of the interviewer context that depends on the current question.
function itemContext(
  item: PlanItem,
  state: StoredState,
  index: number,
  justSubmitted: boolean
): Partial<InterviewerContext> {
  if (item.kind === "code" || item.kind === "voice") {
    const q = item.question;
    const isCode = item.kind === "code";
    const key = String(index);
    return {
      question: { title: q.title, difficulty: q.difficulty, topic: q.topic },
      voiceOnly: !isCode,
      studentCode: isCode ? state.codes[key] : undefined,
      previousCode: isCode && state.codeCount >= 2 ? state.firstCodes[key] : undefined,
      codeSubmissions: isCode ? state.codeCount : 0,
      codeJustSubmitted: isCode ? justSubmitted : false,
      canSubmitAgain: isCode ? state.canSubmitCode : false,
    };
  }
  if (item.kind === "core") return { coreTopic: item.coreTopic };
  if (item.kind === "systemdesign") {
    const q = item.question;
    return {
      coreTopic: "systemdesign",
      question: q ? { title: q.title, difficulty: q.difficulty, topic: q.topic } : undefined,
    };
  }
  if (item.kind !== "hr") return {};
  return { hrSection: item.hrSection, projectDetails: state.projectDetails };
}

// Some AI providers dislike two turns in a row from the same side, so join them.
function mergeTurns(turns: ChatTurn[]): ChatTurn[] {
  const out: ChatTurn[] = [];
  for (const t of turns) {
    const last = out[out.length - 1];
    if (last && last.role === t.role) last.content += "\n" + t.content;
    else out.push({ role: t.role, content: t.content });
  }
  return out;
}

type Admin = ReturnType<typeof createAdminClient>;

async function addMessage(admin: Admin, userId: string, roundId: string, role: "user" | "assistant", content: string) {
  const { error } = await admin.rpc("add_message", {
    p_user: userId,
    p_round_id: roundId,
    p_role: role,
    p_content: content,
  });
  return error ? error.message : null;
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

  const action: Action = body.action === undefined ? "answer" : (body.action as Action);
  if (!(ACTIONS as readonly string[]).includes(action)) return fail("Bad request.", 400);

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length > LIMITS.answerChars) {
    return fail(`Answer is too long. Keep it under ${LIMITS.answerChars} characters.`, 400);
  }
  if (action === "answer" && !message) return fail("Please type or speak your answer.", 400);

  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (code.length > LIMITS.codeChars) {
    return fail(`Code is too long. Keep it under ${LIMITS.codeChars} characters.`, 400);
  }

  // Project details: if the browser sent this field (even empty), it replaces the saved text.
  const projectSent = typeof body.projectDetails === "string";
  const projectRaw = projectSent ? (body.projectDetails as string).trim() : "";
  if (projectRaw.length > LIMITS.projectChars) {
    return fail(`Project details are too long. Keep them under ${LIMITS.projectChars} characters.`, 400);
  }
  // Remove emails, phone numbers and links here too, in case the text did not go through the resume box.
  const projectClean = projectSent ? cleanResumeText(projectRaw, LIMITS.projectChars).text : "";

  // 3. Load the student's own round (the database only shows them their own rows)
  const { data: round } = await supabase
    .from("interview_rounds")
    .select("id, interview_id, round_type, status, questions, state, deadline")
    .eq("id", roundId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!round) return fail("Round not found.", 404);
  if (round.status !== "active") return fail("This round is not active.", 409);

  const { data: interview } = await supabase
    .from("interviews")
    .select("band, status")
    .eq("id", round.interview_id)
    .single();
  if (!interview) return fail("Interview not found.", 404);
  if (interview.status !== "active") return fail("This interview has ended.", 410);

  const band = interview.band as Band;
  const roundType = round.round_type as RoundType;
  const plan = round.questions as PlanItem[] | null;
  const state = parseState(round.state);
  if (!plan || plan.length === 0 || !state) return fail("Start the round first.", 409);

  // Older rounds were saved before the code stages existed. Their state has no codeStage key.
  const rawState = (round.state ?? {}) as Record<string, unknown>;
  const hasStageKeys = typeof rawState.codeStage === "string";

  // 4. Timer: past the deadline, no more answers. Step 2 will score the round.
  if (!round.deadline || Date.parse(round.deadline) < Date.now()) {
    return Response.json({ timeUp: true, roundComplete: true, total: plan.length });
  }
  if (state.phase === "done") {
    return Response.json({ roundComplete: true, total: plan.length, index: plan.length });
  }

  // 5. The SERVER decides what happens next
  let aiPhase: InterviewPhase;
  let newIndex = state.index;
  let newUsed = state.followUpsUsed;
  let newStage: CodeStage = state.codeStage;
  let newCodeCount = state.codeCount;
  let done = false;
  let fixedReply = false; // true: the reply is fixed text, no AI call
  let codeSubmitted = false;

  if (action === "begin") {
    if (state.phase !== "intro") return fail("This round has already begun.", 409);
    aiPhase = "intro";
    newUsed = 0;
    newStage = "approach";
    newCodeCount = 0;
  } else {
    if (state.phase !== "answering") return fail("Press Start first.", 409);
    const current = plan[state.index];
    if (!current) return fail("Something went wrong. Please try again.", 500, "no plan item at index");
    const budget = budgetFor(current);
    const isCodeItem = current.kind === "code";

    if (action === "answer" && isCodeItem && code) {
      // A code submission
      if (state.codeStage === "approach") {
        return fail("Please explain your approach in words first. The code editor opens after that.", 409);
      }
      if (state.codeCount >= MAX_CODE_SUBMISSIONS) {
        return fail("You have already submitted code the most times allowed for this problem.", 409);
      }
      if (state.followUpsUsed >= budget) {
        return fail("This problem is finished. Press Next question to continue.", 409);
      }
      aiPhase = "followup";
      newUsed = state.followUpsUsed + 1;
      newStage = "review";
      newCodeCount = state.codeCount + 1;
      codeSubmitted = true;
    } else if (action === "answer" && isCodeItem && state.codeStage === "approach") {
      // The approach is explained: open the code editor with a fixed reply (no AI call, no follow-up used)
      aiPhase = "followup"; // not used for the AI in this case
      newStage = "code";
      fixedReply = true;
    } else if (action === "answer" && isCodeItem && state.codeStage === "code") {
      // Words are not accepted while the student should be writing code
      return fail("Write your code in the code editor and press Submit code. Or press Next question to skip.", 409);
    } else if (action === "answer" && state.followUpsUsed < budget) {
      aiPhase = "followup";
      newUsed = state.followUpsUsed + 1;
    } else {
      // Next question (the student skipped, or the follow-ups are used up)
      newIndex = state.index + 1;
      newUsed = 0;
      newStage = "approach";
      newCodeCount = 0;
      done = newIndex >= plan.length;
      aiPhase = done ? "wrapup" : "ask";
    }
  }

  // 6. Language from the student's own profile
  let language: TeacherLanguage = "english";
  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_language")
    .eq("id", user.id)
    .maybeSingle();
  if (isLanguage(profile?.ai_language)) language = profile.ai_language;

  // 7. New state values (code and project details are remembered for later turns)
  const codes = { ...state.codes };
  const firstCodes = { ...state.firstCodes };
  const codeKey = String(state.index);
  if (codeSubmitted) {
    // When an improved version arrives, keep the first one so the scoring can see both.
    if (state.codeCount >= 1 && codes[codeKey]) firstCodes[codeKey] = codes[codeKey];
    codes[codeKey] = code;
  }
  const projectDetails = projectSent ? projectClean : state.projectDetails;

  // Is the code editor open for the student's next move?
  const nextItem = done ? undefined : plan[newIndex];
  const canSubmitCode =
    !!nextItem &&
    nextItem.kind === "code" &&
    (newStage === "code" ||
      (newStage === "review" && newCodeCount < MAX_CODE_SUBMISSIONS && newUsed < budgetFor(nextItem)));

  const newState: StoredState = {
    index: newIndex,
    phase: done ? "done" : "answering",
    followUpsUsed: newUsed,
    codes,
    firstCodes,
    projectDetails,
    codeStage: newStage,
    codeCount: newCodeCount,
    canSubmitCode,
  };

  // 8. Get the interviewer's words. Nothing is saved yet, so an AI failure loses nothing.
  let reply: string;
  if (done) {
    reply = WRAPUP_TEXT[language];
  } else if (fixedReply) {
    reply = APPROACH_DONE_TEXT[language];
  } else {
    const { data: rows } = await supabase
      .from("interview_messages")
      .select("role, content")
      .eq("round_id", round.id)
      .order("created_at", { ascending: false })
      .limit(CONTEXT_MESSAGES - 1);
    const history = ((rows ?? []) as ChatTurn[]).reverse();
    // The conversation must start with the student's side.
    if (history.length > 0 && history[0].role !== "user") {
      history.unshift({ role: "user", content: "[The round has started.]" });
    }
    const trigger: ChatTurn =
      action === "answer"
        ? { role: "user", content: message }
        : {
            role: "user",
            content:
              action === "begin"
                ? "[The round has started. Please begin.]"
                : "[The student chose to move to the next question.]",
          };
    const turns = mergeTurns([...history, trigger]);

    const itemIndex = aiPhase === "ask" ? newIndex : state.index;
    const item = plan[itemIndex];
    const questionNumber = aiPhase === "intro" ? 1 : itemIndex + 1;
    const ctx: InterviewerContext = {
      round: roundType,
      band,
      language,
      phase: aiPhase,
      questionNumber,
      totalQuestions: plan.length,
      followUpsLeft: aiPhase === "followup" ? Math.max(0, budgetFor(item) - newUsed) : 0,
      ...itemContext(item, newState, itemIndex, codeSubmitted),
    };

    try {
      const result = await generateReply(buildInterviewerPrompt(ctx), turns, {
        maxTokens: 600, // room for hidden "thinking" tokens; the reply itself is under 60 words
        temperature: 0.6,
      });
      reply = result.text.trim();
    } catch {
      return fail("The AI is busy right now. Please try again in a minute.", 503);
    }
    if (!reply) return fail("The AI is busy right now. Please try again in a minute.", 503);
  }

  // 9. Claim the new state. The guard stops a double-click from running the same turn twice.
  const admin = createAdminClient();
  let claim = admin
    .from("interview_rounds")
    .update({ state: newState })
    .eq("id", round.id)
    .eq("user_id", user.id)
    .eq("state->>phase", state.phase)
    .eq("state->>index", String(state.index))
    .eq("state->>followUpsUsed", String(state.followUpsUsed));
  if (hasStageKeys) {
    // The approach step changes only the stage, so the stage must be part of the guard too.
    claim = claim.eq("state->>codeStage", state.codeStage).eq("state->>codeCount", String(state.codeCount));
  }
  const { data: claimed, error: claimError } = await claim.select("id");
  if (claimError) {
    console.error("[interview] state error:", claimError.message);
    return fail("Something went wrong. Please try again.", 500, claimError.message);
  }
  if (!claimed || claimed.length === 0) {
    return fail("Your last message is still being processed. Please wait a moment.", 409);
  }

  // 10. Save the messages (the database checks the round is open and the text size)
  if (action === "answer") {
    const e = await addMessage(admin, user.id, round.id, "user", message);
    if (e) {
      console.error("[interview] add_message (student) error:", e);
      return fail("Something went wrong. Please try again.", 500, e);
    }
  }
  const e2 = await addMessage(admin, user.id, round.id, "assistant", reply);
  if (e2) {
    console.error("[interview] add_message (interviewer) error:", e2);
    return fail("Something went wrong. Please try again.", 500, e2);
  }

  // 11. Reply
  const shownIndex = done ? plan.length - 1 : newIndex;
  return Response.json({
    reply,
    phase: aiPhase,
    roundComplete: done,
    index: shownIndex,
    questionNumber: shownIndex + 1,
    total: plan.length,
    codeStage: newState.codeStage,
    canSubmitCode: newState.canSubmitCode,
    current: summarisePlan([plan[shownIndex]])[0],
  });
}