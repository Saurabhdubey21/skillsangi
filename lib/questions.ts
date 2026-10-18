import { createClient } from "./supabase/client";
import type { Difficulty } from "./problems";

// Rows come from the Supabase tables `questions` and `question_topics`.
// Supabase returns at most 1000 rows per request, so questions are always
// fetched one topic at a time (the biggest topic has 150).

// Platform is now any text (kaggle, deep-ml, the-odin-project, ...).
export type Platform = string;

export type Question = {
  id: string; // stable, e.g. dsa-leetcode-two-sum. Never changes.
  subject: string;
  topic_id: string;
  topic: string;
  subtopic: string;
  position: number;
  title: string;
  difficulty: Difficulty;
  platform: Platform;
  platform_label: string | null; // display name, e.g. "The Odin Project"
  task: string | null; // short instruction shown under the title
  url: string;
  core: boolean;
};

export type TopicSummary = {
  subject: string;
  topic_id: string;
  topic: string;
  topic_no: number;
  total: number;
};

export type Subject = {
  id: string;
  name: string;
};

// All subjects, in the order they appear on the Practice page.
export const subjects: Subject[] = [
  { id: "dsa", name: "DSA" },
  { id: "web-dev", name: "Web development" },
  { id: "cloud", name: "Cloud computing" },
  { id: "ai-ml", name: "AI and machine learning" },
  { id: "hld", name: "System design: high-level design (HLD)" },
  { id: "lld", name: "System design: low-level design (LLD)" },
  { id: "sql", name: "SQL" },
];

// Old fallback names for the four DSA platforms.
export const platformLabel: Record<string, string> = {
  leetcode: "LeetCode",
  geeksforgeeks: "GeeksforGeeks",
  cses: "CSES",
  codeforces: "Codeforces",
};

// Name to show for a question's platform:
// 1) platform_label from the database, 2) the map above, 3) the raw slug.
export function platformName(
  q: Pick<Question, "platform" | "platform_label">
): string {
  return q.platform_label || platformLabel[q.platform] || q.platform;
}

// Short line under each topic name. Topics without an entry just show no line.
export const topicDescription: Record<string, string> = {
  "language-basics": "Input/output, conditions, loops and simple number problems.",
  "logic-patterns": "Number logic, digit problems and pattern printing.",
  recursion: "Base cases, the call stack, then choosing and undoing.",
  stl: "Vectors, pairs, sets, maps, priority queues and algorithms.",
  sorting: "Sorting algorithms and problems built on sorted order.",
  hashing: "Frequency counts, prefix sums and constant-time lookups.",
  arrays: "Traversal, prefix sums, two pointers and in-place tricks.",
  "binary-search": "Searching sorted data, and searching on the answer.",
  "strings-windows": "Strings, two pointers and sliding windows.",
  "linkedlist-stack-queue": "Pointers, stacks, queues and monotonic stacks.",
  "trees-heaps-greedy": "Trees, BSTs, heaps and greedy choices.",
  graphs: "BFS, DFS, grids, shortest paths and dependency ordering.",
  "dynamic-programming": "Break problems into overlapping subproblems.",
  "bits-maths-advanced": "Bit manipulation, maths and advanced topics.",
};

export async function getTopics(
  subject: string
): Promise<{ data: TopicSummary[]; error: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("question_topics")
    .select("subject, topic_id, topic, topic_no, total")
    .eq("subject", subject)
    .order("topic_no", { ascending: true });
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as TopicSummary[], error: "" };
}

// Topic ids are unique across all subjects, so the topic id alone is enough:
//   getQuestions("arrays")
// The old two-argument form getQuestions("dsa", "arrays") still works for now,
// so the topic page keeps working until we update it in Step D.
// The subject is ignored; each returned question carries its own `subject`.
export async function getQuestions(
  ...args: [topicId: string] | [subject: string, topicId: string]
): Promise<{ data: Question[]; error: string }> {
  const topicId = args.length === 2 ? args[1] : args[0];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("questions")
    .select(
      "id, subject, topic_id, topic, subtopic, position, title, difficulty, platform, platform_label, task, url, core"
    )
    .eq("topic_id", topicId)
    .eq("is_active", true)
    .order("position", { ascending: true });
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as Question[], error: "" };
}

// How many questions the signed-in student has solved in each topic.
// Reads the view `question_topic_progress` (the SQL you ran in Step 1).
export async function getSolvedByTopic(
  subject: string
): Promise<{ data: Record<string, number>; error: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("question_topic_progress")
    .select("topic_id, solved")
    .eq("subject", subject);
  if (error) return { data: {}, error: error.message };
  const map: Record<string, number> = {};
  for (const row of data ?? []) map[row.topic_id] = row.solved;
  return { data: map, error: "" };
}