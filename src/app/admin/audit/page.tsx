import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { AuditLog } from "@/features/admin/components/audit-log";

export const metadata: Metadata = { title: "Audit log · Admin" };

export default function AdminAuditPage() {
  return (
    <>
      <PageHeader title="Audit log" description="Who did what, to which item, when and from where. Covers every user and every module." />
      <AuditLog />
    </>
  );
}
