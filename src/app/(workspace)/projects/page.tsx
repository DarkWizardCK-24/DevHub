import type { Metadata } from "next";
import { ProjectsView } from "@/features/projects/projects-view";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const { new: openNew } = await searchParams;
  return <ProjectsView openNew={openNew === "1"} />;
}
