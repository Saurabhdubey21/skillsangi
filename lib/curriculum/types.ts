export type Level = "beginner" | "intermediate" | "advanced";

// A module is a group of related topics.
// Topics are written as "Name" or "Name|2". The number is how heavy the topic is (1 to 3).
export type Module = {
  id: string;
  name: string;
  level: Level; // the level this module belongs to
  topics: string[];
  basics?: boolean; // programming basics, used when another subject needs this language first
  stacks?: string[]; // only for these tech stacks (web development)
  practice?: string; // id of the matching topic in the Practice section
};

export type Stack = { id: string; name: string; note: string };

export type Domain = {
  id: string;
  name: string;
  description: string;
  group: string;
  languageFirst?: string[]; // languages a beginner can start with before this subject
  stacks?: Stack[];
  modules: Module[];
};

export function mod(
  id: string,
  name: string,
  level: Level,
  topics: string[],
  extra: Partial<Pick<Module, "basics" | "stacks" | "practice">> = {}
): Module {
  return { id, name, level, topics, ...extra };
}