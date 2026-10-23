// Server-only. Builds the plan for each interview round: which questions to ask.
// This file does NOT talk to the database. The route fetches the rows and passes them in,
// so the picking rules can be tested on their own.
//
// Save as: lib/ai/interview-plan.ts

import {
  CODING_DIFFICULTIES,
  CODING_PLAN,
  CORE_PLAN,
  HR_PLAN,
  HR_SECTIONS,
  type Band,
  type CoreTopic,
  type Difficulty,
  type HrSection,
} from "./interview-prompt";

// A row from your "questions" table (only the columns we use).
export type QuestionRow = {
  id: string;
  title: string;
  difficulty: string | null;
  topic_id: string | null;
  topic: string | null;
  url: string | null;
  platform: string | null;
};

export type PickedQuestion = {
  id: string;
  title: string;
  difficulty: Difficulty;
  topicId: string;
  topic: string;
  url: string | null;
  platform: string | null;
};

// One step of a round. The plan is saved in interview_rounds.questions.
// "focus" is the sub-topic of a core question. Plans saved before it existed have no focus.
export type PlanItem =
  | { kind: "code" | "voice"; question: PickedQuestion }
  | { kind: "core"; coreTopic: Exclude<CoreTopic, "systemdesign">; focus?: string }
  | { kind: "systemdesign"; question: PickedQuestion | null }
  | { kind: "hr"; hrSection: HrSection };

// What we send to the browser (no extra data).
export type PlanSummaryItem = {
  kind: PlanItem["kind"];
  label: string;
  difficulty?: Difficulty;
  topic?: string;
  url?: string | null;
  platform?: string | null;
};

type Rand = () => number;

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

// If no question of the wanted difficulty exists, try these next.
const FALLBACK: Record<Difficulty, Difficulty[]> = {
  easy: ["easy", "medium", "hard"],
  medium: ["medium", "easy", "hard"],
  hard: ["hard", "medium", "easy"],
};

// Sub-topics for core questions. Each core question in a round gets a DIFFERENT one,
// so the same question cannot be asked twice (for example TCP vs UDP).
const CORE_FOCUS: Record<Exclude<CoreTopic, "systemdesign">, string[]> = {
  cn: [
    "OSI model and TCP/IP model layers",
    "TCP vs UDP and when to use each",
    "TCP three-way handshake and connection closing",
    "HTTP vs HTTPS and how TLS works",
    "How DNS resolves a name step by step",
    "IP addressing and subnetting",
    "Routing and how a router decides the next hop",
    "Flow control vs congestion control",
    "ARP, switch vs router vs hub",
    "NAT and firewalls",
  ],
  dbms: [
    "Primary key, foreign key and other keys",
    "Normalization and normal forms",
    "ACID properties",
    "Transactions and isolation levels",
    "Indexing and B-trees",
    "Types of joins with an example",
    "Writing a small SQL query (group by, having, subquery)",
    "Deadlocks and concurrency control",
    "ER modelling and relationships",
    "SQL vs NoSQL",
  ],
  oops: [
    "The four pillars of OOP",
    "Compile-time vs run-time polymorphism",
    "Abstract class vs interface",
    "Constructors and destructors",
    "Virtual functions and how they work",
    "Inheritance and the diamond problem",
    "Composition vs inheritance",
    "SOLID principles",
    "Method overloading vs overriding",
    "Encapsulation with a real example",
  ],
};

export function toPicked(r: QuestionRow): PickedQuestion | null {
  if (!r.id || !r.title) return null;
  const d = String(r.difficulty ?? "").toLowerCase();
  return {
    id: r.id,
    title: r.title,
    difficulty: (DIFFICULTIES as string[]).includes(d) ? (d as Difficulty) : "medium",
    topicId: r.topic_id ?? "",
    topic: r.topic ?? r.topic_id ?? "",
    url: r.url,
    platform: r.platform,
  };
}

function pickRandom<T>(list: T[], rand: Rand): T | undefined {
  return list.length ? list[Math.floor(rand() * list.length)] : undefined;
}

