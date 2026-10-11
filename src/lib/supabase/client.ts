import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let client: SupabaseClient | undefined;

/**
 * Supabase client for Client Components. One instance per tab: it stores the
 * session in cookies (shared with the server) and refreshes tokens itself.
 * We use it ONLY for auth. All data goes through the FastAPI backend.
 */
export function createClient(): SupabaseClient {
  client ??= createBrowserClient(env.supabaseUrl, env.supabaseKey);
  return client;
}
