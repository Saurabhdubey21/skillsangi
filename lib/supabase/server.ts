import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-only Supabase client. It reads the student's login from cookies.
// Never import this file into a "use client" page.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored when called where cookies can't be changed.
          }
        },
      },
    }
  );
}