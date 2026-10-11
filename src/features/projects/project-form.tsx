"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { SelectField } from "@/components/ui/select-field";
import { refresh } from "@/hooks/use-api";
import { ApiError, api, errorMessage } from "@/lib/api/client";
import { PRIORITY, PROJECT_COLORS, PROJECT_STATUS, options } from "@/lib/constants";
import type { Priority, Project, ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const optionalUrl = z.union([z.literal(""), z.string().trim().url("Enter a full URL starting with https://")]);

const schema = z
  .object({
    name: z.string().trim().min(1, "Give the project a name").max(120),
    description: z.string().max(5000),
    status: z.enum(["planning", "in_progress", "on_hold", "completed", "archived"]),
    priority: z.enum(["low", "medium", "high", "urgent"]),
    category: z.string().trim().max(60),
    technologies: z.array(z.string()).max(30, "Up to 30 technologies"),
    github_url: optionalUrl,
    live_url: optionalUrl,
    color: z.string(),
    start_date: z.string(),
    target_date: z.string(),
    progress: z.number().min(0).max(100),
    is_pinned: z.boolean(),
  })
  .refine((v) => !v.start_date || !v.target_date || v.target_date >= v.start_date, {
    path: ["target_date"],
    message: "Must be on or after the start date",
  });
type Values = z.infer<typeof schema>;

function toValues(project?: Project | null): Values {
  return {
    name: project?.name ?? "",
    description: project?.description ?? "",
    status: (project?.status ?? "planning") as ProjectStatus,
    priority: (project?.priority ?? "medium") as Priority,
    category: project?.category ?? "",
    technologies: project?.technologies ?? [],
    github_url: project?.github_url ?? "",
    live_url: project?.live_url ?? "",
    color: project?.color ?? PROJECT_COLORS[0],
    start_date: project?.start_date ?? "",
    target_date: project?.target_date ?? "",
    progress: project?.progress ?? 0,
    is_pinned: project?.is_pinned ?? false,
  };
}

function TechInput({ value, onChange, error }: { value: string[]; onChange: (v: string[]) => void; error?: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const parts = draft.split(",").map((s) => s.trim()).filter(Boolean);
    const next = [...value];
    for (const part of parts) if (!next.some((t) => t.toLowerCase() === part.toLowerCase())) next.push(part.slice(0, 40));
    onChange(next);
    setDraft("");
  };
  return (
    <div className="space-y-1.5">
      <span className="text-[13px] font-medium">Technologies</span>
      <div className="flex flex-wrap items-center gap-1.5 rounded-[var(--radius-control)] border border-line bg-surface-2 p-2 focus-within:border-accent">
        {value.map((tech) => (
          <span key={tech} className="inline-flex h-7 items-center gap-1 rounded-md bg-raised px-2 text-xs font-medium">
            {tech}
            <button type="button" aria-label={`Remove ${tech}`} onClick={() => onChange(value.filter((t) => t !== tech))} className="text-faint hover:text-ink">
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={add}
          placeholder={value.length ? "" : "Next.js, FastAPI… press Enter"}
          aria-label="Add technology"
          className="min-w-28 flex-1 bg-transparent px-1 py-1 text-sm placeholder:text-faint focus:outline-none"
        />
      </div>
      {error && <p className="text-[13px] text-coral">{error}</p>}
    </div>
  );
}

export function ProjectForm({
  open,
  onClose,
  project,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
  onSaved?: (project: Project) => void;
}) {
  const editing = Boolean(project);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), values: toValues(project) });

  async function onSubmit(values: Values) {
    const payload = {
      ...values,
      description: values.description.trim() || null,
      category: values.category || null,
      github_url: values.github_url || null,
      live_url: values.live_url || null,
      start_date: values.start_date || null,
      target_date: values.target_date || null,
    };
    try {
      const saved = editing
        ? await api.patch<Project>(`/projects/${project!.id}`, payload)
        : await api.post<Project>("/projects", payload);
      toast.success(editing ? "Project saved" : "Project created");
      await refresh("/projects", "/dashboard");
      onSaved?.(saved);
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) return setError("name", { message: error.message });
      if (error instanceof ApiError && error.code === "validation_error") {
        Object.entries(error.fieldErrors).forEach(([field, message]) => setError(field as keyof Values, { message }));
        return;
      }
      toast.error(editing ? "Project not saved" : "Project not created", { description: errorMessage(error) });
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit project" : "New project"} className="md:max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <TextField label="Name" autoFocus placeholder="e.g. DevHub" error={errors.name?.message} {...register("name")} />
        <TextAreaField label="Description" rows={3} placeholder="What is it, and who is it for?" error={errors.description?.message} {...register("description")} />
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Status" options={options(PROJECT_STATUS)} {...register("status")} />
          <SelectField label="Priority" options={options(PRIORITY)} {...register("priority")} />
          <TextField label="Category" placeholder="Web app, Mobile…" error={errors.category?.message} {...register("category")} />
        </div>
        <Controller control={control} name="technologies" render={({ field }) => <TechInput value={field.value} onChange={field.onChange} error={errors.technologies?.message} />} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="GitHub repository" type="url" placeholder="https://github.com/…" error={errors.github_url?.message} {...register("github_url")} />
          <TextField label="Live URL" type="url" placeholder="https://…" error={errors.live_url?.message} {...register("live_url")} />
          <TextField label="Start date" type="date" error={errors.start_date?.message} {...register("start_date")} />
          <TextField label="Expected completion" type="date" error={errors.target_date?.message} {...register("target_date")} />
        </div>
        <Controller
          control={control}
          name="progress"
          render={({ field }) => (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[13px] font-medium">
                <label htmlFor="progress">Progress</label>
                <span className="tabular-nums text-muted">{field.value}%</span>
              </div>
              <input id="progress" type="range" min={0} max={100} step={5} value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
            </div>
          )}
        />
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <div className="space-y-1.5">
              <span className="text-[13px] font-medium">Color</span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Project color">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    role="radio"
                    aria-checked={field.value === color}
                    aria-label={color}
                    onClick={() => field.onChange(color)}
                    className={cn("size-8 rounded-full ring-offset-2 ring-offset-surface transition-transform", field.value === color && "scale-110 ring-2 ring-ink")}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}
        />
        <label className="flex items-center gap-2.5 text-sm">
          <input type="checkbox" className="size-4 accent-[var(--accent)]" {...register("is_pinned")} /> Pin to the top of lists
        </label>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} className="h-12 sm:h-10">
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} className="h-12 sm:h-10">
            {editing ? "Save project" : "Create project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
