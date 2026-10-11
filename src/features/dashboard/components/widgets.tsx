"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, CodeXml, FileText, FolderKanban, History, KeyRound, Link2, Package, Sparkles } from "lucide-react";
import { BoardIllustration, FolderIllustration, RocketIllustration, TimelineIllustration } from "@/components/illustrations";
import { ProjectBadge } from "@/components/shared/project-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ActivityEntry } from "@/features/activity/activity-timeline";
import { DueBadge, TaskCheckbox } from "@/features/tasks/task-row";
import { BUILD_STATUS, PLATFORM, PRIORITY } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import type { ActivityItem, Build, Project, Task } from "@/lib/types";

const ViewAll = ({ href }: { href: string }) => (
  <Link href={href} className="group inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-accent">
    View all <ArrowRight className="size-3 transition-transform duration-150 group-hover:translate-x-0.5" />
  </Link>
);

export function DueTasksWidget({ tasks, onToggle }: { tasks: Task[]; onToggle: (task: Task) => void }) {
  return (
    <Card>
      <CardHeader title="Due soon" icon={<CalendarClock />} action={<ViewAll href="/tasks" />} />
      {tasks.length === 0 ? (
        <EmptyState className="py-7" illustration={<BoardIllustration />} title="Nothing due" description="Tasks due in the next 7 days, and anything overdue, show up here." />
      ) : (
        <ul className="divide-y divide-line/60 px-2 pb-2">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-2/60">
              <TaskCheckbox task={task} onToggle={() => onToggle(task)} />
              <Link href={`/tasks?task=${task.id}`} className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-ink transition-colors hover:text-accent">{task.title}</p>
                <div className="mt-0.5">
                  <ProjectBadge project={task.project} asLink={false} />
                </div>
              </Link>
              {task.priority !== "medium" && <Badge tone={PRIORITY[task.priority].tone}>{PRIORITY[task.priority].label}</Badge>}
              {task.due_date && <DueBadge date={task.due_date} />}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function ProjectsWidget({ projects }: { projects: Project[] }) {
  return (
    <Card>
      <CardHeader title="Active projects" icon={<FolderKanban />} action={<ViewAll href="/projects" />} />
      {projects.length === 0 ? (
        <EmptyState className="py-7" illustration={<FolderIllustration />} title="No active projects" description="Create a project to group its tasks, notes, links and builds." />
      ) : (
        <ul className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="group flex items-center gap-3 rounded-xl border border-line/70 bg-surface-2/40 p-3 transition-all duration-200 hover:border-line-strong hover:bg-surface-2 hover:shadow-xs"
              >
                <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: project.color }} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold tracking-tight text-ink group-hover:text-accent transition-colors">{project.name}</p>
                  <p className="text-xs text-muted">{project.open_tasks} open tasks</p>
                </div>
                <ProgressRing value={project.progress} size={38} stroke={3.5} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function BuildsWidget({ builds }: { builds: Build[] }) {
  return (
    <Card>
      <CardHeader title="Latest builds" icon={<Package />} action={<ViewAll href="/builds" />} />
      {builds.length === 0 ? (
        <EmptyState className="py-7" illustration={<RocketIllustration />} title="No builds recorded" description="Log a build to track versions, commits and release notes." />
      ) : (
        <ul className="divide-y divide-line/60 px-4 pb-2">
          {builds.map((build) => (
            <li key={build.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">{build.project.name}</p>
                <p className="font-mono text-xs text-faint">
                  {PLATFORM[build.platform]} v{build.version}
                  {build.build_number !== null && ` (${build.build_number})`} · {timeAgo(build.created_at)}
                </p>
              </div>
              <Badge tone={BUILD_STATUS[build.status].tone} dot>{BUILD_STATUS[build.status].label}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function ActivityWidget({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader title="Recent activity" icon={<History />} action={<ViewAll href="/activity" />} />
      {items.length === 0 ? (
        <EmptyState className="py-7" illustration={<TimelineIllustration />} title="A quiet timeline" description="Creating projects, finishing tasks and logging builds adds entries here." />
      ) : (
        <ol className="divide-y divide-line/60 px-4 pb-2">
          {items.map((item) => <ActivityEntry key={item.id} item={item} />)}
        </ol>
      )}
    </Card>
  );
}

export function QuickToolsWidget() {
  const tools = [
    { label: "Code Snippets", desc: "Reusable algorithms & patterns", href: "/snippets", icon: CodeXml, color: "text-mint bg-mint-soft border-mint/20" },
    { label: "Secrets Vault", desc: "Encrypted API keys & credentials", href: "/vault", icon: KeyRound, color: "text-coral bg-coral-soft border-coral/20" },
    { label: "Bookmarks & Links", desc: "Important repos & docs", href: "/links", icon: Link2, color: "text-sky bg-sky-soft border-sky/20" },
    { label: "Architecture Notes", desc: "Markdown specifications", href: "/notes", icon: FileText, color: "text-iris bg-iris-soft border-iris/20" },
  ];

  return (
    <Card>
      <CardHeader title="Workspace Tools" icon={<Sparkles />} />
      <div className="grid grid-cols-2 gap-2 p-3 pt-0">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.label}
              href={tool.href}
              className="group flex flex-col gap-1 rounded-xl border border-line/60 bg-surface-2/40 p-2.5 transition-all duration-200 hover:border-line-strong hover:bg-surface-2"
            >
              <div className="flex items-center gap-2">
                <span className={`grid size-6 place-items-center rounded-md border text-xs ${tool.color}`}>
                  <Icon className="size-3.5" />
                </span>
                <span className="truncate text-xs font-semibold tracking-tight text-ink group-hover:text-accent transition-colors">{tool.label}</span>
              </div>
              <span className="line-clamp-1 text-[11px] text-muted">{tool.desc}</span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
