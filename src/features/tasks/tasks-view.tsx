"use client";

import { CalendarDays, ChevronDown, Columns3, GanttChart, List, Plus } from "lucide-react";
import { motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BoardIllustration } from "@/components/illustrations";
import { PageHeader } from "@/components/shell/page-header";
import { useProjectOptions } from "@/components/shared/project-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { SearchInput } from "@/components/ui/search-input";
import { SelectField } from "@/components/ui/select-field";
import { useApi } from "@/hooks/use-api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { PRIORITY, TASK_STATUS, TASK_STATUS_ORDER, options } from "@/lib/constants";
import type { Page, Priority, Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TaskBoard } from "./task-board";
import { TaskCalendar } from "./task-calendar";
import { TaskForm, type TaskDefaults } from "./task-form";
import { TaskTimeline } from "./task-timeline";
import { TaskRow } from "./task-row";
import { useTaskMutations } from "./use-task-mutations";

type View = "list" | "board" | "timeline" | "calendar";
const VIEWS: { value: View; label: string; icon: typeof List }[] = [
  { value: "list", label: "List", icon: List },
  { value: "board", label: "Board", icon: Columns3 },
  { value: "timeline", label: "Timeline", icon: GanttChart },
  { value: "calendar", label: "Calendar", icon: CalendarDays },
];

/**
 * Tasks page, also embedded in a project's Tasks tab (pass `projectId`).
 * `openTaskId` / `openNew` come from the URL (?task=…, ?new=1) so search
 * results and the mobile create button can deep-link into a task.
 */
