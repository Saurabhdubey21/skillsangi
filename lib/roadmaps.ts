export type Level = "beginner" | "intermediate";
export type Kind = "learn" | "practice" | "review";

export type Skill = {
  id: string;
  name: string;
  description: string;
  topics: string[];
};

export const skills: Skill[] = [
  {
    id: "dsa",
    name: "DSA and problem solving",
    description: "Arrays to graphs and dynamic programming",
    topics: [
      "Arrays and strings basics",
      "Hashing",
      "Two pointers and sliding window",
      "Sorting and binary search",
      "Recursion and backtracking",
      "Linked lists",
      "Stacks and queues",
      "Trees",
      "Graphs",
      "Dynamic programming basics",
    ],
  },
  {
    id: "web",
    name: "Web development",
    description: "HTML to a deployed full-stack project",
    topics: [
      "HTML and CSS basics",
      "JavaScript fundamentals",
      "Responsive layouts",
      "Git and GitHub",
      "React basics",
      "APIs and fetch",
      "Databases and SQL basics",
      "Authentication basics",
      "Deploying a project",
    ],
  },
  {
    id: "aiml",
    name: "AI and machine learning",
    description: "Python, data, models and a mini project",
    topics: [
      "Python for data work",
      "NumPy and pandas",
      "Data visualisation",
      "Statistics basics",
      "Linear and logistic regression",
      "Model evaluation",
      "Decision trees and ensembles",
      "Neural network basics",
      "Mini project",
    ],
  },
  {
    id: "embedded",
    name: "Embedded systems",
    description: "Microcontrollers, interfaces and sensors",
    topics: [
      "C programming for microcontrollers",
      "Digital electronics basics",
      "GPIO and timers",
      "Interrupts",
      "UART, SPI and I2C",
      "ADC and sensors",
      "Basic RTOS concepts",
      "Mini project",
    ],
  },
  {
    id: "placement",
    name: "Placement preparation",
    description: "Aptitude, core subjects and interviews",
    topics: [
      "Quantitative aptitude",
      "Logical reasoning",
      "Verbal ability",
      "OS and DBMS fundamentals",
      "Networks and OOP fundamentals",
      "Resume and projects",
      "Mock interviews",
      "Company-wise practice",
    ],
  },
];

export type NewTask = {
  day_number: number;
  position: number;
  title: string;
  kind: Kind;
};

// Each topic becomes 3 tasks: learn, practice, review.
// Tasks are packed into days, one task per hour of study time.
export function generateTasks(
  skillId: string,
  level: Level,
  hoursPerDay: number
): NewTask[] {
  const skill = skills.find((s) => s.id === skillId);
  if (!skill) return [];

  // Intermediate students skip the first two (basic) topics
  const topics = level === "intermediate" ? skill.topics.slice(2) : skill.topics;

  const flat: { title: string; kind: Kind }[] = topics.flatMap((topic) => [
    { title: `Learn: ${topic}`, kind: "learn" as Kind },
    { title: `Practice: ${topic}, 3 exercises`, kind: "practice" as Kind },
    { title: `Review: ${topic}, fix your mistakes`, kind: "review" as Kind },
  ]);

  return flat.map((task, i) => ({
    ...task,
    day_number: Math.floor(i / hoursPerDay) + 1,
    position: i % hoursPerDay,
  }));
}