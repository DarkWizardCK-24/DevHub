"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ProjectBadge } from "@/components/shared/project-badge";
import { TagChip } from "@/components/shared/tag-picker";
import { Badge } from "@/components/ui/badge";
import { PRIORITY, TASK_STATUS, TASK_STATUS_ORDER } from "@/lib/constants";
import type { Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DueBadge, TaskCheckbox } from "./task-row";

function CardBody({ task, onToggle, showProject }: { task: Task; onToggle?: () => void; showProject: boolean }) {
  return (
    <>
      <div className="flex items-start gap-2.5">
        {onToggle && (
          <div className="pt-0.5">
            <TaskCheckbox task={task} onToggle={onToggle} />
          </div>
        )}
        <p className={cn("min-w-0 flex-1 text-sm font-medium", task.status === "done" && "text-faint line-through")}>{task.title}</p>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {task.priority !== "medium" && <Badge tone={PRIORITY[task.priority].tone}>{PRIORITY[task.priority].label}</Badge>}
        {task.due_date && <DueBadge date={task.due_date} done={task.status === "done"} />}
        {task.tags.slice(0, 2).map((tag) => (
          <TagChip key={tag.id} tag={tag} />
        ))}
      </div>
      {showProject && task.project && <ProjectBadge project={task.project} asLink={false} className="mt-2.5" />}
    </>
  );
}

function DraggableCard({ task, onOpen, onToggle, showProject }: { task: Task; onOpen: () => void; onToggle: () => void; showProject: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: { task } });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className={cn(
        "cursor-grab touch-manipulation rounded-xl border border-line/80 bg-surface p-3 shadow-xs transition-all hover:border-line-strong hover:shadow-sm active:cursor-grabbing",
        isDragging && "opacity-30",
      )}
    >
      <CardBody task={task} onToggle={onToggle} showProject={showProject} />
    </div>
  );
}

function Column({
  status,
  tasks,
  children,
  onAdd,
}: {
  status: TaskStatus;
  tasks: Task[];
  children: React.ReactNode;
  onAdd: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      aria-label={TASK_STATUS[status].label}
      className={cn(
        "flex w-[82vw] max-w-80 shrink-0 snap-start flex-col rounded-2xl border bg-surface-2/60 transition-colors sm:w-72",
        isOver ? "border-accent bg-accent-soft/30 shadow-xs" : "border-line/70",
      )}
    >
      <header className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <Badge tone={TASK_STATUS[status].tone} dot>
            {TASK_STATUS[status].label}
          </Badge>
          <span className="text-[11px] text-faint tabular-nums font-mono">{tasks.length}</span>
        </div>
        <button type="button" onClick={onAdd} aria-label={`Add task to ${TASK_STATUS[status].label}`} className="grid size-6.5 place-items-center rounded-lg text-faint hover:bg-surface hover:text-ink transition-colors">
          <Plus className="size-3.5" />
        </button>
      </header>
      <div className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3">{children}</div>
    </section>
  );
}

/**
 * Kanban board. Drag a card to another column to change its status.
 * Touch: press and hold ~200 ms to start dragging, so normal swipes still
 * scroll the board sideways.
 */
export function TaskBoard({
  tasks,
  onOpen,
  onToggle,
  onMove,
  onAdd,
  showProject,
}: {
  tasks: Task[];
  onOpen: (task: Task) => void;
  onToggle: (task: Task) => void;
  onMove: (task: Task, status: TaskStatus, position: number) => void;
  onAdd: (status: TaskStatus) => void;
  showProject: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );
  const [active, setActive] = useState<Task | null>(null);

  const byStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);

  function onDragEnd(event: DragEndEvent) {
    setActive(null);
    const task = event.active.data.current?.task as Task | undefined;
    const target = event.over?.id as TaskStatus | undefined;
    if (!task || !target || target === task.status) return;
    // Drop at the bottom of the target column.
    const last = byStatus(target).at(-1);
    onMove(task, target, (last?.position ?? 0) + 1024);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => setActive((event.active.data.current?.task as Task) ?? null)}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActive(null)}
    >
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
        {TASK_STATUS_ORDER.map((status) => {
          const columnTasks = byStatus(status);
          return (
            <Column key={status} status={status} tasks={columnTasks} onAdd={() => onAdd(status)}>
              {columnTasks.map((task) => (
                <DraggableCard key={task.id} task={task} onOpen={() => onOpen(task)} onToggle={() => onToggle(task)} showProject={showProject} />
              ))}
              {columnTasks.length === 0 && <p className="px-2 py-6 text-center text-xs text-faint">Drop tasks here</p>}
            </Column>
          );
        })}
      </div>
      <DragOverlay>
        {active && (
          <div className="w-72 rotate-2 rounded-[var(--radius-control)] border border-accent bg-surface p-3 shadow-pop">
            <CardBody task={active} showProject={showProject} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
