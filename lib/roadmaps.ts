import { dsa } from "./curriculum/dsa";
import { c, cpp, java, python, oops } from "./curriculum/programming";
import { cn, dbms, sql, systemdesign, cloud } from "./curriculum/computerscience";
import { web, aiml } from "./curriculum/development";
import { vlsi, embedded, cad } from "./curriculum/hardware";
import type { Domain, Level, Module, Stack } from "./curriculum/types";

export type { Domain, Level, Module, Stack };
export type Kind = "learn" | "practice" | "review";

// ---------- Subjects, in the order students see them ----------

const display = [
  "dsa",
  "c",
  "cpp",
  "java",
  "python",
  "oops",
  "cn",
  "dbms",
  "sql",
  "web",
  "aiml",
  "systemdesign",
  "cloud",
  "vlsi",
  "embedded",
  "cad",
];

const everything: Domain[] = [
  dsa,
  c,
  cpp,
  java,
  python,
  oops,
  cn,
  dbms,
  sql,
  web,
  aiml,
  systemdesign,
  cloud,
  vlsi,
  embedded,
  cad,
];

export const domains: Domain[] = [...everything].sort(
  (a, b) => display.indexOf(a.id) - display.indexOf(b.id)
);

// Older pages read `skills` for the name of a roadmap
export const skills = domains.map((d) => ({
  id: d.id,
  name: d.name,
  description: d.description,
}));

export function getDomain(id: string | undefined): Domain | undefined {
  return domains.find((d) => d.id === id);
}

// ---------- Limits ----------

export const MAX_DAYS = 365; // plans are at most one year
export const MIN_DAYS = 7;
export const MAX_HOURS = 4;

export const levelOptions: { id: Level; name: string; note: string }[] = [
  {
    id: "beginner",
    name: "Beginner",
    note: "I am new to this. Start from the very basics and go all the way to advanced.",
  },
  {
    id: "intermediate",
    name: "Intermediate",
    note: "I know the basics. Start with the intermediate topics and go to advanced.",
  },
  {
    id: "advanced",
    name: "Advanced",
    note: "I am comfortable with the core topics. Focus on advanced material.",
  },
];

// ---------- Choosing what goes into a plan ----------

const rank: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 };

export function resolveStack(domain: Domain, stack?: string): string | undefined {
  if (!domain.stacks || domain.stacks.length === 0) return undefined;
  return domain.stacks.some((s) => s.id === stack) ? stack : domain.stacks[0].id;
}

// A beginner in some subjects (like DSA) first learns a programming language
export function languageChoices(domain: Domain, level: Level): Domain[] {
  if (level !== "beginner" || !domain.languageFirst) return [];
  return domain.languageFirst
    .map((id) => getDomain(id))
    .filter((d): d is Domain => d !== undefined);
}

export function resolveLanguage(
  domain: Domain,
  level: Level,
  language?: string
): Domain | undefined {
  const choices = languageChoices(domain, level);
  if (choices.length === 0) return undefined;
  return choices.find((d) => d.id === language) ?? choices[0];
}

export function basicsOf(language: Domain): Module[] {
  return language.modules.filter((m) => m.basics);
}

export function modulesFor(domain: Domain, level: Level, stack?: string): Module[] {
  return domain.modules.filter(
    (m) =>
      rank[m.level] >= rank[level] &&
      (!m.stacks || (stack !== undefined && m.stacks.includes(stack)))
  );
}

function topicsIn(modules: Module[]) {
  return modules.reduce((sum, m) => sum + m.topics.length, 0);
}

// How many topics a student gets at a level (used on the level cards)
export function countTopics(
  domainId: string,
  level: Level,
  stack?: string,
  language?: string
): number {
  const domain = getDomain(domainId);
  if (!domain) return 0;
  const lang = resolveLanguage(domain, level, language);
  return (
    topicsIn(modulesFor(domain, level, resolveStack(domain, stack))) +
    (lang ? topicsIn(basicsOf(lang)) : 0)
  );
}

export function basicsTopicCount(language: Domain) {
  return topicsIn(basicsOf(language));
}

// ---------- Turning topics into tasks ----------

// The DSA curriculum files use short, old topic names in `practice`. This maps
// them to the topic ids that are live in the question bank. A name that is not
// listed here is used as it is.
const practiceTopic: Record<string, string> = {
  basics: "language-basics",
  patterns: "logic-patterns",
  recursion: "recursion",
  stl: "stl",
  arrays: "arrays",
  strings: "strings-windows",
  "binary-search": "binary-search",
  "linked-lists": "linkedlist-stack-queue",
  stacks: "linkedlist-stack-queue",
  queues: "linkedlist-stack-queue",
  hashmaps: "hashing",
  trees: "trees-heaps-greedy",
  graphs: "graphs",
  dp: "dynamic-programming",
};

