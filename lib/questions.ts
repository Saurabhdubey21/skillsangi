import { createClient } from "./supabase/client";
import type { Difficulty } from "./problems";

// Rows come from the Supabase tables `questions` and `question_topics`.
// Supabase returns at most 1000 rows per request, so questions are always
// fetched one topic at a time (the biggest topic has 150).

export type Platform = "leetcode" | "geeksforgeeks" | "cses" | "codeforces";

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

export const platformLabel: Record<string, string> = {
  leetcode: "LeetCode",
  geeksforgeeks: "GeeksforGeeks",
  cses: "CSES",
  codeforces: "Codeforces",
};

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

export async function getQuestions(
  subject: string,
  topicId: string
): Promise<{ data: Question[]; error: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("questions")
    .select(
      "id, subject, topic_id, topic, subtopic, position, title, difficulty, platform, url, core"
    )
    .eq("subject", subject)
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