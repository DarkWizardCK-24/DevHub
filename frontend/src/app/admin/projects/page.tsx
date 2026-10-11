import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { ProjectsManager } from "@/features/admin/components/projects-manager";

export const metadata: Metadata = { title: "Projects · Admin" };

export default function AdminProjectsPage() {
  return (
    <>
      <PageHeader title="All projects" description="Every project in the workspace with its owner and content. Admins can remove projects; all actions are audited." />
      <ProjectsManager />
    </>
  );
}
