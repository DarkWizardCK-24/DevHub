import { AppShell } from "@/components/shell/app-shell";
import { SessionProblem } from "@/components/shell/session-problem";
import { SetupRequired } from "@/components/setup/setup-required";
import { isSupabaseConfigured } from "@/lib/env";
import { loadProfile } from "@/lib/auth/session";

/** Every page in (workspace) requires a signed-in, active user. */
export default async function WorkspaceLayout({ children }: LayoutProps<"/">) {
  if (!isSupabaseConfigured) return <SetupRequired />;
  const result = await loadProfile();
  if ("error" in result) {
    return <SessionProblem status={result.error.status} message={result.error.message} requestId={result.error.requestId} />;
  }
  return <AppShell profile={result.profile}>{children}</AppShell>;
}
