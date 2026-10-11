"use client";

import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { refresh, useApi } from "@/hooks/use-api";
import { api, errorMessage } from "@/lib/api/client";
import type { DashboardData, Task } from "@/lib/types";
import { DashboardHero } from "./dashboard-hero";
import { ActivityWidget, BuildsWidget, DueTasksWidget, ProjectsWidget, QuickToolsWidget } from "./widgets";

function WidgetSkeleton() {
  return (
    <div className="space-y-3 rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-3 w-3/5" />
    </div>
  );
}

export function DashboardView({ name }: { name: string }) {
  const { data, error, isLoading, mutate } = useApi<DashboardData>("/dashboard");

  async function toggle(task: Task) {
    try {
      await api.patch(`/tasks/${task.id}`, { status: task.status === "done" ? "todo" : "done" });
      toast.success("Task completed");
      await Promise.all([mutate(), refresh("/tasks", "/projects", "/activity")]);
    } catch (err) {
      toast.error("Task not updated", { description: errorMessage(err) });
    }
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <DashboardHero name={name} data={data} />
      {error && !data ? (
        <Card>
          <ErrorState title="Dashboard data didn't load" message={error.message} onRetry={() => mutate()} />
        </Card>
      ) : (
        <div className="grid gap-5 md:gap-6 lg:grid-cols-5">
          <div className="space-y-5 md:space-y-6 lg:col-span-3">
            {isLoading && !data ? <WidgetSkeleton /> : <DueTasksWidget tasks={data?.due_tasks ?? []} onToggle={toggle} />}
            {isLoading && !data ? <WidgetSkeleton /> : <ProjectsWidget projects={data?.projects ?? []} />}
          </div>
          <div className="space-y-5 md:space-y-6 lg:col-span-2">
            <QuickToolsWidget />
            {isLoading && !data ? <WidgetSkeleton /> : <BuildsWidget builds={data?.builds ?? []} />}
            {isLoading && !data ? <WidgetSkeleton /> : <ActivityWidget items={data?.activity ?? []} />}
          </div>
        </div>
      )}
    </div>
  );
}
