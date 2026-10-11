"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { ProjectSelect } from "@/components/shared/project-select";
import { TagPicker } from "@/components/shared/tag-picker";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { SelectField } from "@/components/ui/select-field";
import { refresh } from "@/hooks/use-api";
import { api, errorMessage } from "@/lib/api/client";
import { LANGUAGES, options } from "@/lib/constants";
import type { Language, Snippet } from "@/lib/types";

const schema = z.object({
  title: z.string().trim().min(1, "Give the snippet a title").max(200),
  description: z.string().max(2000),
  language: z.enum(["python", "dart", "typescript", "javascript", "sql", "bash", "json", "yaml"]),
  // No trim: indentation is part of the code.
  code: z.string().refine((v) => v.trim().length > 0, "Paste some code").pipe(z.string().max(100_000)),
  project_id: z.string(),
  is_favorite: z.boolean(),
  tag_ids: z.array(z.string()).max(20),
});
type Values = z.infer<typeof schema>;

/** Tab inserts two spaces in code fields instead of moving focus. */
export function handleTabIndent(event: React.KeyboardEvent<HTMLTextAreaElement>, onChange: (value: string) => void) {
  if (event.key !== "Tab") return;
  event.preventDefault();
  const el = event.currentTarget;
  const { selectionStart, selectionEnd, value } = el;
  onChange(value.slice(0, selectionStart) + "  " + value.slice(selectionEnd));
  requestAnimationFrame(() => el.setSelectionRange(selectionStart + 2, selectionStart + 2));
}

export function SnippetForm({ open, onClose, snippet, projectId }: { open: boolean; onClose: () => void; snippet?: Snippet | null; projectId?: string }) {
  const editing = Boolean(snippet);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      title: snippet?.title ?? "",
      description: snippet?.description ?? "",
      language: (snippet?.language ?? "typescript") as Language,
      code: snippet?.code ?? "",
      project_id: snippet?.project_id ?? projectId ?? "",
      is_favorite: snippet?.is_favorite ?? false,
      tag_ids: snippet?.tags.map((t) => t.id) ?? [],
    },
  });

  async function onSubmit(values: Values) {
    const payload = { ...values, title: values.title.trim(), description: values.description.trim() || null, project_id: values.project_id || null };
    try {
      if (editing) await api.patch(`/snippets/${snippet!.id}`, payload);
      else await api.post("/snippets", payload);
      toast.success(editing ? "Snippet saved" : "Snippet added");
      await refresh("/snippets", "/activity");
      onClose();
    } catch (error) {
      toast.error(editing ? "Snippet not saved" : "Snippet not added", { description: errorMessage(error) });
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit snippet" : "New snippet"} className="md:max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
          <TextField label="Title" autoFocus={!editing} placeholder="e.g. Debounce hook" error={errors.title?.message} {...register("title")} />
          <SelectField label="Language" options={options(LANGUAGES)} {...register("language")} />
        </div>
        <TextField label="Description" placeholder="When to use it (optional)" error={errors.description?.message} {...register("description")} />
        <Controller
          control={control}
          name="code"
          render={({ field }) => (
            <div className="space-y-1.5">
              <label htmlFor="snippet-code" className="text-[13px] font-medium">Code</label>
              <textarea
                id="snippet-code"
                value={field.value}
                onChange={field.onChange}
                onKeyDown={(e) => handleTabIndent(e, field.onChange)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                rows={12}
                aria-invalid={errors.code ? true : undefined}
                className="w-full resize-y rounded-[var(--radius-control)] border border-line bg-surface-2 p-3 font-mono text-[13px] leading-relaxed focus:border-accent focus:outline-none"
              />
              {errors.code && <p className="text-[13px] text-coral">{errors.code.message}</p>}
            </div>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <ProjectSelect {...register("project_id")} />
          <label className="flex items-center gap-2.5 self-end pb-2.5 text-sm">
            <input type="checkbox" className="size-4 accent-[var(--accent)]" {...register("is_favorite")} /> Favorite
          </label>
        </div>
        <Controller control={control} name="tag_ids" render={({ field }) => <TagPicker value={field.value} onChange={field.onChange} />} />
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} className="h-12 sm:h-10">Cancel</Button>
          <Button type="submit" loading={isSubmitting} className="h-12 sm:h-10">{editing ? "Save snippet" : "Add snippet"}</Button>
        </div>
      </form>
    </Modal>
  );
}
