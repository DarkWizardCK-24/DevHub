"use client";

import Link from "next/link";
import { FileText, Pin, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { TimelineIllustration } from "@/components/illustrations";
import { PageHeader } from "@/components/shell/page-header";
import { ProjectBadge } from "@/components/shared/project-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FilterChips } from "@/components/ui/filter-chips";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { SearchInput } from "@/components/ui/search-input";
import { ViewToggle } from "@/components/ui/view-toggle";
import { useApi } from "@/hooks/use-api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useViewMode } from "@/hooks/use-view-mode";
import { timeAgo } from "@/lib/format";
import type { NoteSummary, Page } from "@/lib/types";
import { NewNoteForm } from "./new-note-form";

export function NotesView({ projectId, openNew = false }: { projectId?: string; openNew?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const embedded = Boolean(projectId);
  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query.trim());
  const [folder, setFolder] = useState("");
  const [formOpen, setFormOpen] = useState(openNew);
  const [view, setView] = useViewMode("notes", "list");

  const { data: folders = [] } = useApi<string[]>("/notes/folders");
  const { data, error, isLoading, mutate } = useApi<Page<NoteSummary>>("/notes", { project_id: projectId, folder: folder || undefined, q, limit: 200 });

  return (
    <>
      {!embedded && (
        <PageHeader
          title="Notes"
          description="Markdown documentation: architecture, APIs, decisions, runbooks."
          actions={<Button onClick={() => setFormOpen(true)} className="w-full md:w-auto"><Plus className="size-4" /> New note</Button>}
        />
      )}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {folders.length > 0 ? (
          <FilterChips label="Folder" value={folder} onChange={setFolder} options={[{ value: "", label: "All notes" }, ...folders.map((f) => ({ value: f, label: f }))]} />
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <SearchInput value={query} onValueChange={setQuery} placeholder="Search notes" className="flex-1 md:w-64" />
          <ViewToggle value={view} onChange={setView} />
          {embedded && <Button onClick={() => setFormOpen(true)}><Plus className="size-4" /> New note</Button>}
        </div>
      </div>

      {view === "grid" && data && data.items.length > 0 && !error ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.items.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`} className="group flex flex-col rounded-[var(--radius-card)] border border-line/70 bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop">
              <div className="flex items-start gap-2.5">
                <span className="grid size-8.5 shrink-0 place-items-center rounded-lg border border-sky/20 bg-sky-soft text-sky"><FileText className="size-4" /></span>
                <p className="line-clamp-2 min-w-0 flex-1 font-sans text-sm font-semibold tracking-tight text-ink transition-colors group-hover:text-accent">{note.title}</p>
                {note.is_pinned && <Pin className="size-3.5 shrink-0 fill-accent text-accent" aria-label="Pinned" />}
              </div>
              <p className="mt-3 line-clamp-4 flex-1 text-xs leading-relaxed text-muted">{note.excerpt || "No content yet."}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                {note.folder && <span className="rounded-md border border-line/60 bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">{note.folder}</span>}
                {!embedded && <ProjectBadge project={note.project} asLink={false} />}
                <span className="ml-auto text-xs text-faint">{timeAgo(note.updated_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
      <Card className="overflow-hidden">
        {isLoading && !data ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState title="Notes didn't load" message={error.message} onRetry={() => mutate()} />
        ) : data && data.items.length === 0 ? (
          <EmptyState
            illustration={<TimelineIllustration />}
            title={q || folder ? "No matching notes" : "No notes yet"}
            description={q || folder ? "Try another search or folder." : "Write down how things work while you still remember."}
            action={!q && !folder ? <Button onClick={() => setFormOpen(true)}><Plus className="size-4" /> New note</Button> : undefined}
          />
        ) : view === "compact" ? (
          <ul className="divide-y divide-line">
            {data?.items.map((note) => (
              <li key={note.id}>
                <Link href={`/notes/${note.id}`} className="group flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-surface-2/70">
                  <FileText className="size-3.5 shrink-0 text-sky" />
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    {note.is_pinned && <Pin className="size-3 shrink-0 fill-accent text-accent" aria-label="Pinned" />}
                    <span className="truncate font-medium text-ink group-hover:text-accent">{note.title}</span>
                  </span>
                  {note.folder && <span className="hidden w-28 shrink-0 truncate text-xs text-muted sm:block">{note.folder}</span>}
                  {!embedded && <span className="hidden w-36 shrink-0 truncate md:block"><ProjectBadge project={note.project} asLink={false} /></span>}
                  <span className="w-20 shrink-0 text-right text-xs text-faint">{timeAgo(note.updated_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-line">
            {data?.items.map((note) => (
              <li key={note.id}>
                <Link href={`/notes/${note.id}`} className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-2/70">
                  <span className="mt-0.5 grid size-8.5 shrink-0 place-items-center rounded-lg border border-sky/20 bg-sky-soft text-sky">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {note.is_pinned && <Pin className="size-3.5 shrink-0 fill-accent text-accent" aria-label="Pinned" />}
                      <p className="truncate font-sans text-sm font-semibold tracking-tight text-ink transition-colors group-hover:text-accent">{note.title}</p>
                      {note.folder && <span className="shrink-0 rounded-md border border-line/60 bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">{note.folder}</span>}
                    </div>
                    {note.excerpt && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{note.excerpt}</p>}
                    <div className="mt-1.5 flex items-center gap-3">
                      {!embedded && <ProjectBadge project={note.project} asLink={false} />}
                      <span className="text-xs text-faint">Edited {timeAgo(note.updated_at)}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
      )}

      <NewNoteForm
        open={formOpen}
        projectId={projectId}
        onClose={() => {
          setFormOpen(false);
          if (openNew) router.replace(pathname);
        }}
      />
    </>
  );
}
