import { AppShell } from "@/components/shell/app-shell";
import { SetupRequired } from "@/components/setup/setup-required";
import { AdminTabs } from "@/features/admin/components/admin-tabs";
import { requireAdmin } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Admin area. requireAdmin() redirects non-admins before anything renders;
 * FastAPI independently rejects non-admin calls to /api/admin/*, so hiding
 * the UI is never the only protection.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!isSupabaseConfigured) return <SetupRequired />;
  const profile = await requireAdmin();

  return (
    <AppShell profile={profile}>
      <AdminTabs />
      {children}
    </AppShell>
  );
}
