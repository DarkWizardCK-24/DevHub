import { redirect } from "next/navigation";
import { cache } from "react";
import { ApiError } from "@/lib/api/core";
import { serverApi } from "@/lib/api/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "./types";

/**
 * The signed-in user's profile, or a redirect to /login.
 *
 * This is the real gate for pages (proxy.ts only does an optimistic check).
 * `cache` dedupes it: layout + page can both call it in one render and only
 * one request reaches the API.
 */
export const requireProfile = cache(async (): Promise<Profile> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  try {
    return await serverApi<Profile>("/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/login");
    throw error; // 403 (deactivated), 503, network → nearest error boundary
  }
});

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}
