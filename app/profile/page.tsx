"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

const goals = [
  "DSA and problem solving",
  "Web development",
  "AI / Machine Learning",
  "Embedded systems / VLSI",
  "Placement preparation",
  "Other",
];

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

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
      } else if (data) {
        setFullName(data.full_name ?? "");
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
      router.replace("/login");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        college: college.trim() || null,
        branch: branch.trim() || null,
        study_year: studyYear ? Number(studyYear) : null,
        goal: goal || null,
      })
      .eq("id", user.id);

    if (error) {
      setIsError(true);
      setMessage(error.message);
    } else {
      setIsError(false);
      setMessage("Profile saved!");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading...
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-indigo-500";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-xl font-bold text-indigo-600">SkillSangi</span>
        <Link
          href="/dashboard"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100"
        >
          Back to dashboard
        </Link>
      </header>

      <main className="mx-auto max-w-xl px-6 py-8">
        <h1 className="text-3xl font-bold">Your profile</h1>
        <p className="mt-2 text-slate-600">
          This helps us build your roadmap and find study partners.
        </p>

        <form
          onSubmit={handleSave}
          className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">Full name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">College</label>
            <input
              type="text"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Branch</label>
            <input
              type="text"
              placeholder="e.g. ECE, CSE"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Year of study</label>
            <select
              value={studyYear}
              onChange={(e) => setStudyYear(e.target.value)}
              className={inputClass}
            >
              <option value="">Select year</option>
              <option value="1">1st year</option>
              <option value="2">2nd year</option>
              <option value="3">3rd year</option>
              <option value="4">4th year</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Main learning goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className={inputClass}
            >
              <option value="">Select a goal</option>
              {goals.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>

          {message && (
            <p className={`text-sm ${isError ? "text-red-600" : "text-green-600"}`}>
              {message}
            </p>
          )}
        </form>
      </main>
    </div>
  );
}