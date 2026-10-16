import type { SupabaseClient } from "@supabase/supabase-js";
import { getDomain } from "../roadmaps";

const MAX_ROADMAPS = 3; // the roadmap page allows 3 in progress
const MAX_TASKS_PER_DAY = 6; // more than the hours-per-day limit, so a day is never cut off
const MAX_TITLE_CHARS = 120;

type RoadmapRow = {
  id: string;
  skill: string;
  level: string;
  hours_per_day: number;
  config: { language?: string; stack?: string } | null;
};

type TaskRow = {
  day_number: number;
  title: string;
  kind: string;
  module: string | null;
};

// Builds a SHORT text summary of the student's roadmaps and today's tasks.
// Sends only plan data from our own tables. No name, email or phone.
// Returns "" if there is nothing to add or if anything goes wrong.
export async function getRoadmapContext(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  try {
    const { data: roadmaps, error } = await supabase
      .from("roadmaps")
      .select("id, skill, level, hours_per_day, config")
      .eq("user_id", userId)
      .limit(MAX_ROADMAPS);

    if (error || !roadmaps || roadmaps.length === 0) return "";

    const lines: string[] = [];

    for (const r of roadmaps as RoadmapRow[]) {
      const domain = getDomain(r.skill);
      const name = domain?.name ?? r.skill;
      const language = r.config?.language
        ? getDomain(r.config.language)?.name
        : undefined;
      const stack = domain?.stacks?.find((s) => s.id === r.config?.stack)?.name;

      const label = [name, stack, language ? `starts with ${language}` : null]
        .filter(Boolean)
        .join(", ");
      const header = `- ${label} (${r.level} level, ${r.hours_per_day} hour(s) a day)`;

      // Same rule as the roadmap page: today = the lowest day that still has unfinished tasks
      const { data: rows } = await supabase
        .from("roadmap_tasks")
        .select("day_number, title, kind, module")
        .eq("roadmap_id", r.id)
        .eq("user_id", userId)
        .eq("done", false)
        .order("day_number", { ascending: true })
        .order("position", { ascending: true })
        .limit(MAX_TASKS_PER_DAY);

      const pending = (rows ?? []) as TaskRow[];

      if (pending.length === 0) {
        lines.push(`${header}: no pending tasks.`);
        continue;
      }

      const day = pending[0].day_number;
      const today = pending.filter((t) => t.day_number === day);
      const taskText = today
        .map((t) => {
          const title = t.title.slice(0, MAX_TITLE_CHARS);
          return t.module ? `${title} [${t.kind}, module: ${t.module}]` : `${title} [${t.kind}]`;
        })
        .join("; ");

      lines.push(`${header}. Current day ${day}. Today's tasks: ${taskText}`);
    }

    if (lines.length === 0) return "";

    return [
      "STUDENT ROADMAP (facts from the app's database, use them to make answers relevant):",
      ...lines,
    ].join("\n");
  } catch {
    // Roadmap info is a bonus. The chat must still work without it.
    return "";
  }
}