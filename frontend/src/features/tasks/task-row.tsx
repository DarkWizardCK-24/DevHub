"use client";

import { Check, Clock } from "lucide-react";
import { motion } from "motion/react";
import { ProjectBadge } from "@/components/shared/project-badge";
import { TagChip } from "@/components/shared/tag-picker";
import { Badge } from "@/components/ui/badge";
import { PRIORITY } from "@/lib/constants";
import { dueLabel, minutesLabel } from "@/lib/format";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TaskCheckbox({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const done = task.status === "done";
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      role="checkbox"
      aria-checked={done}
      aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
      className={cn(
        "grid size-4.5 shrink-0 place-items-center rounded-md border-[1.5px] transition-all",
        done ? "border-mint bg-mint text-white" : "border-line-strong hover:border-accent hover:bg-accent-soft/30",
      )}
    >
      {done && <Check className="size-3" strokeWidth={3} />}
    </motion.button>
  );
}

export function DueBadge({ date, done }: { date: string; done?: boolean }) {
  const due = dueLabel(date);
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium", done ? "text-faint" : due.overdue ? "text-coral" : due.soon ? "text-amber" : "text-muted")}>
      <Clock className="size-3" /> {due.text}
    </span>
  );
}

export function TaskRow({ task, onToggle, onOpen, showProject = true }: { task: Task; onToggle: () => void; onOpen: () => void; showProject?: boolean }) {
  const done = task.status === "done";
  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
        className="group flex cursor-pointer items-start gap-3 px-4 py-2.5 transition-colors hover:bg-surface-2/70 focus-visible:bg-surface-2"
      >
        <div className="pt-0.5">
          <TaskCheckbox task={task} onToggle={onToggle} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-medium tracking-tight text-ink group-hover:text-accent transition-colors", done && "text-faint line-through group-hover:text-faint")}>{task.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {showProject && <ProjectBadge project={task.project} />}
            {task.due_date && <DueBadge date={task.due_date} done={done} />}
            {task.estimated_minutes != null && <span className="text-[11px] text-faint">{minutesLabel(task.estimated_minutes)} est.</span>}
            {task.tags.map((tag) => (
              <TagChip key={tag.id} tag={tag} />
            ))}
          </div>
        </div>
        {task.priority !== "medium" && !done && <Badge tone={PRIORITY[task.priority].tone}>{PRIORITY[task.priority].label}</Badge>}
      </div>
    </li>
  );
}
