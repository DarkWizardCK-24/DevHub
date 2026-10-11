import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { UsersManager } from "@/features/admin/components/users-manager";

export const metadata: Metadata = { title: "Users · Admin" };

export default function AdminUsersPage() {
  return (
    <>
      <PageHeader title="Users" description="Create accounts, reset passwords, change roles or deactivate access. Public sign-up is off." />
      <UsersManager />
    </>
  );
}