function shuffle<T>(list: T[], rand: Rand): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 3 coding problems: easy, then medium, then hard, drawn from ALL the rows given.
export function pickCodingQuestions(rows: QuestionRow[], rand: Rand = Math.random): PickedQuestion[] {
  const byDifficulty: Record<Difficulty, PickedQuestion[]> = { easy: [], medium: [], hard: [] };
  for (const r of rows) {
    const q = toPicked(r);
    if (q) byDifficulty[q.difficulty].push(q);
  }

  const used = new Set<string>();
  const out: PickedQuestion[] = [];
  for (const wanted of CODING_DIFFICULTIES) {
    for (const d of FALLBACK[wanted]) {
      const q = pickRandom(byDifficulty[d].filter((x) => !used.has(x.id)), rand);
      if (q) {
        used.add(q.id);
        out.push(q);
        break;
      }
    }
  }
  return out;
}

// Spoken questions (dp, graphs, trees). Medium or hard only, different topics when possible.
export function pickVoiceQuestions(
  rows: QuestionRow[],
  count: number,
  excludeIds: string[],
  rand: Rand = Math.random
): PickedQuestion[] {
  if (count <= 0) return [];
  const skip = new Set(excludeIds);
  const pool = shuffle(
    rows
      .map(toPicked)
      .filter((q): q is PickedQuestion => q !== null && q.difficulty !== "easy" && !skip.has(q.id)),
    rand
  );

  const out: PickedQuestion[] = [];
  const topics = new Set<string>();
  for (const q of pool) {
    if (out.length >= count) break;
    if (!topics.has(q.topicId)) {
      out.push(q);
      topics.add(q.topicId);
    }
  }
  for (const q of pool) {
    if (out.length >= count) break;
    if (!out.includes(q)) out.push(q);
  }
  return out;
}

export function buildCodingPlan(
  band: Band,
  codeRows: QuestionRow[],
  voiceRows: QuestionRow[],
  rand: Rand = Math.random
): PlanItem[] {
  const code = pickCodingQuestions(codeRows, rand);
  const voice = pickVoiceQuestions(
    voiceRows,
    CODING_PLAN[band].voiceQuestions,
    code.map((q) => q.id),
    rand
  );
  return [
    ...code.map((question) => ({ kind: "code" as const, question })),
    ...voice.map((question) => ({ kind: "voice" as const, question })),
  ];
}

// Core round: questionsPerTopic slots for cn, dbms and oops. Each slot gets its own focus
// (a sub-topic), different from the other slots of the same topic. The AI writes the exact question.
// System design (above 10 LPA) is ONE big question with several follow-ups. It goes FIRST,
// because it needs the most time and carries the most marks, so the 1-hour timer cannot cut it off.
export function buildCorePlan(band: Band, designRows: QuestionRow[], rand: Rand = Math.random): PlanItem[] {
  const plan = CORE_PLAN[band];
  const rest: PlanItem[] = [];
  let design: PlanItem | null = null;
  for (const topic of plan.topics) {
    if (topic === "systemdesign") {
      const picked = pickRandom(designRows.map(toPicked).filter((q): q is PickedQuestion => q !== null), rand);
      design = { kind: "systemdesign", question: picked ?? null };
    } else {
      const focuses = shuffle(CORE_FOCUS[topic], rand);
      for (let i = 0; i < plan.questionsPerTopic; i++) {
        rest.push({ kind: "core", coreTopic: topic, focus: focuses[i % focuses.length] });
      }
    }
  }
  return design ? [design, ...rest] : rest;
}

export function buildHrPlan(): PlanItem[] {
  const items: PlanItem[] = [];
  for (const section of HR_SECTIONS) {
    for (let i = 0; i < HR_PLAN[section]; i++) items.push({ kind: "hr", hrSection: section });
  }
  return items;
}

const CORE_LABEL: Record<Exclude<CoreTopic, "systemdesign">, string> = {
  cn: "Computer Networks",
  dbms: "DBMS",
  oops: "OOPs",
};

const HR_LABEL: Record<HrSection, string> = {
  about_you: "About you",
  project: "Your project",
  behavioural: "Behavioural question",
  closing: "Closing",
};

export function summarisePlan(items: PlanItem[]): PlanSummaryItem[] {
  return items.map((item): PlanSummaryItem => {
    if (item.kind === "hr") return { kind: item.kind, label: HR_LABEL[item.hrSection] };
    if (item.kind === "core") return { kind: item.kind, label: CORE_LABEL[item.coreTopic] };
    if (item.kind === "systemdesign") {
      return { kind: item.kind, label: item.question?.title ?? "System design question", url: item.question?.url ?? null };
    }
    const q = item.question; // what is left is a coding or voice question
    return { kind: item.kind, label: q.title, difficulty: q.difficulty, topic: q.topic, url: q.url, platform: q.platform };
  });
}