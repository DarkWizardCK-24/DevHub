"use client";

import Link from "next/link";
import {
  CheckCircle2,
  CodeXml,
  FileText,
  FolderKanban,
  History,
  KeyRound,
  Link2,
  ListChecks,
  Package,
  Paperclip,
  UserCog,
  Users,
} from "lucide-react";
import useSWRInfinite from "swr/infinite";
import { TimelineIllustration } from "@/components/illustrations";
import { PageHeader } from "@/components/shell/page-header";
import { ProjectBadge } from "@/components/shared/project-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { api } from "@/lib/api/client";
import { formatTime, istDayLabel } from "@/lib/format";
import type { ActivityItem, ActivityPage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { activityHref, describeActivity } from "./describe";

const ICONS: Record<string, { icon: typeof History; tone: string }> = {
  project: { icon: FolderKanban, tone: "bg-iris-soft text-iris" },
  task: { icon: ListChecks, tone: "bg-accent-soft text-accent" },
  note: { icon: FileText, tone: "bg-sky-soft text-sky" },
  snippet: { icon: CodeXml, tone: "bg-mint-soft text-mint" },
  file: { icon: Paperclip, tone: "bg-sky-soft text-sky" },
  link: { icon: Link2, tone: "bg-raised text-ink" },
  credential: { icon: KeyRound, tone: "bg-coral-soft text-coral" },
  build: { icon: Package, tone: "bg-accent-soft text-accent" },
  user: { icon: UserCog, tone: "bg-iris-soft text-iris" },
  member: { icon: Users, tone: "bg-iris-soft text-iris" },
  tag: { icon: History, tone: "bg-raised text-muted" },
};

export function ActivityEntry({ item, showProject = true }: { item: ActivityItem; showProject?: boolean }) {
  const isCompletion = item.action === "task.completed" || item.action === "build.completed";
  const { icon: Icon, tone } = isCompletion ? { icon: CheckCircle2, tone: "bg-mint-soft text-mint" } : (ICONS[item.entity_type] ?? { icon: History, tone: "bg-raised text-muted" });
  const href = activityHref(item);
  const text = describeActivity(item);
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", tone)}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        {href ? (
          <Link href={href} className="text-sm hover:text-accent">{text}</Link>
        ) : (
          <p className="text-sm">{text}</p>
        )}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-faint">
          <time dateTime={item.created_at}>{formatTime(item.created_at)}</time>
          {item.actor_name && <span>{item.actor_name}</span>}
          {showProject && <ProjectBadge project={item.project} asLink={false} />}
        </div>
      </div>
    </li>
  );
}

/** Timeline with "Load older" (cursor pagination via before_id). */
export function ActivityTimeline({ projectId }: { projectId?: string }) {
  const embedded = Boolean(projectId);
  const { data, error, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite<ActivityPage>(
    (index, previous: ActivityPage | null) => {
      if (previous && previous.next_before_id === null) return null;
      return ["/activity", projectId ?? "", previous?.next_before_id ?? ""];
    },
    ([path, project, before]: [string, string, number | ""]) =>
      api.get<ActivityPage>(path, { project_id: project || undefined, before_id: before || undefined, limit: 40 }),
  );

  const items = data?.flatMap((page) => page.items) ?? [];
  const hasMore = data ? data[data.length - 1]?.next_before_id !== null : false;

  // Group consecutive entries by local day.
  const groups: { label: string; items: ActivityItem[] }[] = [];
  for (const item of items) {
    const label = istDayLabel(item.created_at);
    const last = groups.at(-1);
    if (last?.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }

  return (
    <>
      {!embedded && <PageHeader title="Activity" description="A timeline of what changed across your workspace." />}
      {isLoading && !data ? (
        <Card><ListSkeleton rows={8} /></Card>
      ) : error ? (
        <Card><ErrorState title="Activity didn't load" message={error.message} onRetry={() => mutate()} /></Card>
      ) : items.length === 0 ? (
        <Card><EmptyState illustration={<TimelineIllustration />} title="Nothing here yet" description="Creating projects, completing tasks and recording builds adds entries to this timeline." /></Card>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.label}>
              <h2 className="mb-2 px-1 font-sans text-sm font-semibold tracking-normal text-muted">{group.label}</h2>
              <Card className="px-4">
                <ol className="divide-y divide-line">
                  {group.items.map((item) => <ActivityEntry key={item.id} item={item} showProject={!embedded} />)}
                </ol>
              </Card>
            </section>
          ))}
          {hasMore && (
            <div className="flex justify-center">
              <Button variant="secondary" loading={isValidating && size > (data?.length ?? 0)} onClick={() => setSize(size + 1)}>
                Load older activity
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
