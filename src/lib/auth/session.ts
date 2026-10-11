import { redirect } from "next/navigation";
import { cache } from "react";
import { ApiError } from "@/lib/api/core";
import { serverApi } from "@/lib/api/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "./types";

export type ProfileResult = { profile: Profile } | { error: ApiError };

/**
 * Loads the signed-in user's profile, or redirects to /login when there is no session.
 *
 * Any other API failure (deactivated account, missing profile, API down) is RETURNED instead of
 * thrown. In production React replaces a Server Component's error message with "Minified React
 * error #441", so layouts use this to show the real reason on screen.
 */
export const loadProfile = cache(async (): Promise<ProfileResult> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  try {
    return { profile: await serverApi<Profile>("/me") };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) redirect("/login");
      return { error };
    }
    throw error;
  }
});

/**
 * The signed-in user's profile, or a redirect to /login.
 *
 * This is the real gate for pages (proxy.ts only does an optimistic check).
 * `cache` dedupes it: layout + page can both call it in one render and only
 * one request reaches the API.
 */
export const requireProfile = cache(async (): Promise<Profile> => {
  const result = await loadProfile();
  if ("error" in result) throw result.error; // 403 (deactivated), 503, network → nearest error boundary
  return result.profile;
});

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}
