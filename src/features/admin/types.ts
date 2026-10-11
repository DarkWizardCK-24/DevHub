import type { Profile } from "@/lib/auth/types";

/** Mirrors backend app/modules/admin/schemas.py */
export interface SystemStats {
  users: number;
  active_users: number;
  admins: number;
  new_users_7d: number;
  projects: number;
  tasks: number;
  files: number;
  storage_bytes: number;
  builds: number;
}

export interface UserPage {
  items: Profile[];
  total: number;
  limit: number;
  offset: number;
}
