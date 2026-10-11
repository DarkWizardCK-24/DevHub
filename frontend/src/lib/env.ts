/**
 * Public (browser-safe) configuration.
 *
 * NEXT_PUBLIC_* values are inlined into the JS bundle at build time, so they
 * must be referenced literally (process.env.NEXT_PUBLIC_X), not dynamically.
 * Nothing secret ever belongs here: the publishable key is designed to be
 * public, and RLS (deny-all) means it can't read any table by itself.
 */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  apiUrl: (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, ""),
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
};

/** Lets the app render a setup screen instead of crashing before keys are added. */
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseKey);