// Programming-language modules have no `practice` value, so they are matched by
// module id instead (module id -> live topic id). The DSA basics topics work in
// any language, and students can write code for them in the code editor.
// Modules of other subjects (SQL, web, cloud, AI/ML, system design, OOPs) are
// left out on purpose: they cannot be coded in the editor yet. To add one later,
// add a line here, for example "sql-basics": "sql-select-and-where-basics".
const practiceByModule: Record<string, string> = {
  // Programming languages (the DSA basics topics work in any language)
  "c-basics": "language-basics",
  "cpp-basics": "language-basics",
  "java-basics": "language-basics",
  "py-basics": "language-basics",
  "c-flow": "logic-patterns",
  "cpp-flow": "logic-patterns",
  "java-flow": "logic-patterns",
  "py-flow": "logic-patterns",
  "c-arrays": "arrays",
  "cpp-arrays": "arrays",
  "java-methods": "arrays",
  "py-structures": "arrays",
  "cpp-stl": "stl",
  // Web development
  "web-html": "web-dev-html-fundamentals",
  "web-css": "web-dev-css-fundamentals",
  "web-js": "web-dev-javascript-basics",
  "web-tools": "web-dev-git-and-tooling",
  "web-react": "web-dev-react",
  "web-node": "web-dev-node-and-express",
  "web-sql": "web-dev-databases-and-rest-apis",
  "web-mern-auth": "web-dev-auth-and-security",
  "web-mern-full": "web-dev-deployment-and-full-stack-projects",
  // Cloud computing
  "cloud-basics": "cloud-cloud-concepts-and-shared-responsibility",
  "cloud-services": "cloud-compute",
  "cloud-devops": "cloud-containers-and-docker",
  "cloud-k8s": "cloud-kubernetes",
  "cloud-architecture": "cloud-security-and-well-architected",
  // AI and machine learning
  "ai-maths": "ai-ml-math-for-ml-linear-algebra-statistics-calculus",
  "ai-pandas": "ai-ml-pandas-and-data-wrangling",
  "ai-viz": "ai-ml-data-visualization-and-eda",
  "ai-ml": "ai-ml-regression-and-classical-models-from-scratch",
  "ai-unsupervised": "ai-ml-clustering-and-dimensionality-reduction",
  "ai-deep": "ai-ml-deep-learning-pytorch-cnns-and-rnns",
  "ai-nlp": "ai-ml-nlp-transformers-and-llms",
  // System design (high-level design questions)
  "sd-fundamentals": "hld-fundamentals",
  "sd-blocks": "hld-scaling-and-traffic-management",
  "sd-data": "hld-databases-and-data-distribution",
  "sd-reliability": "hld-reliability-and-observability",
  "sd-cases": "hld-medium-hld-problems",
  // SQL
  "sql-basics": "sql-select-and-where-basics",
  "sql-aggregation": "sql-aggregate-functions-and-group-by-having",
  "sql-joins": "sql-joins-inner-left-self-cross",
  "sql-window": "sql-window-functions-and-ranking",
  "sql-practice": "sql-real-world-analytics-problems",
  // OOPs (low-level design questions)
  "oops-foundations": "lld-oop-fundamentals-and-class-relationships",
  "oops-pillars": "lld-oop-fundamentals-and-class-relationships",
  "oops-deeper": "lld-oop-fundamentals-and-class-relationships",
  "oops-principles": "lld-solid-principles",
  "oops-patterns": "lld-behavioral-patterns",
  "oops-practice": "lld-easy-design-problems",
};

// The practice link for a module, or null when it has no matching topic
function practiceLink(m: Module): string | null {
  if (m.practice) return `/practice/${practiceTopic[m.practice] ?? m.practice}`;
  const topic = practiceByModule[m.id];
  return topic ? `/practice/${topic}` : null;
}

type Item = { name: string; weight: number; module: string; link: string | null };

export type NewTask = {
  day_number: number;
  position: number;
  title: string;
  kind: Kind;
  module: string;
  link: string | null;
};

type TaskDraft = Omit<NewTask, "day_number" | "position">;

function itemsOf(modules: Module[]): Item[] {
  return modules.flatMap((m) =>
    m.topics.map((raw) => {
      const [name, w] = raw.split("|");
      return {
        name: name.trim(),
        weight: Math.min(3, Math.max(1, Number(w) || 1)),
        module: m.name,
        link: practiceLink(m),
      };
    })
  );
}

// Every topic gets at least one task. Extra time goes to the heavier topics first.
// A topic can hold at most 1 + 2 x its weight tasks, so very long plans finish early.
function allocate(items: Item[], budget: number): number[] {
  const counts = items.map(() => 1);
  let left = budget - items.length;

  while (left > 0) {
    let best = -1;
    let bestRatio = Infinity;
    for (let i = 0; i < items.length; i++) {
      if (counts[i] >= 1 + 2 * items[i].weight) continue;
      const ratio = counts[i] / items[i].weight;
      if (ratio < bestRatio) {
        bestRatio = ratio;
        best = i;
      }
    }
    if (best === -1) break;
    counts[best] += 1;
    left -= 1;
  }
  return counts;
}