export function TasksView({
  projectId,
  openNew = false,
  openTaskId,
  projectDates,
}: {
  projectId?: string;
  openNew?: boolean;
  openTaskId?: string;
  projectDates?: { start: string | null; target: string | null };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const embedded = Boolean(projectId);
  const [view, setView] = useState<View>("list");
  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query.trim());
  const [projectFilter, setProjectFilter] = useState("");
  const [priority, setPriority] = useState<"" | Priority>("");
  const [showDone, setShowDone] = useState(false);
  const [form, setForm] = useState<{ task?: Task; defaults?: TaskDefaults } | null>(openNew ? { defaults: { projectId } } : null);
  const projectOptions = useProjectOptions();

  const { data, error, isLoading, mutate } = useApi<Page<Task>>("/tasks", {
    project_id: projectId ?? (projectFilter || undefined),
    priority: priority || undefined,
    q,
    limit: 500,
  });
  const { toggleDone, move } = useTaskMutations(mutate);
  const tasks = data?.items ?? [];

  const deepLinked = openTaskId ? tasks.find((t) => t.id === openTaskId) : undefined;
  const formState = form ?? (deepLinked ? { task: deepLinked } : null);

  const closeForm = () => {
    setForm(null);
    if (openNew || openTaskId) router.replace(pathname);
  };
  const openTask = (task: Task) => setForm({ task });
  const add = (defaults: TaskDefaults = {}) => setForm({ defaults: { projectId, ...defaults } });

  const open = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");

  const body = () => {
    if (isLoading && !data) return <Card><ListSkeleton rows={6} /></Card>;
    if (error) return <Card><ErrorState title="Tasks didn't load" message={error.message} onRetry={() => mutate()} /></Card>;
    if (tasks.length === 0 && view !== "calendar" && view !== "board" && view !== "timeline")
      return (
        <Card>
          <EmptyState
            illustration={<BoardIllustration />}
            title={q || priority || projectFilter ? "No matching tasks" : "No tasks yet"}
            description={q || priority || projectFilter ? "Try clearing a filter." : "Capture what needs doing, then work through it on the board."}
            action={!q && !priority ? <Button onClick={() => add()}><Plus className="size-4" /> New task</Button> : undefined}
          />
        </Card>
      );

    if (view === "board") return <TaskBoard tasks={tasks} onOpen={openTask} onToggle={toggleDone} onMove={move} onAdd={(status) => add({ status })} showProject={!embedded} />;
    if (view === "timeline") return <TaskTimeline tasks={tasks} onOpen={openTask} rangeStart={projectDates?.start} rangeEnd={projectDates?.target} showProject={!embedded} />;
    if (view === "calendar") return <TaskCalendar tasks={tasks} onOpen={openTask} onToggle={toggleDone} onAdd={(dueDate) => add({ dueDate })} />;

    return (
      <div className="space-y-4">
        {TASK_STATUS_ORDER.filter((s) => s !== "done").map((status) => {
          const group = open.filter((t) => t.status === status);
          if (group.length === 0) return null;
          return (
            <Card key={status} className="overflow-hidden">
              <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
                <Badge tone={TASK_STATUS[status].tone} dot>{TASK_STATUS[status].label}</Badge>
                <span className="text-xs text-faint">{group.length}</span>
              </div>
              <ul className="divide-y divide-line">
                {group.map((task) => <TaskRow key={task.id} task={task} onToggle={() => toggleDone(task)} onOpen={() => openTask(task)} showProject={!embedded} />)}
              </ul>
            </Card>
          );
        })}
        {open.length === 0 && <Card><p className="p-5 text-sm text-muted">All open tasks are done. 🎉</p></Card>}
        {done.length > 0 && (
          <Card className="overflow-hidden">
            <button type="button" onClick={() => setShowDone((v) => !v)} aria-expanded={showDone} className="flex w-full items-center gap-2 px-4 py-3 text-left">
              <Badge tone="mint" dot>Done</Badge>
              <span className="text-xs text-faint">{done.length}</span>
              <ChevronDown className={cn("ml-auto size-4 text-faint transition-transform", showDone && "rotate-180")} />
            </button>
            {showDone && (
              <ul className="divide-y divide-line border-t border-line">
                {done.map((task) => <TaskRow key={task.id} task={task} onToggle={() => toggleDone(task)} onOpen={() => openTask(task)} showProject={!embedded} />)}
              </ul>
            )}
          </Card>
        )}
      </div>
    );
  };

  return (
    <>
      {!embedded && (
        <PageHeader
          title="Tasks"
          description={data ? `${open.length} open, ${done.length} done` : "Plan work as a list, a board, a timeline or a calendar."}
          actions={<Button onClick={() => add()} className="w-full md:w-auto"><Plus className="size-4" /> New task</Button>}
        />
      )}

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div role="tablist" aria-label="View" className="flex rounded-[var(--radius-control)] border border-line bg-surface-2 p-1">
          {VIEWS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              role="tab"
              aria-selected={view === value}
              onClick={() => setView(value)}
              className={cn("relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium md:flex-none", view === value ? "text-ink" : "text-muted")}
            >
              {view === value && <motion.span layoutId={`task-view-${projectId ?? "all"}`} className="absolute inset-0 rounded-lg bg-surface shadow-card" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
              <Icon className="relative size-4" />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 md:flex md:justify-end">
          {!embedded && (
            <SelectField aria-label="Filter by project" placeholder="All projects" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} options={projectOptions.map((p) => ({ value: p.id, label: p.name }))} className="md:w-44" />
          )}
          <SelectField aria-label="Filter by priority" placeholder="Any priority" value={priority} onChange={(e) => setPriority(e.target.value as "" | Priority)} options={options(PRIORITY)} className={cn("md:w-36", embedded && "col-span-2")} />
          <SearchInput value={query} onValueChange={setQuery} placeholder="Search tasks" className="col-span-2 md:w-56" />
        </div>
        {embedded && <Button onClick={() => add()} className="md:ml-2"><Plus className="size-4" /> New task</Button>}
      </div>

      {body()}

      <TaskForm open={formState !== null} onClose={closeForm} task={formState?.task} defaults={formState?.defaults} />
    </>
  );
}
