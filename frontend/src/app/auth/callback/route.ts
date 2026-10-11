import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/features/auth/schemas";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for links in Supabase emails (confirm signup, reset password).
 * Two link formats exist:
 *   ?code=...                 PKCE flow (default templates with @supabase/ssr)
 *   ?token_hash=...&type=...  custom templates using {{ .TokenHash }}
 * Either way we exchange it for a session (cookies), then redirect.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let ok = false;

  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  }

  return NextResponse.redirect(ok ? `${origin}${next}` : `${origin}/login?error=link_invalid`);
}
