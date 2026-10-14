"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import AppShell from "../components/AppShell";

type Profile = {
  full_name: string | null;
  college: string | null;
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const upcoming = [
  {
    title: "AI Teacher",
    text: "Ask a doubt in plain language and get a step-by-step explanation.",
  },
  {
    title: "Study Partner",
    text: "Get matched with a classmate who has similar goals and free time.",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Not logged in -> send to the login page
      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select("full_name, college")
        .eq("id", user.id)
        .single();

      setProfile(data);
      setLoading(false);
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <div
        role="status"
        className="backdrop-wash flex min-h-screen items-center justify-center text-muted"
      >
        Loading your dashboard...
      </div>
    );
  }

  const displayName = profile?.full_name?.trim() || email.split("@")[0];
  const firstName = displayName.split(" ")[0];

  return (
    <AppShell userName={displayName}>
      <h1 className="text-3xl font-semibold sm:text-4xl">
        {greeting()}, {firstName}
      </h1>
      <p className="mt-2 text-muted">
        Pick up your plan, or set one up in about a minute.
      </p>

      <section className="glass mt-8 flex flex-col items-start justify-between gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <h2 className="text-xl font-semibold">Today&apos;s plan</h2>
          <p className="mt-2 max-w-md text-muted">
            Your daily tasks live on your roadmap. Open it to see what is due
            today and tick tasks off as you finish them.
          </p>
        </div>
        <Link
          href="/roadmap"
          className="shrink-0 rounded-control bg-accent px-6 py-3 font-medium text-on-accent shadow-[0_8px_30px_-8px_var(--accent)] transition hover:bg-accent-hover"
        >
          Open my roadmap
        </Link>
      </section>

      {!profile?.college && (
        <section className="mt-4 flex flex-col items-start justify-between gap-3 rounded-panel border border-border bg-surface p-5 sm:flex-row sm:items-center">
          <p className="text-sm">
            <span className="font-medium">Add your college.</span>{" "}
            <span className="text-muted">
              It helps us match you with classmates when study partners launch.
            </span>
          </p>
          <Link
            href="/profile"
            className="shrink-0 text-sm font-medium text-accent hover:underline"
          >
            Update profile
          </Link>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Coming next</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {upcoming.map((item) => (
            <div key={item.title} className="rounded-panel border border-border bg-surface p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{item.title}</h3>
                <span className="rounded-full border border-border bg-surface-strong px-2.5 py-0.5 text-xs font-medium text-muted">
                  Coming soon
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}