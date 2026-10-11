import { AppShell } from "@/components/shell/app-shell";
import { SetupRequired } from "@/components/setup/setup-required";
import { isSupabaseConfigured } from "@/lib/env";
import { requireProfile } from "@/lib/auth/session";

/** Every page in (workspace) requires a signed-in, active user. */
export default async function WorkspaceLayout({ children }: LayoutProps<"/">) {
  if (!isSupabaseConfigured) return <SetupRequired />;
  const profile = await requireProfile();
  return <AppShell profile={profile}>{children}</AppShell>;
}
