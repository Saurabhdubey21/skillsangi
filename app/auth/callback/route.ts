import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

// Supabase email links (confirm email, reset password) come back to this
// address with a one-time ?code=. We swap it for a login session, then send
// the student on to the right page.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Only allow redirects inside our own site.
  const next = searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    // The reason goes to the server terminal only (never the code itself).
    console.error("[auth/callback] exchange failed:", error.message);
  } else {
    console.error(
      "[auth/callback] no code in the link. Params seen:",
      Array.from(searchParams.keys()).join(", ") || "none"
    );
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}