function tasksFor(item: Item, count: number): TaskDraft[] {
  const { name, module, link } = item;

  // Little time: one combined task keeps the topic in the plan
  if (count <= 1) {
    return [{ title: `Learn and practice: ${name}`, kind: "learn", module, link }];
  }

  const out: TaskDraft[] = [{ title: `Learn: ${name}`, kind: "learn", module, link: null }];
  const sets = count === 2 ? 1 : count - 2;
  for (let k = 1; k <= sets; k++) {
    out.push({
      title: sets === 1 ? `Practice: ${name}` : `Practice: ${name}, set ${k}`,
      kind: "practice",
      module,
      link,
    });
  }
  if (count >= 3) {
    out.push({ title: `Review: ${name}`, kind: "review", module, link });
  }
  return out;
}

// ---------- The plan ----------

export type PlanOptions = {
  domainId: string;
  level: Level;
  hours: number; // study hours per day, one task per hour
  duration: number; // days, up to one year
  language?: string; // for beginners in subjects that start with a language
  stack?: string; // for web development
};

export type ModuleSummary = { name: string; tasks: number; topics: number };

export type Plan = {
  tasks: NewTask[];
  days: number; // the last day that has a task
  topics: number; // topics in the plan. All of them are always included.
  modules: ModuleSummary[];
  feasible: boolean; // false if the duration is too short to cover every topic
  minDays: number; // shortest duration that covers every topic at these hours
  minHours: number; // hours a day needed to cover everything within one year
  earlyFinish: boolean; // the plan needs fewer days than were chosen
  languageName: string | null;
  languageDays: number;
};

export function buildPlan(o: PlanOptions): Plan | null {
  const domain = getDomain(o.domainId);
  if (!domain) return null;

  const hours = Math.min(MAX_HOURS, Math.max(1, Math.round(o.hours)));
  const duration = Math.min(MAX_DAYS, Math.max(1, Math.round(o.duration)));
  const capacity = duration * hours;

  const stack = resolveStack(domain, o.stack);
  const lang = resolveLanguage(domain, o.level, o.language);

  const mainItems = itemsOf(modulesFor(domain, o.level, stack));
  const langItems = lang ? itemsOf(basicsOf(lang)) : [];

  const minTasks = langItems.length + mainItems.length;
  const minDays = Math.ceil(minTasks / hours);
  const minHours = Math.max(1, Math.ceil(minTasks / MAX_DAYS));
  const feasible = minTasks > 0 && capacity >= minTasks;

  const base = {
    topics: minTasks,
    minDays,
    minHours,
    languageName: lang ? lang.name : null,
  };

  if (!feasible) {
    return {
      ...base,
      tasks: [],
      days: 0,
      modules: [],
      feasible: false,
      earlyFinish: false,
      languageDays: 0,
    };
  }

  // Language basics get about duration / 12 days (15 days for 6 months, 30 for a year),
  // stretched if needed so that every basics topic is covered.
  let langBudget = 0;
  if (langItems.length > 0) {
    const wantedDays = Math.min(30, Math.max(1, Math.round(duration / 12)));
    langBudget = Math.max(langItems.length, wantedDays * hours);
    langBudget = Math.min(langBudget, capacity - mainItems.length);
  }
  const mainBudget = capacity - langBudget;

  const langCounts = allocate(langItems, langBudget);
  const mainCounts = allocate(mainItems, mainBudget);

  const drafts: TaskDraft[] = [];
  langItems.forEach((item, i) => drafts.push(...tasksFor(item, langCounts[i])));
  const langTaskCount = drafts.length;
  mainItems.forEach((item, i) => drafts.push(...tasksFor(item, mainCounts[i])));

  const tasks: NewTask[] = drafts.map((t, i) => ({
    ...t,
    day_number: Math.floor(i / hours) + 1,
    position: i % hours,
  }));

  const days = tasks.length > 0 ? Math.floor((tasks.length - 1) / hours) + 1 : 0;

  // Summary per module, in learning order
  const summary = new Map<string, ModuleSummary>();
  [...langItems, ...mainItems].forEach((item) => {
    const row = summary.get(item.module) ?? { name: item.module, tasks: 0, topics: 0 };
    row.topics += 1;
    summary.set(item.module, row);
  });
  tasks.forEach((t) => {
    const row = summary.get(t.module);
    if (row) row.tasks += 1;
  });

  return {
    ...base,
    tasks,
    days,
    modules: Array.from(summary.values()),
    feasible: true,
    earlyFinish: days < duration,
    languageDays: lang ? Math.ceil(langTaskCount / hours) : 0,
  };
}