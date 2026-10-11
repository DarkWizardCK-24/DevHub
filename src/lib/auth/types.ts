/** Mirrors backend `ProfileOut` (app/modules/profiles/schemas.py). */
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: "user" | "admin";
  is_active: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export const displayName = (profile: Pick<Profile, "full_name" | "email">) =>
  profile.full_name?.trim() || profile.email.split("@")[0];
