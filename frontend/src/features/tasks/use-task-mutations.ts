"use client";

import type { KeyedMutator } from "swr";
import { toast } from "sonner";
import { refresh } from "@/hooks/use-api";
import { api, errorMessage } from "@/lib/api/client";
import type { Page, Task, TaskStatus } from "@/lib/types";

/**
 * Optimistic task updates: the UI changes immediately, the request runs in
 * the background, and on failure SWR rolls back to the server's data.
 */
export function useTaskMutations(mutate: KeyedMutator<Page<Task>>) {
  async function update(task: Task, changes: Partial<Pick<Task, "status" | "position">>, successMessage?: string) {
    // Only called from a rendered list, so the page is always loaded.
    const optimistic = (page?: Page<Task>) => ({ ...page!, items: page!.items.map((t) => (t.id === task.id ? { ...t, ...changes } : t)) });
    try {
      await mutate(
        async (page) => {
          const saved = await api.patch<Task>(`/tasks/${task.id}`, changes);
          return page && { ...page, items: page.items.map((t) => (t.id === task.id ? saved : t)) };
        },
        { optimisticData: optimistic, rollbackOnError: true, revalidate: false },
      );
      if (successMessage) toast.success(successMessage);
      refresh("/dashboard", "/projects", "/activity");
    } catch (error) {
      toast.error("Task not updated", { description: errorMessage(error) });
    }
  }

  return {
    toggleDone: (task: Task) =>
      update(task, { status: task.status === "done" ? "todo" : "done" }, task.status === "done" ? "Task reopened" : "Task completed"),
    move: (task: Task, status: TaskStatus, position: number) => update(task, { status, position }),
  };
}
