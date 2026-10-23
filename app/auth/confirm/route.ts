import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

// Two kinds of email link can arrive here:
// 1) ?token_hash=...&type=...  (new templates). Works in ANY browser or phone,
//    because it does not need the browser that started the request.
// 2) ?code=...  (old-style link). Only works in the same browser that asked
//    for the email. Kept so links made before the template change still work.
// Both may carry ?next=/some-page (only paths inside our own site are used).

const ALLOWED_TYPES: EmailOtpType[] = ["email", "signup", "recovery"];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  // Only allow redirects inside our own site.
  const next = searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  const supabase = await createClient();

  if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
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

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/confirm] code exchange failed:", error.message);
      return NextResponse.redirect(`${origin}/login?error=link`);
    }
    return NextResponse.redirect(`${origin}${safeNext}`);
  }

  console.error(
    "[auth/confirm] no usable token_hash/type or code. Params seen:",
    Array.from(searchParams.keys()).join(", ") || "none"
  );
  return NextResponse.redirect(`${origin}/login?error=link`);
}