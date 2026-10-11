"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { formatDate, minutesLabel, parseDateOnly } from "@/lib/format";
import type { Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const DAY = 86_400_000;

const BAR: Record<TaskStatus, string> = {
  backlog: "bg-faint/60",
  todo: "bg-sky",
  in_progress: "bg-accent-grad",
  review: "bg-iris",
  done: "bg-mint",
};

export interface TimelineMarker {
  date: string; // YYYY-MM-DD
  label: string;
  tone?: "mint" | "coral" | "accent";
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const asDay = (value: string) => startOfDay(value.length === 10 ? parseDateOnly(value) : new Date(value));

/**
 * Gantt-style timeline. Each task is a bar from the day it was created to its
 * due date (or completion date once done). Overdue open tasks turn red, the
 * "today" line shows where you are, and the project's own start/target dates
 * stretch the axis so slack and overruns are visible at a glance.
 */
export function TaskTimeline({
  tasks,
  onOpen,
  rangeStart,
  rangeEnd,
  markers = [],
  showProject = false,
}: {
  tasks: Task[];
  onOpen?: (task: Task) => void;
  rangeStart?: string | null;
  rangeEnd?: string | null;
  markers?: TimelineMarker[];
  showProject?: boolean;
}) {
  const today = startOfDay(new Date());

  const model = useMemo(() => {
    const rows = tasks
      .map((task) => {
        const start = asDay(task.created_at);
        const finish = task.status === "done" && task.completed_at ? asDay(task.completed_at) : task.due_date ? asDay(task.due_date) : Math.max(start, today);
        const end = Math.max(finish, start);
        const overdue = task.status !== "done" && task.due_date !== null && asDay(task.due_date) < today;
        return { task, start, end, overdue };
      })
      .sort((a, b) => a.start - b.start || a.end - b.end);

    const points = [today, ...rows.flatMap((r) => [r.start, r.end]), ...markers.map((m) => asDay(m.date))];
    if (rangeStart) points.push(asDay(rangeStart));
    if (rangeEnd) points.push(asDay(rangeEnd));
    const min = Math.min(...points) - 2 * DAY;
    const max = Math.max(...points) + 2 * DAY;
    const total = Math.max(max - min, 7 * DAY);

    // Aim for ~8-10 gridlines whatever the span: step by 1, 2, 7, 14, 30... days.
    const spanDays = total / DAY;
    const step = [1, 2, 7, 14, 30, 60, 90].find((n) => spanDays / n <= 10) ?? 120;
    const ticks: number[] = [];
    for (let t = Math.ceil(min / (step * DAY)) * step * DAY; t <= max; t += step * DAY) ticks.push(t);

    return { rows, min, total, ticks };
  }, [tasks, today, rangeStart, rangeEnd, markers]);

  const pct = (t: number) => ((t - model.min) / model.total) * 100;

  if (tasks.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted">
        Add tasks with due dates and they will appear here as a timeline.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          {/* axis */}
          <div className="grid grid-cols-[220px_1fr] border-b border-line bg-surface-2/50">
            <div className="px-4 py-2.5 text-[11px] font-medium tracking-[0.12em] text-faint uppercase">Task</div>
            <div className="relative h-9">
              {model.ticks.map((t) => (
                <span key={t} className="absolute top-0 flex h-full items-center border-l border-line pl-1.5 text-[10px] text-faint" style={{ left: `${pct(t)}%` }}>
                  {formatDate(new Date(t).toISOString(), { month: "short", day: "numeric" })}
                </span>
              ))}
            </div>
          </div>

          {/* rows */}
          <ul className="relative">
            <li aria-hidden className="pointer-events-none absolute inset-y-0 right-0 left-[220px]">
              {model.ticks.map((t) => (
                <span key={t} className="absolute inset-y-0 border-l border-line/60" style={{ left: `${pct(t)}%` }} />
              ))}
              {rangeStart && <span className="absolute inset-y-0 border-l-2 border-dashed border-accent/40" style={{ left: `${pct(asDay(rangeStart))}%` }} />}
              {rangeEnd && <span className="absolute inset-y-0 border-l-2 border-dashed border-coral/40" style={{ left: `${pct(asDay(rangeEnd))}%` }} />}
              <span className="absolute inset-y-0 z-10 border-l-2 border-accent" style={{ left: `${pct(today)}%` }}>
                <span className="absolute -top-px -left-px rounded-br-md bg-accent px-1.5 py-0.5 text-[9px] font-medium text-accent-ink">Today</span>
              </span>
            </li>

            {model.rows.map(({ task, start, end, overdue }) => {
              const left = pct(start);
              const width = Math.max(pct(end) - left, 1.2);
              return (
                <li key={task.id} className="grid grid-cols-[220px_1fr] border-b border-line/60 last:border-0">
                  <button
                    type="button"
                    onClick={() => onOpen?.(task)}
                    className="min-w-0 px-4 py-2 text-left hover:bg-surface-2/60"
                    title={task.title}
                  >
                    <p className={cn("truncate text-[13px]", task.status === "done" && "text-muted line-through decoration-faint")}>{task.title}</p>
                    <p className="truncate text-[11px] text-faint">
                      {showProject && task.project ? `${task.project.name} · ` : ""}
                      {task.estimated_minutes ? `${minutesLabel(task.estimated_minutes)} est.` : "No estimate"}
                      {task.actual_minutes ? ` · ${minutesLabel(task.actual_minutes)} logged` : ""}
                    </p>
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => onOpen?.(task)}
                      aria-label={`${task.title}: ${formatDate(new Date(start).toISOString())} to ${formatDate(new Date(end).toISOString())}`}
                      className={cn(
                        "absolute top-1/2 h-5 -translate-y-1/2 rounded-full shadow-card transition-[filter,transform] hover:brightness-110 active:scale-y-95",
                        overdue ? "bg-coral" : BAR[task.status],
                      )}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      {width > 9 && (
                        <span className="block truncate px-2.5 text-left text-[10px] font-medium text-white/95">
                          {formatDate(new Date(end).toISOString(), { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </button>
                  </div>
                </li>
              );
            })}

            {markers.length > 0 && (
              <li className="grid grid-cols-[220px_1fr] bg-surface-2/40">
                <p className="px-4 py-2 text-[11px] font-medium tracking-[0.12em] text-faint uppercase">Builds</p>
                <div className="relative h-9">
                  {markers.map((m, i) => (
                    <span
                      key={`${m.date}-${i}`}
                      title={`${m.label} · ${formatDate(m.date)}`}
                      className={cn(
                        "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[3px] ring-2 ring-surface",
                        m.tone === "coral" ? "bg-coral" : m.tone === "mint" ? "bg-mint" : "bg-accent",
                      )}
                      style={{ left: `${pct(asDay(m.date))}%` }}
                    />
                  ))}
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line px-4 py-2.5 text-[11px] text-muted">
        {(["backlog", "todo", "in_progress", "review", "done"] as TaskStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-full", BAR[s])} />
            {s.replace("_", " ")}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-coral" /> overdue
        </span>
        {rangeStart && <span className="ml-auto text-faint">Dashed lines: project start / target</span>}
      </div>
    </Card>
  );
}
