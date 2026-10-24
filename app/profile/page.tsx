"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import AppShell from "../components/AppShell";

const goals = [
  "DSA and problem solving",
  "Web development",
  "AI / Machine Learning",
  "Embedded systems / VLSI",
  "Placement preparation",
  "Other",
];

const yearLabels: Record<string, string> = {
  "1": "1st year",
  "2": "2nd year",
  "3": "3rd year",
  "4": "4th year",
};

// Links a student can add. "hosts" lists the sites a link is allowed to point to,
// so a GitHub box cannot hold some other website by mistake.
type LinkField = { id: string; label: string; hosts: string[]; placeholder: string };

const linkedinField: LinkField = {
  id: "linkedin",
  label: "LinkedIn",
  hosts: ["linkedin.com"],
  placeholder: "https://www.linkedin.com/in/your-name",
};

const codingPlatforms: LinkField[] = [
  { id: "github", label: "GitHub", hosts: ["github.com"], placeholder: "https://github.com/your-username" },
  { id: "leetcode", label: "LeetCode", hosts: ["leetcode.com"], placeholder: "https://leetcode.com/u/your-username" },
  { id: "codeforces", label: "Codeforces", hosts: ["codeforces.com"], placeholder: "https://codeforces.com/profile/your-username" },
  { id: "codechef", label: "CodeChef", hosts: ["codechef.com"], placeholder: "https://www.codechef.com/users/your-username" },
  { id: "geeksforgeeks", label: "GeeksforGeeks", hosts: ["geeksforgeeks.org"], placeholder: "https://www.geeksforgeeks.org/user/your-username" },
  { id: "hackerrank", label: "HackerRank", hosts: ["hackerrank.com"], placeholder: "https://www.hackerrank.com/profile/your-username" },
  { id: "atcoder", label: "AtCoder", hosts: ["atcoder.jp"], placeholder: "https://atcoder.jp/users/your-username" },
  { id: "code360", label: "Code360", hosts: ["naukri.com", "codingninjas.com"], placeholder: "Paste your Code360 profile link" },
];

const controlClass =
  "w-full rounded-control border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/30";

type CleanResult = { value: string | null; error?: string };

// Turns what the student typed into a safe https link, or explains what is wrong.
// "github.com/me" becomes "https://github.com/me". Other websites are refused.
function cleanLink(raw: string, field: LinkField): CleanResult {
  const text = raw.trim();
  if (!text) return { value: null };
  if (text.length > 300) return { value: null, error: "This link is too long." };

  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return { value: null, error: `Enter a valid ${field.label} link.` };
  }
  if (url.protocol === "http:") url.protocol = "https:";
  if (url.protocol !== "https:") {
    return { value: null, error: "The link must start with https://" };
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const allowed = field.hosts.some((h) => host === h || host.endsWith(`.${h}`));
  if (!allowed) {
    return { value: null, error: `This does not look like a ${field.label} link.` };
  }
  return { value: url.toString() };
}

// Digits with an optional + at the start, 10 to 13 digits. Spaces and dashes are fine.
function cleanPhone(raw: string): CleanResult {
  const text = raw.replace(/[\s\-()]/g, "");
  if (!text) return { value: null };
  if (!/^\+?[0-9]{10,13}$/.test(text)) {
    return { value: null, error: "Enter a mobile number with 10 to 13 digits, like +91 98765 43210." };
  }
  return { value: text };
}

type Draft = {
  fullName: string;
  college: string;
  branch: string;
  studyYear: string;
  goal: string;
  phone: string;
  linkedin: string;
  links: Record<string, string>;
};

const emptyDraft: Draft = {
  fullName: "",
  college: "",
  branch: "",
  studyYear: "",
  goal: "",
  phone: "",
  linkedin: "",
  links: {},
};

// How complete the profile is, and the next thing worth adding
function completeness(p: Draft) {
  const steps = [
    { done: p.fullName.trim() !== "", hint: "Add your full name" },
    { done: p.college.trim() !== "", hint: "Add your college" },
    { done: p.branch.trim() !== "", hint: "Add your branch" },
    { done: p.studyYear !== "", hint: "Choose your year of study" },
    { done: p.goal !== "", hint: "Pick your main learning goal" },
    { done: p.phone.trim() !== "", hint: "Add your mobile number" },
    { done: p.linkedin.trim() !== "", hint: "Add your LinkedIn link" },
    { done: Object.values(p.links).some((v) => v.trim() !== ""), hint: "Add a coding profile link" },
  ];
  const done = steps.filter((s) => s.done).length;
  return {
    percent: Math.round((done / steps.length) * 100),
    next: steps.find((s) => !s.done)?.hint ?? null,
  };
}

