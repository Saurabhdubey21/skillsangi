import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

// Email links built from {{ .TokenHash }} (confirm sign up, reset password)
// come back here with ?token_hash=...&type=...&next=... . Unlike the
// /auth/callback route, this does not need the browser that started the
// request, so the link also works on a phone or another browser.
// NOTE: nothing sends students here until the Supabase email templates are
// changed to use this address.

const ALLOWED_TYPES: EmailOtpType[] = ["email", "signup", "recovery"];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Only allow redirects inside our own site.
  const next = searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (!tokenHash || !type || !ALLOWED_TYPES.includes(type)) {
    console.error(
      "[auth/confirm] missing or unsupported token_hash/type. Params seen:",
      Array.from(searchParams.keys()).join(", ") || "none"
    );
    return NextResponse.redirect(`${origin}/login?error=link`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    // The reason goes to the server terminal only (never the token itself).
    console.error("[auth/confirm] verify failed:", error.message);
    return NextResponse.redirect(`${origin}/login?error=link`);
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}