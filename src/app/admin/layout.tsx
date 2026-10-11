import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { SessionProblem } from "@/components/shell/session-problem";
import { SetupRequired } from "@/components/setup/setup-required";
import { AdminTabs } from "@/features/admin/components/admin-tabs";
import { loadProfile } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Admin area. Non-admins are redirected before anything renders;
 * FastAPI independently rejects non-admin calls to /api/admin/*, so hiding
 * the UI is never the only protection.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!isSupabaseConfigured) return <SetupRequired />;
  const result = await loadProfile();
  if ("error" in result) {
    return <SessionProblem status={result.error.status} message={result.error.message} requestId={result.error.requestId} />;
  }
  if (result.profile.role !== "admin") redirect("/dashboard");

  return (
    <AppShell profile={result.profile}>
      <AdminTabs />
      {children}
    </AppShell>
  );
}
