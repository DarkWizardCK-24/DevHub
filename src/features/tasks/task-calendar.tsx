"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PRIORITY } from "@/lib/constants";
import { toDateOnly } from "@/lib/format";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TaskRow } from "./task-row";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PRIORITY_DOT: Record<Task["priority"], string> = { low: "bg-faint", medium: "bg-sky", high: "bg-accent", urgent: "bg-coral" };

/** Monday-first grid of the visible month, padded with neighbouring days. */
function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

/**
 * Month view of tasks by due date. Desktop shows titles in each cell; phones
 * show dots, and tapping a day lists its tasks below the grid.
 */
export function TaskCalendar({
  tasks,
  onOpen,
  onToggle,
  onAdd,
}: {
  tasks: Task[];
  onOpen: (task: Task) => void;
  onToggle: (task: Task) => void;
  onAdd: (date: string) => void;
}) {
  const today = toDateOnly(new Date());
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(today);

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.due_date) continue;
      map.set(task.due_date, [...(map.get(task.due_date) ?? []), task]);
    }
    return map;
  }, [tasks]);

  const days = monthGrid(month);
  const selectedTasks = byDay.get(selected) ?? [];
  const shift = (delta: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-sans text-sm font-semibold tracking-tight text-ink">{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => { setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); setSelected(today); }}>
              Today
            </Button>
            <Button size="icon" variant="ghost" aria-label="Previous month" onClick={() => shift(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Next month" onClick={() => shift(1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-line text-center text-xs font-medium text-faint">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = toDateOnly(day);
            const inMonth = day.getMonth() === month.getMonth();
            const dayTasks = byDay.get(key) ?? [];
            const isSelected = key === selected;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                onDoubleClick={() => onAdd(key)}
                aria-label={`${day.toDateString()}, ${dayTasks.length} tasks`}
                aria-pressed={isSelected}
                className={cn(
                  "flex min-h-14 flex-col items-stretch gap-1 border-r border-b border-line p-1.5 text-left transition-colors md:min-h-28 [&:nth-child(7n)]:border-r-0",
                  !inMonth && "bg-surface-2/60",
                  isSelected ? "bg-accent-soft/50" : "hover:bg-surface-2",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 place-items-center self-center rounded-full text-xs tabular-nums md:self-start",
                    key === today ? "bg-accent font-semibold text-accent-ink" : inMonth ? "text-ink" : "text-faint",
                  )}
                >
                  {day.getDate()}
                </span>
                {/* Phones: dots */}
                <span className="flex flex-wrap justify-center gap-0.5 md:hidden">
                  {dayTasks.slice(0, 4).map((t) => (
                    <span key={t.id} className={cn("size-1.5 rounded-full", t.status === "done" ? "bg-mint" : PRIORITY_DOT[t.priority])} />
                  ))}
                </span>
                {/* Desktop: titles */}
                <span className="hidden flex-col gap-0.5 md:flex">
                  {dayTasks.slice(0, 3).map((t) => (
                    <span
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(t);
                      }}
                      className={cn(
                        "truncate rounded px-1.5 py-0.5 text-[11px] font-medium",
                        t.status === "done" ? "bg-mint-soft text-mint line-through" : "bg-raised text-ink hover:bg-line",
                      )}
                      title={`${t.title} (${PRIORITY[t.priority].label})`}
                    >
                      {t.title}
                    </span>
                  ))}
                  {dayTasks.length > 3 && <span className="px-1.5 text-[11px] text-faint">+{dayTasks.length - 3} more</span>}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="font-sans text-[15px] font-semibold">
            {new Date(`${selected}T00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          <Button size="sm" variant="secondary" onClick={() => onAdd(selected)}>
            <Plus className="size-3.5" /> Add task
          </Button>
        </div>
        {selectedTasks.length === 0 ? (
          <p className="px-4 pb-5 text-sm text-muted">Nothing due this day.</p>
        ) : (
          <ul className="divide-y divide-line">
            {selectedTasks.map((task) => (
              <TaskRow key={task.id} task={task} onOpen={() => onOpen(task)} onToggle={() => onToggle(task)} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
