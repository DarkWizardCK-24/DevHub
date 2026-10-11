import type { Metadata } from "next";
import { TasksView } from "@/features/tasks/tasks-view";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage({ searchParams }: PageProps<"/tasks">) {
  const { new: openNew, task } = await searchParams;
  return <TasksView openNew={openNew === "1"} openTaskId={typeof task === "string" ? task : undefined} />;
}
