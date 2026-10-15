// ---------- Options shown on the card form ----------

export type LookingFor = "study_partner" | "project_teammate" | "hackathon";

export const lookingForOptions: { id: LookingFor; label: string }[] = [
  { id: "study_partner", label: "Study partner" },
  { id: "project_teammate", label: "Project teammate" },
  { id: "hackathon", label: "Hackathon team" },
];

export const skillOptions: string[] = [
  "DSA",
  "C++",
  "Java",
  "Python",
  "Web development",
  "Frontend",
  "Backend",
  "AI / ML",
  "Databases",
  "Cloud",
  "Mobile apps",
  "UI / UX design",
  "Embedded systems",
  "VLSI",
  "IoT / hardware",
  "Cybersecurity",
];

export const availabilityOptions: { id: string; label: string }[] = [
  { id: "weekday_morning", label: "Weekday mornings" },
  { id: "weekday_evening", label: "Weekday evenings" },
  { id: "night", label: "Late nights" },
  { id: "weekend", label: "Weekends" },
];

export const goalOptions: string[] = [
  "DSA and problem solving",
  "Web development",
  "AI / Machine Learning",
  "Embedded systems / VLSI",
  "Placement preparation",
  "Other",
];

export function labelOf(options: { id: string; label: string }[], id: string) {
  return options.find((o) => o.id === id)?.label ?? id;
}

export function toggleInList(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// ---------- Types that match the database tables ----------

export type PartnerCard = {
  user_id: string;
  display_name: string;
  college: string | null;
  branch: string | null;
  study_year: number | null;
  goal: string | null;
  looking_for: string[];
  skills: string[];
  availability: string[];
  bio: string | null;
  is_open: boolean;
  leetcode: string | null;
  codeforces: string | null;
  gfg: string | null;
  codechef: string | null;
};

export const CARD_COLUMNS =
  "user_id, display_name, college, branch, study_year, goal, looking_for, skills, availability, bio, is_open, leetcode, codeforces, gfg, codechef";

export type RequestStatus = "pending" | "accepted" | "declined";

export type PartnerRequest = {
  id: string;
  from_user: string;
  to_user: string;
  message: string | null;
  status: RequestStatus;
  created_at: string;
};

export type Share = {
  from_user: string;
  to_user: string;
  linkedin: string | null;
  whatsapp: string | null;
};

// ---------- Checks that mirror the database rules ----------

const HANDLE_PATTERN = /^[A-Za-z0-9_.-]{1,40}$/;
const LINKEDIN_PATTERN = /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/\S+$/i;
const WHATSAPP_PATTERN = /^\+?[0-9]{8,15}$/;

// Empty is fine because every username is optional
export function isValidHandle(value: string) {
  const v = value.trim();
  return v === "" || HANDLE_PATTERN.test(v);
}

export function isValidLinkedin(value: string) {
  const v = value.trim();
  return v.length <= 200 && LINKEDIN_PATTERN.test(v);
}

// Removes spaces, dashes and brackets so "+91 98765-43210" works
export function normalizeWhatsapp(value: string) {
  return value.replace(/[\s\-()]/g, "");
}

export function isValidWhatsapp(value: string) {
  return WHATSAPP_PATTERN.test(normalizeWhatsapp(value));
}

export function whatsappLink(number: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}`;
}

// ---------- Coding profile links ----------
// Please open one link per site yourself to confirm the address format still works.

export function codingLinks(card: Pick<PartnerCard, "leetcode" | "codeforces" | "gfg" | "codechef">) {
  const links: { label: string; url: string }[] = [];
  if (card.leetcode)
    links.push({ label: "LeetCode", url: `https://leetcode.com/u/${encodeURIComponent(card.leetcode)}/` });
  if (card.codeforces)
    links.push({ label: "Codeforces", url: `https://codeforces.com/profile/${encodeURIComponent(card.codeforces)}` });
  if (card.gfg)
    links.push({ label: "GFG", url: `https://www.geeksforgeeks.org/user/${encodeURIComponent(card.gfg)}/` });
  if (card.codechef)
    links.push({ label: "CodeChef", url: `https://www.codechef.com/users/${encodeURIComponent(card.codechef)}` });
  return links;
}

// ---------- Match score ----------

export type Match = { score: number; percent: number; reasons: string[] };

export const MAX_SCORE = 14;

export function matchScore(me: PartnerCard, other: PartnerCard): Match {
  let score = 0;
  const reasons: string[] = [];

  const sharedLooking = other.looking_for.filter((x) => me.looking_for.includes(x));
  if (sharedLooking.length > 0) {
    score += 3;
    reasons.push(
      "Both looking for: " + sharedLooking.map((id) => labelOf(lookingForOptions, id)).join(", ")
    );
  }

  if (me.goal && me.goal === other.goal) {
    score += 3;
    reasons.push(`Same goal: ${me.goal}`);
  }

  const sharedSkills = other.skills.filter((s) => me.skills.includes(s));
  if (sharedSkills.length > 0) {
    score += Math.min(sharedSkills.length, 3);
    reasons.push(
      `${sharedSkills.length} shared skill${sharedSkills.length > 1 ? "s" : ""}: ${sharedSkills
        .slice(0, 3)
        .join(", ")}`
    );
  }

  if (other.availability.some((a) => me.availability.includes(a))) {
    score += 2;
    reasons.push("Free at similar times");
  }

  if (
    me.college &&
    other.college &&
    me.college.trim().toLowerCase() === other.college.trim().toLowerCase()
  ) {
    score += 2;
    reasons.push("Same college");
  }

  if (me.study_year && other.study_year && Math.abs(me.study_year - other.study_year) <= 1) {
    score += 1;
  }

  return { score, percent: Math.round((score / MAX_SCORE) * 100), reasons };
}