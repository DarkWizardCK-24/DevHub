"use client";

import Link from "next/link";
import { AlertTriangle, CalendarDays, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PRIORITY, PROJECT_STATUS } from "@/lib/constants";
import { dueLabel, formatDate } from "@/lib/format";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { cardHealth, HEALTH } from "./health";

function stats(project: Project) {
  const done = project.total_tasks ? Math.round((project.done_tasks / project.total_tasks) * 100) : project.progress;
  const due = project.target_date && project.status !== "completed" ? dueLabel(project.target_date) : null;
  return { done, due, health: HEALTH[cardHealth(project)] };
}

function DueText({ project }: { project: Project }) {
  const { due } = stats(project);
  if (!project.target_date) return <span className="text-faint">–</span>;
  return (
    <span className={cn("whitespace-nowrap", due?.overdue ? "font-medium text-coral" : due?.soon ? "text-amber" : "text-muted")}>
      {due ? due.text : formatDate(project.target_date)}
    </span>
  );
}

/** Wide row for the projects list view. */
export function ProjectRow({ project }: { project: Project }) {
  const { done, health } = stats(project);
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex items-center gap-4 rounded-[var(--radius-card)] border border-line/70 bg-surface p-3.5 shadow-card transition-all hover:border-line-strong hover:shadow-pop"
    >
      <span className="h-12 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: project.color }} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {project.is_pinned && <Pin className="size-3.5 shrink-0 fill-accent text-accent" aria-label="Pinned" />}
          <h3 className="truncate text-[15px] font-medium tracking-[-0.02em] text-ink transition-colors group-hover:text-accent">{project.name}</h3>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">{project.description || project.category || "No description yet."}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge tone={health.tone} dot>{health.label}</Badge>
          <Badge tone={PROJECT_STATUS[project.status].tone}>{PROJECT_STATUS[project.status].label}</Badge>
          {project.priority !== "medium" && <Badge tone={PRIORITY[project.priority].tone}>{PRIORITY[project.priority].label}</Badge>}
        </div>
      </div>
      <div className="hidden w-44 shrink-0 md:block">
        <div className="flex items-center justify-between text-[11px] text-muted">
          <span>{project.done_tasks}/{project.total_tasks} tasks</span>
          <span className="tabular-nums">{done}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-raised">
          <div className={cn("h-full rounded-full transition-all duration-700", done === 100 ? "bg-mint" : "bg-accent-grad")} style={{ width: `${done}%` }} />
        </div>
      </div>
      <div className="hidden w-36 shrink-0 text-right text-xs lg:block">
        <p className="flex items-center justify-end gap-1 text-muted"><CalendarDays className="size-3.5" /><DueText project={project} /></p>
        <p className={cn("mt-1", project.overdue_tasks > 0 ? "flex items-center justify-end gap-1 font-medium text-coral" : "text-faint")}>
          {project.overdue_tasks > 0 ? <><AlertTriangle className="size-3.5" /> {project.overdue_tasks} overdue</> : `${project.open_tasks} open`}
        </p>
      </div>
      <span className="shrink-0 text-right text-xs tabular-nums text-muted md:hidden">{done}%</span>
    </Link>
  );
}

/** Dense table for the projects compact view. */
export function ProjectTable({ projects }: { projects: Project[] }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line/70 bg-surface shadow-card">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-[11px] tracking-wide text-faint uppercase">
            <th className="px-4 py-2.5 font-medium">Project</th>
            <th className="px-3 py-2.5 font-medium">Status</th>
            <th className="px-3 py-2.5 font-medium">Progress</th>
            <th className="px-3 py-2.5 font-medium">Due</th>
            <th className="px-4 py-2.5 text-right font-medium">Tasks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {projects.map((project) => {
            const { done } = stats(project);
            return (
              <tr key={project.id} className="transition-colors hover:bg-surface-2/60">
                <td className="px-4 py-2">
                  <Link href={`/projects/${project.id}`} className="flex items-center gap-2.5 font-medium text-ink hover:text-accent">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: project.color }} aria-hidden />
                    <span className="truncate">{project.name}</span>
                    {project.is_pinned && <Pin className="size-3 shrink-0 fill-accent text-accent" aria-label="Pinned" />}
                  </Link>
                </td>
                <td className="px-3 py-2"><Badge tone={PROJECT_STATUS[project.status].tone}>{PROJECT_STATUS[project.status].label}</Badge></td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-raised"><div className={cn("h-full rounded-full", done === 100 ? "bg-mint" : "bg-accent")} style={{ width: `${done}%` }} /></div>
                    <span className="text-xs tabular-nums text-muted">{done}%</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-xs"><DueText project={project} /></td>
                <td className="px-4 py-2 text-right text-xs tabular-nums text-muted">
                  {project.done_tasks}/{project.total_tasks}
                  {project.overdue_tasks > 0 && <span className="ml-1.5 font-medium text-coral">{project.overdue_tasks}!</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
