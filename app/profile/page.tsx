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

const controlClass =
  "w-full rounded-control border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/30";

function FormField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const [savedName, setSavedName] = useState("");
  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [studyYear, setStudyYear] = useState("");
  const [goal, setGoal] = useState("");

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

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, college, branch, study_year, goal")
        .eq("id", user.id)
        .single();

      if (error) {
        setIsError(true);
        setMessage("Could not load profile: " + error.message);
        setSavedName((user.email ?? "").split("@")[0]);
      } else if (data) {
        setFullName(data.full_name ?? "");
        setSavedName(data.full_name?.trim() || (user.email ?? "").split("@")[0]);
        setCollege(data.college ?? "");
        setBranch(data.branch ?? "");
        setStudyYear(data.study_year ? String(data.study_year) : "");
        setGoal(data.goal ?? "");
      }
      setLoading(false);
    }

    load();
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

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
        full_name: fullName.trim() || null,
        college: college.trim() || null,
        branch: branch.trim() || null,
        study_year: studyYear ? Number(studyYear) : null,
        goal: goal || null,
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
      setIsError(false);
      setMessage("Profile saved.");
      setSavedName(fullName.trim() || (user.email ?? "").split("@")[0]);
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

  return (
    <AppShell userName={savedName}>
      <h1 className="text-3xl font-semibold sm:text-4xl">Your profile</h1>
      <p className="mt-2 max-w-xl text-muted">
        This helps us build your roadmap and find study partners.
      </p>

      <form onSubmit={handleSave} className="glass mt-8 max-w-xl space-y-5 p-6 sm:p-8">
        <FormField id="full-name" label="Full name">
          <input
            id="full-name"
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={controlClass}
          />
        </FormField>

        <FormField id="college" label="College">
          <input
            id="college"
            type="text"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            className={controlClass}
          />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="branch" label="Branch">
            <input
              id="branch"
              type="text"
              placeholder="e.g. ECE, CSE"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className={controlClass}
            />
          </FormField>

          <FormField id="study-year" label="Year of study">
            <select
              id="study-year"
              value={studyYear}
              onChange={(e) => setStudyYear(e.target.value)}
              className={controlClass}
            >
              <option value="">Select year</option>
              <option value="1">1st year</option>
              <option value="2">2nd year</option>
              <option value="3">3rd year</option>
              <option value="4">4th year</option>
            </select>
          </FormField>
        </div>

        <FormField id="goal" label="Main learning goal">
          <select
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
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

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-control bg-accent py-3 font-medium text-on-accent shadow-[0_8px_30px_-8px_var(--accent)] transition hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>

        {message && (
          <p
            role={isError ? "alert" : "status"}
            className={`text-sm ${isError ? "text-danger" : "text-success"}`}
          >
            {message}
          </p>
        )}
      </form>
    </AppShell>
  );
}