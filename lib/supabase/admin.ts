import "server-only";

// Server-only. A Supabase client that uses the SERVICE-ROLE key.
// It skips row-level security, so use it ONLY inside API routes, and ONLY after you have
// checked the student is logged in (supabase.auth.getUser()) and passed their user id yourself.
// Never import this file into a "use client" page, and never name the key NEXT_PUBLIC_...
//
// Save as: lib/supabase/admin.ts

import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin client is not configured");

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}