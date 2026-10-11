"use client";

import { Trash2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { ProjectSelect } from "@/components/shared/project-select";
import { TagPicker } from "@/components/shared/tag-picker";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { SelectField } from "@/components/ui/select-field";
import { refresh } from "@/hooks/use-api";
import { useConfirm } from "@/hooks/use-confirm";
import { ApiError, api, errorMessage } from "@/lib/api/client";
import { PRIORITY, TASK_STATUS, options } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Task, TaskStatus } from "@/lib/types";

const minutes = z.union([z.literal(""), z.coerce.number().int("Whole minutes only").min(0).max(100000)]);

const schema = z.object({
  title: z.string().trim().min(1, "Give the task a title").max(200),
  description: z.string().max(20000),
  project_id: z.string(),
  status: z.enum(["backlog", "todo", "in_progress", "review", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  due_date: z.string(),
  estimated_minutes: minutes,
  actual_minutes: minutes,
  tag_ids: z.array(z.string()).max(20),
});
type FormInput = z.input<typeof schema>;
type Values = z.output<typeof schema>;

export interface TaskDefaults {
  projectId?: string;
  status?: TaskStatus;
  dueDate?: string;
}

const REVALIDATE = ["/tasks", "/dashboard", "/projects", "/activity"];

export function TaskForm({ open, onClose, task, defaults }: { open: boolean; onClose: () => void; task?: Task | null; defaults?: TaskDefaults }) {
  const editing = Boolean(task);
  const [confirm, confirmDialog] = useConfirm();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, Values>({
    resolver: zodResolver(schema),
    values: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      project_id: task?.project_id ?? defaults?.projectId ?? "",
      status: task?.status ?? defaults?.status ?? "todo",
      priority: task?.priority ?? "medium",
      due_date: task?.due_date ?? defaults?.dueDate ?? "",
      estimated_minutes: task?.estimated_minutes ?? "",
      actual_minutes: task?.actual_minutes ?? "",
      tag_ids: task?.tags.map((t) => t.id) ?? [],
    },
  });

  async function onSubmit(values: Values) {
    const payload = {
      ...values,
      description: values.description.trim() || null,
      project_id: values.project_id || null,
      due_date: values.due_date || null,
      estimated_minutes: values.estimated_minutes === "" ? null : values.estimated_minutes,
      actual_minutes: values.actual_minutes === "" ? null : values.actual_minutes,
    };
    try {
      if (editing) await api.patch<Task>(`/tasks/${task!.id}`, payload);
      else await api.post<Task>("/tasks", payload);
      toast.success(editing ? "Task saved" : "Task created");
      await refresh(...REVALIDATE);
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.code === "validation_error") {
        Object.entries(error.fieldErrors).forEach(([field, message]) => setError(field as keyof FormInput, { message }));
        return;
      }
      toast.error(editing ? "Task not saved" : "Task not created", { description: errorMessage(error) });
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={editing ? "Edit task" : "New task"} className="md:max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <TextField label="Title" autoFocus={!editing} placeholder="What needs doing?" error={errors.title?.message} {...register("title")} />
          <TextAreaField label="Description" rows={4} placeholder="Details, acceptance criteria, links… (Markdown is fine)" error={errors.description?.message} {...register("description")} />
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Status" options={options(TASK_STATUS)} {...register("status")} />
            <SelectField label="Priority" options={options(PRIORITY)} {...register("priority")} />
            <ProjectSelect className="col-span-2 sm:col-span-1" {...register("project_id")} />
            <TextField label="Due date" type="date" className="col-span-2 sm:col-span-1" error={errors.due_date?.message} {...register("due_date")} />
            <TextField label="Estimate (min)" type="number" inputMode="numeric" min={0} error={errors.estimated_minutes?.message} {...register("estimated_minutes")} />
            <TextField label="Actual (min)" type="number" inputMode="numeric" min={0} error={errors.actual_minutes?.message} {...register("actual_minutes")} />
          </div>
          <Controller control={control} name="tag_ids" render={({ field }) => <TagPicker value={field.value} onChange={field.onChange} />} />
          {task && (
            <p className="text-xs text-faint">
              Created {formatDate(task.created_at, { dateStyle: "medium" })}
              {task.completed_at && ` · Completed ${formatDate(task.completed_at, { dateStyle: "medium" })}`}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center">
            {editing && (
              <Button
                variant="ghost"
                className="h-12 text-coral sm:mr-auto sm:h-10"
                onClick={() =>
                  confirm({
                    title: "Delete this task?",
                    description: `"${task!.title}" will be removed permanently.`,
                    confirmLabel: "Delete task",
                    successMessage: "Task deleted",
                    action: async () => {
                      await api.delete(`/tasks/${task!.id}`);
                      await refresh(...REVALIDATE);
                      onClose();
                    },
                  })
                }
              >
                <Trash2 className="size-4" /> Delete
              </Button>
            )}
            <Button variant="secondary" onClick={onClose} className="h-12 sm:h-10">
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} className="h-12 sm:h-10">
              {editing ? "Save task" : "Create task"}
            </Button>
          </div>
        </form>
      </Modal>
      {confirmDialog}
    </>
  );
}
