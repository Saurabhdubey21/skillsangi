"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

type Profile = {
  full_name: string | null;
  college: string | null;
};

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

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
                <span className="text-xl font-bold text-indigo-600">SkillSangi</span>
        <div className="flex gap-3">
          <Link
            href="/profile"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100"
          >
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-3xl font-bold">
          Welcome, {profile?.full_name || email}!
        </h1>
        <p className="mt-2 text-slate-600">
          This is your dashboard. Your roadmap, AI teacher and study partner
          will appear here.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {["My Roadmap", "AI Teacher", "Study Partner"].map((title) => (
            <div
              key={title}
              className="rounded-xl border border-slate-200 bg-white p-6"
            >
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-slate-500">Coming soon</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}