"use client";

import { Activity, CalendarClock, Flag, Gauge, Hourglass, Timer, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { TASK_STATUS, TASK_STATUS_ORDER } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Pulse, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { HEALTH, hoursLabel } from "../health";

const STATUS_FILL: Record<TaskStatus, string> = {
  backlog: "bg-faint/60",
  todo: "bg-sky",
  in_progress: "bg-accent",
  review: "bg-iris",
  done: "bg-mint",
};

function Kpi({ icon, label, value, hint, tone = "text-ink" }: { icon: ReactNode; label: string; value: ReactNode; hint?: ReactNode; tone?: string }) {
  return (
    <div className="rounded-2xl border border-line/60 bg-surface-2/50 p-4">
      <div className="flex items-center gap-2 text-xs text-muted [&>svg]:size-3.5">
        {icon}
        {label}
      </div>
      <p className={cn("mt-2 text-2xl leading-none font-medium tracking-[-0.04em] tabular-nums", tone)}>{value}</p>
      {hint && <p className="mt-1.5 text-[11px] text-faint">{hint}</p>}
    </div>
  );
}

/** Planned window with a "today" marker, and delivery progress beneath it. */
function ScheduleBar({ pulse }: { pulse: Pulse }) {
  const { schedule, tasks } = pulse;
  if (!schedule.target_date) {
    return <p className="text-sm text-muted">Set a start and target date on the project to see the schedule here.</p>;
  }
  const elapsed = schedule.elapsed_pct ?? 0;
  const done = tasks.completion_pct;
  const behind = schedule.elapsed_pct !== null && elapsed - done > 10;
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{schedule.start_date ? formatDate(schedule.start_date, { month: "short", day: "numeric", year: "numeric" }) : "No start"}</span>
        <span>{formatDate(schedule.target_date, { month: "short", day: "numeric", year: "numeric" })}</span>
      </div>

      <div className="relative mt-3">
        <div className="h-3 overflow-hidden rounded-full bg-raised">
          <div className="h-full rounded-full bg-gradient-to-r from-line-strong to-faint/50 transition-all duration-700" style={{ width: `${elapsed}%` }} />
        </div>
        <span className="absolute -top-1.5 h-6 w-0.5 rounded bg-ink" style={{ left: `calc(${elapsed}% - 1px)` }} aria-hidden />
        <span className="absolute top-5 -translate-x-1/2 text-[10px] font-medium text-ink" style={{ left: `${Math.min(Math.max(elapsed, 5), 95)}%` }}>
          Today
        </span>
      </div>

      <div className="mt-9 flex items-center justify-between text-xs">
        <span className="text-muted">Delivered</span>
        <span className={cn("font-medium tabular-nums", behind ? "text-amber" : "text-mint")}>
          {done}% done vs {elapsed}% of time used
        </span>
      </div>
      <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-raised">
        <div className={cn("h-full rounded-full transition-all duration-700", behind ? "bg-amber" : "bg-accent-grad")} style={{ width: `${done}%` }} />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        {[
          { label: "Days elapsed", value: schedule.elapsed_days ?? "n/a" },
          { label: "Days left", value: schedule.days_left === null ? "n/a" : schedule.days_left },
          { label: "Planned", value: schedule.total_days ? `${schedule.total_days}d` : "n/a" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-surface-2/60 py-2.5">
            <p className="text-xl font-medium tabular-nums">{item.value}</p>
            <p className="text-[11px] text-faint">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Estimated vs logged vs remaining vs forecast, on one shared scale. */
function EffortBars({ pulse }: { pulse: Pulse }) {
  const e = pulse.effort;
  const max = Math.max(e.estimated_minutes, e.actual_minutes, e.forecast_minutes, 1);
  const rows: { label: string; value: number; bar: string; note?: string }[] = [
    { label: "Estimated", value: e.estimated_minutes, bar: "bg-sky", note: "planned across all tasks" },
    { label: "Actual so far", value: e.actual_minutes, bar: "bg-accent-grad", note: "time logged on tasks" },
    { label: "Remaining", value: e.remaining_minutes, bar: "bg-iris", note: "estimate left on open tasks" },
    { label: "Forecast total", value: e.forecast_minutes, bar: e.variance_minutes > 0 ? "bg-amber" : "bg-mint", note: "actual + adjusted remaining" },
  ];
  return (
    <div className="space-y-3.5">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-medium text-ink">{row.label}</span>
            <span className="tabular-nums text-muted">{hoursLabel(row.value)}</span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-raised">
            <div className={cn("h-full rounded-full transition-all duration-700", row.bar)} style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-faint">{row.note}</p>
        </div>
      ))}
      {e.estimated_minutes > 0 && (
        <p className={cn("rounded-xl px-3 py-2 text-xs", e.variance_minutes > 0 ? "bg-amber-soft text-amber" : "bg-mint-soft text-mint")}>
          {e.variance_minutes === 0
            ? "Forecast matches the estimate."
            : `Forecast is ${hoursLabel(Math.abs(e.variance_minutes))} ${e.variance_minutes > 0 ? "over" : "under"} the estimate`}
          {e.accuracy_ratio ? ` · finished tasks took ${e.accuracy_ratio}× their estimates.` : "."}
        </p>
      )}
    </div>
  );
}

/** Eight weeks of work created vs completed, with the open backlog as a line. */
function FlowChart({ pulse }: { pulse: Pulse }) {
  const weeks = pulse.weeks;
  const W = 480;
  const H = 150;
  const pad = { l: 22, r: 8, t: 10, b: 22 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const peak = Math.max(1, ...weeks.flatMap((w) => [w.created, w.completed]));
  const maxBacklog = Math.max(1, ...weeks.map((w) => w.scope_total - w.done_total));
  const slot = innerW / weeks.length;
  const barW = Math.min(14, slot / 3);
  const x = (i: number) => pad.l + slot * i + slot / 2;
  const line = weeks.map((w, i) => `${x(i)},${pad.t + innerH - ((w.scope_total - w.done_total) / maxBacklog) * innerH}`).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Tasks created and completed per week">
        {[0, 0.5, 1].map((f) => (
          <line key={f} x1={pad.l} x2={W - pad.r} y1={pad.t + innerH * f} y2={pad.t + innerH * f} className="stroke-line" strokeDasharray={f === 1 ? undefined : "3 4"} />
        ))}
        <text x={0} y={pad.t + 4} className="fill-faint text-[9px]">{peak}</text>
        <text x={0} y={pad.t + innerH + 3} className="fill-faint text-[9px]">0</text>
        {weeks.map((w, i) => {
          const hc = (w.created / peak) * innerH;
          const hd = (w.completed / peak) * innerH;
          return (
            <g key={w.week_start}>
              <rect x={x(i) - barW - 1} y={pad.t + innerH - hc} width={barW} height={hc} rx={3} className="fill-sky/70" />
              <rect x={x(i) + 1} y={pad.t + innerH - hd} width={barW} height={hd} rx={3} className="fill-mint" />
              <text x={x(i)} y={H - 6} textAnchor="middle" className="fill-faint text-[9px]">
                {formatDate(w.week_start, { month: "short", day: "numeric" })}
              </text>
            </g>
          );
        })}
        <polyline points={line} fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="stroke-accent" />
        {weeks.map((w, i) => (
          <circle key={w.week_start} cx={x(i)} cy={pad.t + innerH - ((w.scope_total - w.done_total) / maxBacklog) * innerH} r={2.5} className="fill-surface stroke-accent" strokeWidth={1.5} />
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-sky/70" /> Created</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-mint" /> Completed</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded bg-accent" /> Open backlog</span>
      </div>
    </div>
  );
}

function StatusStack({ pulse }: { pulse: Pulse }) {
  const total = Math.max(pulse.tasks.total, 1);
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-raised">
        {TASK_STATUS_ORDER.map((s) => {
          const n = pulse.tasks.by_status[s] ?? 0;
          return n ? <div key={s} className={cn("h-full transition-all duration-700", STATUS_FILL[s])} style={{ width: `${(n / total) * 100}%` }} title={`${TASK_STATUS[s].label}: ${n}`} /> : null;
        })}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-5">
        {TASK_STATUS_ORDER.map((s) => (
          <li key={s} className="flex items-center gap-1.5 text-muted">
            <span className={cn("size-2 rounded-full", STATUS_FILL[s])} />
            {TASK_STATUS[s].label}
            <span className="ml-auto tabular-nums text-ink">{pulse.tasks.by_status[s] ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProjectPulse({ projectId }: { projectId: string }) {
  const { data: pulse, error, isLoading, mutate } = useApi<Pulse>(`/projects/${projectId}/pulse`);

  if (isLoading && !pulse) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 w-full rounded-[var(--radius-card)]" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-60 rounded-[var(--radius-card)]" />
          <Skeleton className="h-60 rounded-[var(--radius-card)]" />
        </div>
      </div>
    );
  }
  if (error || !pulse) {
    return <Card><ErrorState title="Pulse didn't load" message={error?.message} onRetry={() => mutate()} /></Card>;
  }

  const h = HEALTH[pulse.health];
  const { schedule, tasks, effort, velocity } = pulse;

  return (
    <div className="space-y-5">
      <Card className="relative overflow-hidden p-5 md:p-6">
        <div aria-hidden className={cn("absolute inset-x-0 top-0 h-1", h.bar)} />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-5 lg:w-80">
            <ProgressRing value={tasks.completion_pct} size={92} stroke={7} />
            <div>
              <p className="flex items-center gap-2 text-xs font-medium tracking-[0.12em] text-faint uppercase">
                <Activity className="size-3.5" /> Project pulse
              </p>
              <Badge tone={h.tone} dot className="mt-2">{h.label}</Badge>
              <p className="mt-2 text-xs text-muted">{tasks.done} of {tasks.total} tasks done</p>
            </div>
          </div>
          <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
            {pulse.health_reasons.map((reason) => (
              <li key={reason} className="flex items-start gap-2 text-muted">
                <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", h.bar)} />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            icon={<CalendarClock />}
            label="Time left"
            value={schedule.days_left === null ? "n/a" : schedule.days_left < 0 ? `${-schedule.days_left}d over` : `${schedule.days_left}d`}
            tone={schedule.days_left !== null && schedule.days_left < 0 && tasks.open > 0 ? "text-coral" : undefined}
            hint={schedule.total_days ? `of ${schedule.total_days} days planned` : "no target date"}
          />
          <Kpi icon={<Timer />} label="Effort (est. → actual)" value={`${hoursLabel(effort.estimated_minutes)} → ${hoursLabel(effort.actual_minutes)}`} hint={`${hoursLabel(effort.remaining_minutes)} remaining on open tasks`} />
          <Kpi icon={<TrendingUp />} label="Velocity" value={`${velocity.per_week}/wk`} hint={`${velocity.done_last_14d} done in the last 14 days`} />
          <Kpi
            icon={<Flag />}
            label="Projected finish"
            value={velocity.projected_finish ? formatDate(velocity.projected_finish, { month: "short", day: "numeric" }) : tasks.open === 0 && tasks.total > 0 ? "Done" : "n/a"}
            tone={velocity.projected_finish && schedule.target_date && velocity.projected_finish > schedule.target_date ? "text-amber" : undefined}
            hint={schedule.target_date ? `target ${formatDate(schedule.target_date, { month: "short", day: "numeric" })}` : "at the current pace"}
          />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Schedule" icon={<Gauge />} />
          <div className="px-5 pt-3 pb-5"><ScheduleBar pulse={pulse} /></div>
        </Card>
        <Card>
          <CardHeader title="Effort: estimated vs actual" icon={<Hourglass />} />
          <div className="px-5 pb-5"><EffortBars pulse={pulse} /></div>
        </Card>
        <Card>
          <CardHeader title="Weekly flow" icon={<TrendingUp />} />
          <div className="px-5 pb-5"><FlowChart pulse={pulse} /></div>
        </Card>
        <Card>
          <CardHeader title="Task breakdown" icon={<Activity />} />
          <div className="space-y-4 px-5 pb-5">
            <StatusStack pulse={pulse} />
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Overdue", value: tasks.overdue, tone: tasks.overdue ? "text-coral" : "text-ink" },
                { label: "Due this week", value: tasks.due_this_week, tone: "text-ink" },
                { label: "No estimate", value: tasks.unestimated, tone: tasks.unestimated ? "text-amber" : "text-ink" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-surface-2/60 py-2.5">
                  <p className={cn("text-xl font-medium tabular-nums", item.tone)}>{item.value}</p>
                  <p className="text-[11px] text-faint">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
