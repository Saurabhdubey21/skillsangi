"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./supabase/client";
import type { Status } from "./problems";

export type Progress = { status: Status; bookmarked: boolean };

export function useProblemProgress() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [error, setError] = useState("");

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
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      setUserName(profile?.full_name?.trim() || (user.email ?? "").split("@")[0]);

      const { data, error: loadError } = await supabase
        .from("problem_progress")
        .select("problem_id, status, bookmarked")
        .eq("user_id", user.id);

      if (loadError) {
        setError("Could not load your progress: " + loadError.message);
      } else {
        const map: Record<string, Progress> = {};
        for (const row of data ?? []) {
          map[row.problem_id] = {
            status: row.status as Status,
            bookmarked: row.bookmarked,
          };
        }
        setProgress(map);
      }
      setLoading(false);
    }

    load();
  }, [router]);

  const save = useCallback(
    async (problemId: string, next: Progress) => {
      if (!userId) return;
      const previous = progress[problemId];
      setProgress((p) => ({ ...p, [problemId]: next }));
      setError("");

      const supabase = createClient();
      const { error: saveError } = await supabase.from("problem_progress").upsert(
        {
          user_id: userId,
          problem_id: problemId,
          status: next.status,
          bookmarked: next.bookmarked,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,problem_id" }
      );

      if (saveError) {
        // Undo the change on screen and tell the student
        setProgress((p) => {
          const copy = { ...p };
          if (previous) copy[problemId] = previous;
          else delete copy[problemId];
          return copy;
        });
        setError("Could not save that change: " + saveError.message);
      }
    },
    [userId, progress]
  );

  return { loading, userName, progress, error, save };
}