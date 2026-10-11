"use client";

import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { ProjectSelect } from "@/components/shared/project-select";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { refresh } from "@/hooks/use-api";
import { api, errorMessage } from "@/lib/api/client";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NOTE_TEMPLATES } from "./templates";

const schema = z.object({
  title: z.string().trim().min(1, "Give the note a title").max(200),
  folder: z.string().trim().max(80),
  project_id: z.string(),
});
type Values = z.infer<typeof schema>;

export function NewNoteForm({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId?: string }) {
  const router = useRouter();
  const [template, setTemplate] = useState("blank");
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), values: { title: "", folder: "", project_id: projectId ?? "" } });

  function pickTemplate(id: string) {
    setTemplate(id);
    const t = NOTE_TEMPLATES.find((x) => x.id === id)!;
    setValue("title", t.title);
    setValue("folder", t.folder);
  }

  async function onSubmit(values: Values) {
    const content = NOTE_TEMPLATES.find((t) => t.id === template)?.content ?? "";
    try {
      const note = await api.post<Note>("/notes", {
        title: values.title,
        folder: values.folder || null,
        project_id: values.project_id || null,
        content,
      });
      await refresh("/notes", "/dashboard", "/projects");
      onClose();
      router.push(`/notes/${note.id}`);
    } catch (error) {
      toast.error("Note not created", { description: errorMessage(error) });
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New note" description="Start blank or from a template." className="md:max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Template">
          {NOTE_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={template === t.id}
              onClick={() => pickTemplate(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-[var(--radius-control)] border px-2.5 py-2 text-left text-xs font-medium transition-colors",
                template === t.id ? "border-accent bg-accent-soft text-ink" : "border-line text-muted hover:text-ink",
              )}
            >
              <FileText className="size-3.5 shrink-0" />
              <span className="truncate">{t.id === "blank" ? "Blank" : t.title}</span>
            </button>
          ))}
        </div>
        <TextField label="Title" autoFocus placeholder="e.g. architecture.md" error={errors.title?.message} {...register("title")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Folder" placeholder="docs, runbooks…" error={errors.folder?.message} {...register("folder")} />
          <ProjectSelect {...register("project_id")} />
        </div>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} className="h-12 sm:h-10">Cancel</Button>
          <Button type="submit" loading={isSubmitting} className="h-12 sm:h-10">Create and open</Button>
        </div>
      </form>
    </Modal>
  );
}
