"use client";

import Link from "next/link";
import { CheckSquare, FileText, FolderKanban, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useHydrated } from "@/hooks/use-hydrated";
import type { DashboardData } from "@/lib/types";
import { greeting } from "@/lib/utils";
import { CommitRail } from "./commit-rail";

const EMPTY_RAIL = Array(14).fill(0);

export function DashboardHero({ name, data }: { name: string; data?: DashboardData }) {
  const now = useHydrated() ? new Date() : null;
  const rail = data?.activity_rail ?? EMPTY_RAIL;
  const total = rail.reduce((sum, n) => sum + n, 0);

  const stats = [
    {
      label: "Open tasks",
      href: "/tasks",
      value: data?.stats.open_tasks,
      icon: CheckSquare,
      color: "bg-accent-soft text-accent border-accent/20",
    },
    {
      label: "Active projects",
      href: "/projects",
      value: data?.stats.active_projects,
      icon: FolderKanban,
      color: "bg-iris-soft text-iris border-iris/20",
    },
    {
      label: "Builds this week",
      href: "/builds",
      value: data?.stats.builds_this_week,
      icon: Package,
      color: "bg-mint-soft text-mint border-mint/20",
    },
    {
      label: "Documentation",
      href: "/notes",
      value: data?.stats.notes,
      icon: FileText,
      color: "bg-sky-soft text-sky border-sky/20",
    },
  ];

  return (
    <Card className="relative overflow-hidden p-5 md:p-6">
      {/* Subtle modern mesh & grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.25] [background-image:linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_100%)]"
      />
      
      <div className="relative grid gap-6 lg:grid-cols-[1fr_minmax(280px,360px)] lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2/80 px-2.5 py-0.5 text-[11px] font-medium text-muted">
              <span className="size-1.5 rounded-full bg-mint" />
              {now ? now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "Today"}
            </span>
          </div>

          <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em] text-ink md:text-4xl">
            {now ? greeting(now) : "Welcome back"}, <span className="font-normal text-gradient">{name}</span>.
          </h1>
          <p className="mt-2 text-sm font-medium text-muted">
            Here is your developer overview and activity pulse across active projects.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className="flex flex-col gap-1 rounded-2xl border border-line/60 bg-surface-2/60 p-3.5 transition-all hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface-2 hover:shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted">{stat.label}</span>
                    <span className={`grid size-5.5 place-items-center rounded-md border text-[11px] ${stat.color}`}>
                      <Icon className="size-3" />
                    </span>
                  </div>
                  <span className="font-sans text-2xl font-medium tracking-[-0.04em] text-ink tabular-nums">
                    {stat.value ?? "–"}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-line/60 bg-surface-2/50 p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-tight text-ink">14-Day Activity</span>
            <span className="rounded-md border border-accent/20 bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent">
              {total} {total === 1 ? "action" : "actions"}
            </span>
          </div>
          <CommitRail counts={rail} />
        </div>
      </div>
    </Card>
  );
}
