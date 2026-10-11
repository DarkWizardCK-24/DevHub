"use client";

import { Download, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FolderIllustration } from "@/components/illustrations";
import { PageHeader } from "@/components/shell/page-header";
import { ProjectBadge } from "@/components/shared/project-badge";
import { ProjectSelect } from "@/components/shared/project-select";
import { ActionMenu } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { TextField } from "@/components/ui/field";
import { FilterChips } from "@/components/ui/filter-chips";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { Modal } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { SelectField } from "@/components/ui/select-field";
import { ViewToggle } from "@/components/ui/view-toggle";
import { refresh, useApi } from "@/hooks/use-api";
import { useConfirm } from "@/hooks/use-confirm";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useViewMode } from "@/hooks/use-view-mode";
import { api, errorMessage } from "@/lib/api/client";
import { FILE_CATEGORY, options } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import type { FileCategory, Page, StoredFile } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { openFile } from "./file-actions";
import { FileIcon } from "./file-icon";
import { UploadZone } from "./upload-zone";

function EditFileForm({ file, onClose }: { file: StoredFile; onClose: () => void }) {
  const { register, handleSubmit, formState } = useForm({
    values: { name: file.name, description: file.description ?? "", category: file.category, project_id: file.project_id ?? "" },
  });
  async function onSubmit(values: { name: string; description: string; category: FileCategory; project_id: string }) {
    if (!values.name.trim()) return toast.error("The file needs a name");
    try {
      await api.patch(`/files/${file.id}`, { name: values.name.trim(), description: values.description.trim() || null, category: values.category, project_id: values.project_id || null });
      toast.success("File details saved");
      await refresh("/files");
      onClose();
    } catch (error) {
      toast.error("File details not saved", { description: errorMessage(error) });
    }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <TextField label="Name" maxLength={255} {...register("name")} />
      <TextField label="Description" maxLength={2000} {...register("description")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Category" options={options(FILE_CATEGORY)} {...register("category")} />
        <ProjectSelect {...register("project_id")} />
      </div>
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} className="h-12 sm:h-10">Cancel</Button>
        <Button type="submit" loading={formState.isSubmitting} className="h-12 sm:h-10">Save details</Button>
      </div>
    </form>
  );
}

export function FilesView({ projectId }: { projectId?: string }) {
  const embedded = Boolean(projectId);
  const [category, setCategory] = useState<"" | FileCategory>("");
  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query.trim());
  const [editing, setEditing] = useState<StoredFile | null>(null);
  const [confirm, confirmDialog] = useConfirm();
  const [view, setView] = useViewMode("files", "grid");

  const { data, error, isLoading, mutate } = useApi<Page<StoredFile>>("/files", { project_id: projectId, category: category || undefined, q, limit: 200 });

  const totalSize = data?.items.reduce((sum, f) => sum + f.size_bytes, 0) ?? 0;

  const menu = (file: StoredFile) => (
    <ActionMenu
      items={[
        { label: "Open", icon: ExternalLink, onSelect: () => openFile(file.id) },
        { label: "Download", icon: Download, onSelect: () => openFile(file.id, { download: true }) },
        { label: "Edit details", icon: Pencil, onSelect: () => setEditing(file) },
        {
          label: "Delete",
          icon: Trash2,
          danger: true,
          onSelect: () =>
            confirm({
              title: "Delete this file?",
              description: `"${file.name}" will be removed from storage permanently.`,
              confirmLabel: "Delete file",
              successMessage: "File deleted",
              action: async () => {
                await api.delete(`/files/${file.id}`);
                await refresh("/files", "/projects", "/builds");
              },
            }),
        },
      ]}
    />
  );

  return (
    <>
      {!embedded && <PageHeader title="Files" description={data ? `${data.total} files · ${formatBytes(totalSize)}` : "Screenshots, PDFs, designs and docs, stored privately."} />}
      <UploadZone projectId={projectId} />

      <div className="mt-6 mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips label="Category" value={category} onChange={setCategory} options={[{ value: "" as const, label: "All" }, ...options(FILE_CATEGORY)]} />
        <div className="flex gap-2">
          <SearchInput value={query} onValueChange={setQuery} placeholder="Search files" className="flex-1 lg:w-64" />
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading && !data ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState title="Files didn't load" message={error.message} onRetry={() => mutate()} />
        ) : data && data.items.length === 0 ? (
          <EmptyState illustration={<FolderIllustration />} title={q || category ? "No matching files" : "No files yet"} description={q || category ? "Try another category or search." : "Upload screenshots, specs and designs so they live next to the project."} />
        ) : view === "grid" ? (
          <ul className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data?.items.map((file) => (
              <li key={file.id} className="group relative flex flex-col rounded-2xl border border-line/70 bg-surface-2/40 p-3 transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop">
                <button type="button" onClick={() => openFile(file.id)} className="flex flex-col text-left" title="Open">
                  <span className="grid h-24 place-items-center rounded-xl bg-surface"><FileIcon category={file.category} /></span>
                  <p className="mt-3 truncate pr-7 text-sm font-medium group-hover:text-accent">{file.name}</p>
                  <p className="mt-0.5 text-xs text-faint">{FILE_CATEGORY[file.category]} · {formatBytes(file.size_bytes)} · {timeAgo(file.created_at)}</p>
                </button>
                {file.description && <p className="mt-1 line-clamp-2 text-xs text-muted">{file.description}</p>}
                {!embedded && <div className="mt-2"><ProjectBadge project={file.project} asLink={false} /></div>}
                <div className="absolute top-2 right-2">{menu(file)}</div>
              </li>
            ))}
          </ul>
        ) : view === "compact" ? (
          <ul className="divide-y divide-line">
            {data?.items.map((file) => (
              <li key={file.id} className="flex items-center gap-3 px-4 py-1.5 text-sm">
                <button type="button" onClick={() => openFile(file.id)} className="min-w-0 flex-1 truncate text-left font-medium hover:text-accent" title="Open">{file.name}</button>
                <span className="hidden w-24 shrink-0 text-xs text-muted sm:block">{FILE_CATEGORY[file.category]}</span>
                {!embedded && <span className="hidden w-36 shrink-0 truncate md:block"><ProjectBadge project={file.project} asLink={false} /></span>}
                <span className="w-16 shrink-0 text-right text-xs tabular-nums text-faint">{formatBytes(file.size_bytes)}</span>
                <span className="hidden w-20 shrink-0 text-right text-xs text-faint sm:block">{timeAgo(file.created_at)}</span>
                {menu(file)}
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-line">
            {data?.items.map((file) => (
              <li key={file.id} className="flex items-center gap-3 px-4 py-3">
                <button type="button" onClick={() => openFile(file.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" title="Open">
                  <FileIcon category={file.category} />
                  <div className="min-w-0">
                    <p className="truncate font-medium hover:text-accent">{file.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-faint">
                      <span>{FILE_CATEGORY[file.category]}</span>
                      <span>{formatBytes(file.size_bytes)}</span>
                      <span>{timeAgo(file.created_at)}</span>
                      {!embedded && <ProjectBadge project={file.project} asLink={false} />}
                    </div>
                    {file.description && <p className="mt-0.5 truncate text-sm text-muted">{file.description}</p>}
                  </div>
                </button>
                <Button size="icon" variant="ghost" aria-label={`Download ${file.name}`} onClick={() => openFile(file.id, { download: true })} className="hidden sm:inline-flex">
                  <Download className="size-4" />
                </Button>
                {menu(file)}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit file details">
        {editing && <EditFileForm file={editing} onClose={() => setEditing(null)} />}
      </Modal>
      {confirmDialog}
    </>
  );
}
