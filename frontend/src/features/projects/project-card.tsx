"use client";

import Link from "next/link";
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import { PRIORITY, PROJECT_STATUS } from "@/lib/constants";
import { dueLabel, formatDate } from "@/lib/format";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { cardHealth, elapsedPct, hoursLabel, HEALTH } from "./health";

/** Overview card for the projects grid: identity, health, task stats, schedule and effort at a glance. */
export function ProjectCard({ project }: { project: Project }) {
  const health = HEALTH[cardHealth(project)];
  const due = project.target_date && project.status !== "completed" ? dueLabel(project.target_date) : null;
  const done = project.total_tasks ? Math.round((project.done_tasks / project.total_tasks) * 100) : 0;
  const elapsed = elapsedPct(project.start_date, project.target_date);
  const effortMax = Math.max(project.estimated_minutes, project.actual_minutes, 1);
  const inProgress = Math.max(project.open_tasks - project.overdue_tasks, 0);

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line/70 bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-pop"
    >
      {/* color band */}
      <div
        aria-hidden
        className="relative h-16 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${project.color}, color-mix(in srgb, ${project.color} 45%, #8a5cf6))` }}
      >
        <div className="absolute -top-8 -right-6 size-32 rounded-full bg-white/15 blur-2xl transition-transform duration-500 group-hover:scale-125" />
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:14px_14px]" />
      </div>

      <div className="relative -mt-7 flex items-end justify-between px-5">
        <div className="grid size-12 place-items-center rounded-2xl border-4 border-surface text-lg font-medium text-white shadow-card" style={{ backgroundColor: project.color }}>
          {project.name.slice(0, 1).toUpperCase()}
        </div>
        <ProgressRing value={done || project.progress} size={48} stroke={4} className="rounded-full bg-surface" />
      </div>

      <div className="flex flex-1 flex-col px-5 pt-3 pb-5">
        <div className="flex items-center gap-1.5">
          {project.is_pinned && <Pin className="size-3.5 shrink-0 fill-accent text-accent" aria-label="Pinned" />}
          <h3 className="truncate text-[16px] font-medium tracking-[-0.02em] text-ink transition-colors group-hover:text-accent">{project.name}</h3>
        </div>
        <p className="mt-1 line-clamp-2 min-h-9 text-xs leading-relaxed text-muted">{project.description || project.category || "No description yet."}</p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Badge tone={health.tone} dot>{health.label}</Badge>
          <Badge tone={PROJECT_STATUS[project.status].tone}>{PROJECT_STATUS[project.status].label}</Badge>
          {project.priority !== "medium" && <Badge tone={PRIORITY[project.priority].tone}>{PRIORITY[project.priority].label}</Badge>}
        </div>

        {/* task stats */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span className="flex items-center gap-1"><CheckCircle2 className="size-3.5 text-mint" /> {project.done_tasks}/{project.total_tasks} tasks</span>
            {project.overdue_tasks > 0 ? (
              <span className="flex items-center gap-1 font-medium text-coral"><AlertTriangle className="size-3.5" /> {project.overdue_tasks} overdue</span>
            ) : (
              <span>{project.open_tasks} open</span>
            )}
          </div>
          <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-raised" role="img" aria-label={`${project.done_tasks} done, ${inProgress} open, ${project.overdue_tasks} overdue`}>
            {project.total_tasks > 0 && (
              <>
                <div className="bg-mint transition-all duration-700" style={{ width: `${(project.done_tasks / project.total_tasks) * 100}%` }} />
                <div className="bg-accent/70 transition-all duration-700" style={{ width: `${(inProgress / project.total_tasks) * 100}%` }} />
                <div className="bg-coral transition-all duration-700" style={{ width: `${(project.overdue_tasks / project.total_tasks) * 100}%` }} />
              </>
            )}
          </div>
        </div>

        {/* schedule */}
        {(project.start_date || project.target_date) && (
          <div className="mt-3.5">
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span className="flex items-center gap-1"><CalendarDays className="size-3.5" /> {formatDate(project.start_date) || "Start"} → {formatDate(project.target_date) || "Target"}</span>
              {due && <span className={cn("font-medium", due.overdue ? "text-coral" : due.soon ? "text-amber" : "text-faint")}>{due.overdue ? "Target passed" : due.text}</span>}
            </div>
            {elapsed !== null && (
              <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-raised">
                <div className="h-full rounded-full bg-faint/50" style={{ width: `${elapsed}%` }} />
                <div className={cn("absolute inset-y-0 left-0 rounded-full", done >= elapsed - 10 ? "bg-mint" : "bg-amber")} style={{ width: `${done}%`, opacity: 0.9 }} />
              </div>
            )}
          </div>
        )}

        {/* effort */}
        {(project.estimated_minutes > 0 || project.actual_minutes > 0) && (
          <div className="mt-3.5">
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span className="flex items-center gap-1"><Clock3 className="size-3.5" /> Effort</span>
              <span className="tabular-nums">{hoursLabel(project.actual_minutes)} / {hoursLabel(project.estimated_minutes)} est.</span>
            </div>
            <div className="mt-1.5 space-y-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-raised"><div className="h-full rounded-full bg-sky" style={{ width: `${(project.estimated_minutes / effortMax) * 100}%` }} /></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-raised"><div className={cn("h-full rounded-full", project.actual_minutes > project.estimated_minutes && project.estimated_minutes > 0 ? "bg-amber" : "bg-accent-grad")} style={{ width: `${(project.actual_minutes / effortMax) * 100}%` }} /></div>
            </div>
          </div>
        )}

        {project.technologies.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1 pt-4">
            {project.technologies.slice(0, 4).map((tech) => (
              <span key={tech} className="rounded-full border border-line/60 bg-surface-2 px-2 py-0.5 text-[10px] text-muted">{tech}</span>
            ))}
            {project.technologies.length > 4 && <span className="px-1 py-0.5 text-[10px] text-faint">+{project.technologies.length - 4}</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