function FormField({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-note`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-note`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// Attributes that tie an input to its hint or error text
function describe(id: string, error?: string) {
  return { "aria-describedby": `${id}-note`, "aria-invalid": error ? true : undefined } as const;
}

function SectionHeading({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted">{text}</p>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const [email, setEmail] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft); // what is in the form
  const [saved, setSaved] = useState<Draft>(emptyDraft); // what is stored
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }
      setEmail(user.email ?? "");

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, college, branch, study_year, goal, phone, linkedin_url, coding_links")
        .eq("id", user.id)
        .single();

      if (error) {
        setIsError(true);
        setMessage("Could not load profile: " + error.message);
      } else if (data) {
        const stored = (data.coding_links ?? {}) as Record<string, unknown>;
        const links: Record<string, string> = {};
        codingPlatforms.forEach((p) => {
          const value = stored[p.id];
          if (typeof value === "string") links[p.id] = value;
        });
        const loaded: Draft = {
          fullName: data.full_name ?? "",
          college: data.college ?? "",
          branch: data.branch ?? "",
          studyYear: data.study_year ? String(data.study_year) : "",
          goal: data.goal ?? "",
          phone: data.phone ?? "",
          linkedin: data.linkedin_url ?? "",
          links,
        };
        setDraft(loaded);
        setSaved(loaded);
      }
      setLoading(false);
    }

    load();
  }, [router]);

  function change(patch: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...patch }));
    setMessage("");
  }

  function changeLink(id: string, value: string) {
    setDraft((d) => ({ ...d, links: { ...d.links, [id]: value } }));
    setMessage("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    // Check every field first and show all problems at once
    const found: Record<string, string> = {};
    const phone = cleanPhone(draft.phone);
    if (phone.error) found.phone = phone.error;
    const linkedin = cleanLink(draft.linkedin, linkedinField);
    if (linkedin.error) found.linkedin = linkedin.error;
    const cleanedLinks: Record<string, string> = {};
    codingPlatforms.forEach((p) => {
      const result = cleanLink(draft.links[p.id] ?? "", p);
      if (result.error) found[p.id] = result.error;
      else if (result.value) cleanedLinks[p.id] = result.value;
    });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setIsError(true);
      setMessage("Some details need fixing. Check the fields marked in red.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: draft.fullName.trim() || null,
        college: draft.college.trim() || null,
        branch: draft.branch.trim() || null,
        study_year: draft.studyYear ? Number(draft.studyYear) : null,
        goal: draft.goal || null,
        phone: phone.value,
        linkedin_url: linkedin.value,
        coding_links: cleanedLinks,
      })
      .eq("id", user.id)
      .select("id");

    if (error) {
      setIsError(true);
      setMessage(error.message);
    } else if (!data || data.length === 0) {
      setIsError(true);
      setMessage("Could not find your profile to update. Please log out and back in.");
    } else {
      // Show the cleaned versions, like "https://github.com/me", in the form
      const next: Draft = {
        ...draft,
        fullName: draft.fullName.trim(),
        college: draft.college.trim(),
        branch: draft.branch.trim(),
        phone: phone.value ?? "",
        linkedin: linkedin.value ?? "",
        links: cleanedLinks,
      };
      setDraft(next);
      setSaved(next);
      setIsError(false);
      setMessage("Profile saved.");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div
        role="status"
        className="backdrop-wash flex min-h-screen items-center justify-center text-muted"
      >
        Loading your profile...
      </div>
    );
  }

  const displayName = saved.fullName.trim() || email.split("@")[0];
  const initial = (displayName[0] ?? "S").toUpperCase();
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const progress = completeness(saved);

  const subtitle = [saved.college.trim(), saved.branch.trim(), yearLabels[saved.studyYear]]
    .filter(Boolean)
    .join(", ");

  // Saved links shown as chips under the name. Each one is checked again before
  // it becomes a clickable link.
  const chips: { label: string; href: string }[] = [];
  const savedLinkedin = cleanLink(saved.linkedin, linkedinField);
  if (savedLinkedin.value) chips.push({ label: linkedinField.label, href: savedLinkedin.value });
  codingPlatforms.forEach((p) => {
    const result = cleanLink(saved.links[p.id] ?? "", p);
    if (result.value) chips.push({ label: p.label, href: result.value });
  });

  return (
    <AppShell userName={displayName}>
      <h1 className="text-3xl font-semibold sm:text-4xl">Your profile</h1>
      <p className="mt-2 max-w-xl text-muted">
        This helps us build your roadmap and find study partners.
      </p>

      <div className="mt-8 max-w-3xl space-y-6">
        {/* Summary card */}
        <section aria-label="Profile summary" className="glass p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <span
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent text-2xl font-semibold text-on-accent"
            >
              {initial}
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-2xl font-semibold">{displayName}</h2>
              <p className="mt-1 break-all text-sm text-muted">{email}</p>
              {saved.phone && <p className="mt-0.5 text-sm text-muted">{saved.phone}</p>}
              {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}

              {chips.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Your links">
                  {chips.map((c) => (
                    <li key={c.label}>
                      <a
                        href={c.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block rounded-full border border-border bg-surface px-3 py-1 text-sm transition-colors hover:bg-surface-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        {c.label}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted">
                  Add your LinkedIn and coding profiles below. They show up here.
                </p>
              )}
            </div>

            <div className="w-full shrink-0 sm:w-52">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">Profile</span>
                <span className="text-sm text-muted">{progress.percent}% complete</span>
              </div>
              <div
                role="progressbar"
                aria-label="Profile completeness"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress.percent}
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-strong"
              >
                <div
                  className="h-full rounded-full bg-linear-to-r from-accent to-glow transition-[width] duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted">
                {progress.next ?? "Everything is filled in."}
              </p>
            </div>
          </div>
        </section>

        <form onSubmit={handleSave} className="space-y-6" noValidate>
          {/* Personal details */}
          <section aria-labelledby="personal-heading" className="glass space-y-6 p-6 sm:p-8">
            <div id="personal-heading">
              <SectionHeading
                title="Personal details"
                text="Your mobile number is optional and is not shown to other students."
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField id="full-name" label="Full name">
                <input
                  id="full-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={draft.fullName}
                  onChange={(e) => change({ fullName: e.target.value })}
                  className={controlClass}
                />
              </FormField>

              <FormField
                id="email"
                label="Email"
                hint="This is your sign-in email. You cannot change it here."
              >
                <input
                  id="email"
                  type="email"
                  value={email}
                  readOnly
                  aria-describedby="email-note"
                  className={`${controlClass} cursor-not-allowed text-muted`}
                />
              </FormField>

              <FormField
                id="phone"
                label="Mobile number"
                hint="Optional. Include the country code, like +91."
                error={errors.phone}
              >
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  value={draft.phone}
                  onChange={(e) => change({ phone: e.target.value })}
                  className={controlClass}
                  {...describe("phone", errors.phone)}
                />
              </FormField>
            </div>
          </section>

          {/* Education */}
          <section aria-labelledby="education-heading" className="glass space-y-6 p-6 sm:p-8">
            <div id="education-heading">
              <SectionHeading
                title="Education and goal"
                text="We use this to suggest the right level and match you with classmates."
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField id="college" label="College">
                  <input
                    id="college"
                    type="text"
                    value={draft.college}
                    onChange={(e) => change({ college: e.target.value })}
                    className={controlClass}
                  />
                </FormField>
              </div>

              <FormField id="branch" label="Branch">
                <input
                  id="branch"
                  type="text"
                  placeholder="e.g. ECE, CSE"
                  value={draft.branch}
                  onChange={(e) => change({ branch: e.target.value })}
                  className={controlClass}
                />
              </FormField>

              <FormField id="study-year" label="Year of study">
                <select
                  id="study-year"
                  value={draft.studyYear}
                  onChange={(e) => change({ studyYear: e.target.value })}
                  className={controlClass}
                >
                  <option value="">Select year</option>
                  <option value="1">1st year</option>
                  <option value="2">2nd year</option>
                  <option value="3">3rd year</option>
                  <option value="4">4th year</option>
                </select>
              </FormField>

              <div className="sm:col-span-2">
                <FormField id="goal" label="Main learning goal">
                  <select
                    id="goal"
                    value={draft.goal}
                    onChange={(e) => change({ goal: e.target.value })}
                    className={controlClass}
                  >
                    <option value="">Select a goal</option>
                    {goals.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>
          </section>

          {/* Links */}
          <section aria-labelledby="links-heading" className="glass space-y-6 p-6 sm:p-8">
            <div id="links-heading">
              <SectionHeading
                title="Profiles and links"
                text="Paste the link to each profile. Leave out the ones you do not use."
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField id="linkedin" label="LinkedIn" error={errors.linkedin}>
                  <input
                    id="linkedin"
                    type="text"
                    inputMode="url"
                    autoComplete="off"
                    placeholder={linkedinField.placeholder}
                    value={draft.linkedin}
                    onChange={(e) => change({ linkedin: e.target.value })}
                    className={controlClass}
                    {...describe("linkedin", errors.linkedin)}
                  />
                </FormField>
              </div>

              {codingPlatforms.map((p) => (
                <FormField key={p.id} id={p.id} label={p.label} error={errors[p.id]}>
                  <input
                    id={p.id}
                    type="text"
                    inputMode="url"
                    autoComplete="off"
                    placeholder={p.placeholder}
                    value={draft.links[p.id] ?? ""}
                    onChange={(e) => changeLink(p.id, e.target.value)}
                    className={controlClass}
                    {...describe(p.id, errors[p.id])}
                  />
                </FormField>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-3">
            {message && (
              <p
                role={isError ? "alert" : "status"}
                className={`mr-auto text-sm ${isError ? "text-danger" : "text-success"}`}
              >
                {message}
              </p>
            )}
            {dirty && !saving && (
              <span className="text-sm text-muted">You have unsaved changes</span>
            )}
            <button
              type="submit"
              disabled={saving || !dirty}
              className="rounded-control bg-accent px-8 py-3 font-medium text-on-accent shadow-[0_8px_30px_-8px_var(--accent)] transition hover:bg-accent-hover disabled:opacity-60 disabled:shadow-none"
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}