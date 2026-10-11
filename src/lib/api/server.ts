import { createClient } from "@/lib/supabase/server";
import { request, type RequestOptions } from "./core";

/**
 * API client for Server Components. The token comes from the request's
 * session cookies; FastAPI verifies it, so reading it without re-verifying
 * here is safe.
 */
export async function serverApi<T>(path: string, options?: RequestOptions): Promise<T> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return request<T>(path, data.session?.access_token ?? null, options);
}
