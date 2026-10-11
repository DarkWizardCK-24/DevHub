import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban, HardDrive, ListChecks, Package, ScrollText, ShieldCheck, UserPlus, Users } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { buttonStyles } from "@/components/ui/button";
import { StatCard } from "@/features/admin/components/stat-card";
import type { SystemStats } from "@/features/admin/types";
import { serverApi } from "@/lib/api/server";
import { formatBytes } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const stats = await serverApi<SystemStats>("/admin/stats"); // errors → admin/error.tsx

  return (
    <>
      <PageHeader
        title="System overview"
        description="Accounts and content across the whole workspace."
        actions={
          <>
            <Link href="/admin/audit" className={buttonStyles({ variant: "secondary" })}>
              <ScrollText className="size-4" /> Audit log
            </Link>
            <Link href="/admin/users" className={buttonStyles({ variant: "primary" })}>
              <Users className="size-4" /> Manage users
            </Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
        <StatCard label="Users" value={stats.users} detail={`${stats.active_users} active`} icon={<Users />} tone="iris" href="/admin/users" />
        <StatCard label="Admins" value={stats.admins} detail="Full access" icon={<ShieldCheck />} tone="coral" href="/admin/users" />
        <StatCard label="New this week" value={stats.new_users_7d} detail="Accounts created in 7 days" icon={<UserPlus />} tone="mint" href="/admin/users" />
        <StatCard label="Storage" value={formatBytes(stats.storage_bytes)} detail={`${stats.files} files`} icon={<HardDrive />} tone="sky" href="/admin/projects" />
        <StatCard label="Projects" value={stats.projects} detail="View all projects and their teams" icon={<FolderKanban />} href="/admin/projects" />
        <StatCard label="Tasks" value={stats.tasks} icon={<ListChecks />} tone="mint" href="/tasks" />
        <StatCard label="Builds" value={stats.builds} icon={<Package />} tone="sky" href="/builds" />
      </div>
    </>
  );
}
