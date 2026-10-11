import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env, isSupabaseConfigured } from "@/lib/env";

/** Pages anyone can open. Everything else requires a session. */
const PUBLIC_PATHS = ["/login", "/forgot-password", "/auth"];
/** Signed-in users who open these are sent to the dashboard instead. */
const GUEST_ONLY_PATHS = ["/login", "/forgot-password"];

const matches = (pathname: string, paths: string[]) =>
  paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

/**
 * Runs before every page request:
 *  1. Refreshes the Supabase session if the access token expired, writing new
 *     cookies to both the request (for this render) and the response.
 *  2. Optimistic redirect: no session → /login. This is a UX convenience,
 *     not the security boundary. The workspace layout and FastAPI verify again.
 */
export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl, env.supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // getClaims() verifies the JWT signature (via the project's public keys),
  // unlike getSession(), which only reads the cookie. Don't put code between
  // createServerClient and this call: it can cause random logouts.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims);
  const { pathname, search } = request.nextUrl;

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    if (path === "/login" && pathname !== "/") url.searchParams.set("next", pathname + search);
    const redirect = NextResponse.redirect(url);
    // Carry refreshed auth cookies over to the redirect response.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (!isSignedIn && !matches(pathname, PUBLIC_PATHS)) return redirectTo("/login");
  if (isSignedIn && matches(pathname, GUEST_ONLY_PATHS)) return redirectTo("/dashboard");

  return response;
}
