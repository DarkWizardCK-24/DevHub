"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckSquare,
  ExternalLink,
  FileText,
  FolderOpen,
  GitBranch,
  History,
  KeyRound,
  LayoutDashboard,
  Link2,
  Package,
  Pencil,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ActivityEntry, ActivityTimeline } from "@/features/activity/activity-timeline";
import { BuildsView } from "@/features/builds/builds-view";
import { FilesView } from "@/features/files/files-view";
import { LinksView } from "@/features/links/links-view";
import { NotesView } from "@/features/notes/notes-view";
import { TaskTimeline, type TimelineMarker } from "@/features/tasks/task-timeline";
import { TasksView } from "@/features/tasks/tasks-view";
import { VaultHub } from "@/features/vault/vault-hub";
import { ProjectTeam, TeamAvatars } from "./team/project-team";
import { DonutChart } from "@/components/ui/donut-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { refresh, useApi } from "@/hooks/use-api";
import { useConfirm } from "@/hooks/use-confirm";
import { api } from "@/lib/api/client";
import { PRIORITY, PROJECT_STATUS, TASK_STATUS, TASK_STATUS_ORDER } from "@/lib/constants";
import { dueLabel, formatDate } from "@/lib/format";
import type { ActivityPage, Page, ProjectDetail as Detail, ProjectMember, Pulse, Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { cardHealth, HEALTH, hoursLabel } from "./health";
import { ProjectForm } from "./project-form";
import { PROJECT_TABS as TABS, type ProjectTab } from "./project-tabs";
import { ProjectPulse } from "./pulse/project-pulse";

const STATUS_COLOR = { backlog: "var(--faint)", todo: "var(--sky)", in_progress: "var(--accent)", review: "var(--iris)", done: "var(--mint)" } as const;
const PRIORITY_COLOR = { urgent: "var(--coral)", high: "var(--amber)", medium: "var(--sky)", low: "var(--faint)" } as const;

const TAB_META: Record<ProjectTab, { label: string; icon: LucideIcon; count?: (p: Detail) => number | undefined }> = {
  overview: { label: "Overview", icon: LayoutDashboard },
  team: { label: "Team", icon: Users, count: (p) => p.counts.members },
  tasks: { label: "Tasks", icon: CheckSquare, count: (p) => p.counts.open_tasks },
  notes: { label: "Notes", icon: FileText, count: (p) => p.counts.notes },
  files: { label: "Files", icon: FolderOpen, count: (p) => p.counts.files },
  links: { label: "Links", icon: Link2, count: (p) => p.counts.links },
  vault: { label: "Vaults", icon: KeyRound, count: (p) => p.counts.credentials },
  builds: { label: "Builds", icon: Package, count: (p) => p.counts.builds },
  activity: { label: "Activity", icon: History },
};

function Overview({ project, onTab }: { project: Detail; onTab: (tab: ProjectTab) => void }) {
  const { data: activity } = useApi<ActivityPage>("/activity", { project_id: project.id, limit: 8 });
  const { data: tasks } = useApi<Page<Task>>("/tasks", { project_id: project.id, limit: 500 });
  const { data: pulse } = useApi<Pulse>(`/projects/${project.id}/pulse`);

  const markers: TimelineMarker[] = (pulse?.builds ?? []).map((b) => ({
    date: b.at,
    label: `v${b.version} (${b.platform}): ${b.status}`,
    tone: b.status === "failed" ? "coral" : b.status === "successful" ? "mint" : "accent",
  }));

  const { data: members } = useApi<ProjectMember[]>(`/projects/${project.id}/members`);
  const allTasks = tasks?.items ?? [];
  const byStatus = TASK_STATUS_ORDER.map((status) => ({
    label: TASK_STATUS[status].label,
    value: allTasks.filter((t) => t.status === status).length,
    color: STATUS_COLOR[status],
    href: `/projects/${project.id}?tab=tasks`,
  }));
  const priorities = (["urgent", "high", "medium", "low"] as const).map((priority) => ({
    label: PRIORITY[priority].label,
    value: allTasks.filter((t) => t.priority === priority && t.status !== "done").length,
    color: PRIORITY_COLOR[priority],
  }));
  const donePct = allTasks.length ? Math.round((allTasks.filter((t) => t.status === "done").length / allTasks.length) * 100) : project.progress;

  const tiles: { tab: ProjectTab; value: number; detail?: string }[] = [
    { tab: "tasks", value: project.counts.tasks, detail: `${project.counts.open_tasks} open` },
    { tab: "notes", value: project.counts.notes },
    { tab: "files", value: project.counts.files },
    { tab: "links", value: project.counts.links },
    { tab: "vault", value: project.counts.credentials },
    { tab: "team", value: project.counts.members },
    { tab: "builds", value: project.counts.builds },
  ];

  return (
    <div className="space-y-5">
      <ProjectPulse projectId={project.id} />

      <section aria-label="Task timeline">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-medium tracking-[-0.02em]">Timeline</h2>
          <button type="button" onClick={() => onTab("tasks")} className="text-[13px] font-medium text-muted hover:text-accent">Manage tasks</button>
        </div>
        <TaskTimeline tasks={tasks?.items ?? []} onOpen={() => onTab("tasks")} rangeStart={project.start_date} rangeEnd={project.target_date} markers={markers} />
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Task completion" icon={<CheckSquare />} action={<button type="button" onClick={() => onTab("tasks")} className="text-[13px] font-medium text-muted hover:text-accent">Open tasks</button>} />
          <div className="px-5 pb-5">
            <DonutChart segments={byStatus} centerValue={`${donePct}%`} centerLabel="done" emptyLabel="No tasks" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Open work by priority" icon={<CalendarDays />} />
          <div className="px-5 pb-5">
            <DonutChart segments={priorities} centerLabel="open" emptyLabel="All clear" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Who's working on it" icon={<Users />} action={<button type="button" onClick={() => onTab("team")} className="text-[13px] font-medium text-muted hover:text-accent">Team</button>} />
          <div className="space-y-3 px-5 pb-5">
            {members?.length ? (
              <>
                <TeamAvatars members={members} max={6} />
                <ul className="space-y-1.5 text-sm">
                  {members.slice(0, 4).map((m) => (
                    <li key={m.user_id} className="flex items-center justify-between gap-2">
                      <span className="truncate">{m.full_name || m.email}</span>
                      <span className="shrink-0 text-xs text-faint capitalize">{m.role}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-muted">No one assigned yet.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid grid-cols-2 content-start gap-3 sm:grid-cols-4 lg:grid-cols-3">
          {tiles.map((tile) => {
            const meta = TAB_META[tile.tab];
            const Icon = meta.icon;
            return (
              <button
                key={tile.tab}
                type="button"
                onClick={() => onTab(tile.tab)}
                className="group rounded-2xl border border-line/70 bg-surface p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop"
              >
                <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent transition-transform group-hover:scale-110"><Icon className="size-4" /></span>
                <p className="mt-3 text-2xl leading-none font-medium tracking-[-0.04em] tabular-nums">{tile.value}</p>
                <p className="mt-1.5 text-xs text-muted">{tile.tab === "vault" ? "Credentials" : meta.label}{tile.detail ? ` · ${tile.detail}` : ""}</p>
              </button>
            );
          })}
        </div>
        <Card>
          <CardHeader title="Recent activity" action={<button type="button" onClick={() => onTab("activity")} className="text-[13px] font-medium text-muted hover:text-accent">View all</button>} />
          <ol className="divide-y divide-line px-5 pb-3">
            {activity?.items.length ? activity.items.map((item) => <ActivityEntry key={item.id} item={item} showProject={false} />) : <p className="py-4 text-sm text-muted">No activity yet.</p>}
          </ol>
        </Card>
      </div>
    </div>
  );
}

export function ProjectDetailView({ projectId, initialTab = "overview" }: { projectId: string; initialTab?: ProjectTab }) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTabState] = useState<ProjectTab>(initialTab);
  const [editing, setEditing] = useState(false);
  const [confirm, confirmDialog] = useConfirm();
  const { data: project, error, isLoading, mutate } = useApi<Detail>(`/projects/${projectId}`);

  const setTab = (next: ProjectTab) => {
    setTabState(next);
    router.replace(next === "overview" ? pathname : `${pathname}?tab=${next}`, { scroll: false });
  };

  if (isLoading && !project) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-56 w-full rounded-[var(--radius-card)]" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  if (error || !project) {
    return (
      <Card>
        <ErrorState title={error?.message === "Project not found." ? "Project not found" : "Project didn't load"} message={error?.message} onRetry={() => mutate()} />
      </Card>
    );
  }

  const canEdit = project.role !== "viewer";
  const due = project.target_date && project.status !== "completed" ? dueLabel(project.target_date) : null;
  const health = HEALTH[cardHealth(project)];
  const donePct = project.total_tasks ? Math.round((project.done_tasks / project.total_tasks) * 100) : project.progress;

  return (
    <>
      <Link href="/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Projects
      </Link>

      <Card className="relative mb-6 overflow-hidden">
        <div
          aria-hidden
          className="relative h-28 overflow-hidden md:h-32"
          style={{ background: `linear-gradient(120deg, ${project.color}, color-mix(in srgb, ${project.color} 40%, #8a5cf6))` }}
        >
          <div className="absolute -top-16 right-10 size-64 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:16px_16px]" />
        </div>

        <div className="px-5 pb-5 md:px-7 md:pb-6">
          <div className="relative z-10 -mt-9 flex items-end justify-between gap-4">
            <div className="grid size-[72px] place-items-center rounded-3xl border-[5px] border-surface text-3xl font-medium text-white shadow-pop" style={{ backgroundColor: project.color }}>
              {project.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex gap-2 pb-1">
              {canEdit && (
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="size-3.5" /> Edit
                </Button>
              )}
              {project.role === "owner" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-coral"
                  onClick={() =>
                    confirm({
                      title: `Delete ${project.name}?`,
                      description: `This permanently deletes the project with its ${project.counts.tasks} tasks, ${project.counts.notes} notes, ${project.counts.files} files, ${project.counts.links} links, ${project.counts.credentials} credentials and ${project.counts.builds} builds. Snippets are kept.`,
                      confirmLabel: "Delete project",
                      successMessage: "Project deleted",
                      action: async () => {
                        await api.delete(`/projects/${project.id}`);
                        await refresh("/projects", "/dashboard", "/tasks");
                        router.replace("/projects");
                      },
                    })
                  }
                >
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={health.tone} dot>{health.label}</Badge>
                <Badge tone={PROJECT_STATUS[project.status].tone}>{PROJECT_STATUS[project.status].label}</Badge>
                <Badge tone={PRIORITY[project.priority].tone}>{PRIORITY[project.priority].label} priority</Badge>
                {project.category && <span className="text-sm text-muted">{project.category}</span>}
              </div>
              <h1 className="mt-2.5 text-[30px] leading-tight font-medium tracking-[-0.04em] md:text-[38px]">{project.name}</h1>
              {project.description && <p className="mt-2 max-w-prose whitespace-pre-line text-[15px] leading-relaxed text-muted">{project.description}</p>}
              {project.technologies.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {project.technologies.map((tech) => <span key={tech} className="rounded-full border border-line/60 bg-surface-2 px-2.5 py-0.5 text-xs text-muted">{tech}</span>)}
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                {project.github_url && (
                  <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted hover:text-accent">
                    <GitBranch className="size-4" /> Repository
                  </a>
                )}
                {project.live_url && (
                  <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted hover:text-accent">
                    <ExternalLink className="size-4" /> Live site
                  </a>
                )}
                {(project.start_date || project.target_date) && (
                  <span className={cn("flex items-center gap-1.5", due?.overdue ? "text-coral" : "text-muted")}>
                    <CalendarDays className="size-4" />
                    {formatDate(project.start_date, { dateStyle: "medium" }) || "No start"} → {formatDate(project.target_date, { dateStyle: "medium" }) || "No target"}
                    {due && <span className="text-faint">({due.text})</span>}
                  </span>
                )}
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-[auto_1fr] items-center gap-x-5 rounded-2xl border border-line/60 bg-surface-2/50 p-4 lg:min-w-72">
              <ProgressRing value={donePct} size={76} stroke={6} />
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-6"><dt className="text-muted">Tasks done</dt><dd className="tabular-nums">{project.done_tasks}/{project.total_tasks}</dd></div>
                <div className="flex justify-between gap-6"><dt className="text-muted">Overdue</dt><dd className={cn("tabular-nums", project.overdue_tasks && "text-coral")}>{project.overdue_tasks}</dd></div>
                <div className="flex justify-between gap-6"><dt className="text-muted">Est. → actual</dt><dd className="tabular-nums">{hoursLabel(project.estimated_minutes)} → {hoursLabel(project.actual_minutes)}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </Card>

      <nav role="tablist" aria-label="Project sections" className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-line px-4 scrollbar-none md:mx-0 md:px-0">
        {TABS.map((t) => {
          const meta = TAB_META[t];
          const Icon = meta.icon;
          const count = meta.count?.(project);
          return (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn("relative flex shrink-0 items-center gap-1.5 px-3.5 pt-1 pb-3 text-sm font-normal transition-colors", tab === t ? "text-accent" : "text-muted hover:text-ink")}
            >
              <Icon className="size-4" />
              {meta.label}
              {count ? <span className={cn("rounded-full px-1.5 text-[10px] tabular-nums", tab === t ? "bg-accent-soft text-accent" : "bg-raised text-faint")}>{count}</span> : null}
              {tab === t && <motion.span layoutId="project-tab" className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-accent-grad" />}
            </button>
          );
        })}
      </nav>

      <div role="tabpanel">
        {tab === "overview" && <Overview project={project} onTab={setTab} />}
        {tab === "team" && <ProjectTeam projectId={project.id} />}
        {tab === "tasks" && <TasksView projectId={project.id} projectDates={{ start: project.start_date, target: project.target_date }} />}
        {tab === "notes" && <NotesView projectId={project.id} />}
        {tab === "files" && <FilesView projectId={project.id} />}
        {tab === "links" && <LinksView projectId={project.id} />}
        {tab === "vault" && <VaultHub projectId={project.id} />}
        {tab === "builds" && <BuildsView projectId={project.id} />}
        {tab === "activity" && <ActivityTimeline projectId={project.id} />}
      </div>

      <ProjectForm open={editing} onClose={() => setEditing(false)} project={project} onSaved={() => mutate()} />
      {confirmDialog}
    </>
  );
}
