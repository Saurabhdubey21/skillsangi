// Cleans resume text in the browser BEFORE anything is sent to an AI service,
// and again on the server before anything is saved.
// It removes emails, phone numbers and links. It cannot find names or addresses,
// so the student must still read the result and edit it.
// Save as: lib/resume-clean.ts

export type CleanResult = {
  text: string;
  removed: { emails: number; phones: number; links: number };
  truncated: boolean;
};

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

// Web links, profile links written without https, and hosted project sites.
const LINK =
  /(?:https?:\/\/|www\.)\S+|\b(?:linkedin|github|gitlab|leetcode|codeforces|codechef|hackerrank)\.com\S*|\b[\w-]+\.(?:vercel\.app|netlify\.app|onrender\.com|herokuapp\.com|github\.io)\S*/gi;

// Indian mobile numbers (with or without +91) and other numbers that start with +.
const PHONE_INDIA = /(?<!\d)(?:\+?91[ -]?)?[6-9]\d{4}[ -]?\d{5}(?!\d)/g;
const PHONE_INTL = /\+\d{1,3}[ -]?\(?\d{2,5}\)?[ -]?\d{3,5}[ -]?\d{3,5}/g;

export function cleanResumeText(raw: string, maxChars = 6000): CleanResult {
  const removed = { emails: 0, phones: 0, links: 0 };

  let text = raw.replace(/\r\n?/g, "\n").replace(/\u0000/g, "");

  text = text.replace(EMAIL, () => {
    removed.emails++;
    return "";
  });
  text = text.replace(LINK, () => {
    removed.links++;
    return "";
  });
  text = text.replace(PHONE_INDIA, () => {
    removed.phones++;
    return "";
  });
  text = text.replace(PHONE_INTL, () => {
    removed.phones++;
    return "";
  });

  // Tidy the gaps the removals leave behind.
  text = text
    // a run of commas, bars or semicolons with nothing between them becomes one comma
    .replace(/(?:[,|;][ \t]*){2,}/g, ", ")
    // a separator left alone at the start or the end of a line goes away
    .replace(/^[ \t,|;]+/gm, "")
    .replace(/[ \t,|;]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const truncated = text.length > maxChars;
  if (truncated) text = text.slice(0, maxChars);

  return { text, removed, truncated };
}