import type { Metadata } from "next";
import { ProjectDetailView } from "@/features/projects/project-detail";
import { isProjectTab } from "@/features/projects/project-tabs";

export const metadata: Metadata = { title: "Project" };

export default async function ProjectPage({ params, searchParams }: PageProps<"/projects/[id]">) {
  const [{ id }, { tab }] = await Promise.all([params, searchParams]);
  // key: a different project gets a fresh component (tab state resets).
  return <ProjectDetailView key={id} projectId={id} initialTab={isProjectTab(tab) ? tab : "overview"} />;
}
