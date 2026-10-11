"use client";

import Link from "next/link";
import { ArrowLeft, Check, Columns2, Eye, PenLine, Pin, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ProjectSelect } from "@/components/shared/project-select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Markdown } from "@/components/ui/markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { refresh, useApi } from "@/hooks/use-api";
import { useConfirm } from "@/hooks/use-confirm";
import { api, errorMessage } from "@/lib/api/client";
import { timeAgo } from "@/lib/format";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";

type Mode = "write" | "preview" | "split";
type SaveState = "saved" | "dirty" | "saving" | "error";
const AUTOSAVE_MS = 1000;

/**
 * Markdown editor with autosave: changes are PATCHed one second after you
 * stop typing. Leaving with unsaved changes triggers the browser's warning.
 */
export function NoteEditor({ noteId }: { noteId: string }) {
  const router = useRouter();
  const { data: note, error, isLoading, mutate } = useApi<Note>(`/notes/${noteId}`, undefined, { revalidateOnFocus: false });
  const [draft, setDraft] = useState<Pick<Note, "title" | "content" | "folder" | "project_id"> | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [mode, setMode] = useState<Mode>("write");
  const [confirm, confirmDialog] = useConfirm();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  // Start editing from the server copy once it arrives (and after each save
  // the draft stays the source of truth, so typing never gets clobbered).
  const current = draft ?? (note ? { title: note.title, content: note.content, folder: note.folder, project_id: note.project_id } : null);

  const save = useCallback(
    async (values: NonNullable<typeof current>) => {
      if (!values.title.trim()) return setSaveState("error");
      setSaveState("saving");
      try {
        const saved = await api.patch<Note>(`/notes/${noteId}`, { ...values, title: values.title.trim(), folder: values.folder?.trim() || null });
        await mutate(saved, { revalidate: false });
        setSaveState("saved");
        refresh("/notes", "/projects", "/dashboard");
      } catch (err) {
        setSaveState("error");
        toast.error("Note not saved", { description: errorMessage(err) });
      }
    },
    [noteId, mutate],
  );

  function change(patch: Partial<NonNullable<typeof current>>) {
    if (!current) return;
    const next = { ...current, ...patch };
    setDraft(next);
    setSaveState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(next), AUTOSAVE_MS);
  }

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (saveState === "dirty" || saveState === "saving") event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Tab inserts two spaces instead of leaving the textarea.
  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "s" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      if (timer.current) clearTimeout(timer.current);
      if (current) save(current);
      return;
    }
    if (event.key !== "Tab" || !current) return;
    event.preventDefault();
    const el = event.currentTarget;
    const { selectionStart, selectionEnd } = el;
    const content = current.content.slice(0, selectionStart) + "  " + current.content.slice(selectionEnd);
    change({ content });
    requestAnimationFrame(() => el.setSelectionRange(selectionStart + 2, selectionStart + 2));
  }

  if (isLoading && !note) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-[60vh] w-full rounded-[var(--radius-card)]" />
      </div>
    );
  }
  if (error || !note || !current) {
    return <Card><ErrorState title="This note didn't load" message={error?.message ?? "It may have been deleted."} onRetry={() => mutate()} /></Card>;
  }

  const status = {
    saved: <span className="flex items-center gap-1.5 text-mint"><Check className="size-3.5" /> Saved {timeAgo(note.updated_at)}</span>,
    dirty: <span className="text-faint">Unsaved changes</span>,
    saving: <span className="flex items-center gap-1.5 text-muted"><Spinner size="sm" className="text-muted" /> Saving…</span>,
    error: <span className="text-coral">{current.title.trim() ? "Not saved, retrying on next edit" : "Title can't be empty"}</span>,
  }[saveState];

  const modes: { value: Mode; label: string; icon: typeof Eye; desktopOnly?: boolean }[] = [
    { value: "write", label: "Write", icon: PenLine },
    { value: "preview", label: "Preview", icon: Eye },
    { value: "split", label: "Split", icon: Columns2, desktopOnly: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/notes" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-raised hover:text-ink" aria-label="Back to notes">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="text-xs">{status}</div>
        <div className="ml-auto flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label={note.is_pinned ? "Unpin note" : "Pin note"}
            onClick={async () => {
              await mutate(await api.patch<Note>(`/notes/${noteId}`, { is_pinned: !note.is_pinned }), { revalidate: false });
              refresh("/notes");
            }}
          >
            <Pin className={cn("size-4", note.is_pinned && "fill-accent text-accent")} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Delete note"
            className="hover:text-coral"
            onClick={() =>
              confirm({
                title: "Delete this note?",
                description: `"${note.title}" will be permanently deleted.`,
                confirmLabel: "Delete note",
                successMessage: "Note deleted",
                action: async () => {
                  if (timer.current) clearTimeout(timer.current);
                  await api.delete(`/notes/${noteId}`);
                  await refresh("/notes", "/projects", "/dashboard");
                  router.replace("/notes");
                },
              })
            }
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <input
        value={current.title}
        onChange={(e) => change({ title: e.target.value })}
        maxLength={200}
        aria-label="Title"
        placeholder="Untitled"
        className="w-full bg-transparent font-sans text-2xl font-semibold tracking-tight text-ink placeholder:text-faint focus:outline-none md:text-[28px]"
      />

      <div className="grid gap-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,16rem)_1fr] sm:items-end">
        <input
          value={current.folder ?? ""}
          onChange={(e) => change({ folder: e.target.value })}
          maxLength={80}
          placeholder="Folder"
          aria-label="Folder"
          className="h-10 rounded-[var(--radius-control)] border border-line bg-surface-2 px-3 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
        />
        <ProjectSelect label="" aria-label="Project" value={current.project_id ?? ""} onChange={(e) => change({ project_id: e.target.value || null })} />
        <div role="tablist" aria-label="Editor mode" className="flex rounded-[var(--radius-control)] border border-line bg-surface-2 p-1 sm:justify-self-end">
          {modes.map(({ value, label, icon: Icon, desktopOnly }) => (
            <button
              key={value}
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
                mode === value ? "bg-surface text-ink shadow-card" : "text-muted",
                desktopOnly && "hidden lg:flex",
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn("grid gap-4", mode === "split" && "lg:grid-cols-2")}>
        {mode !== "preview" && (
          <textarea
            ref={textarea}
            value={current.content}
            onChange={(e) => change({ content: e.target.value })}
            onKeyDown={onKeyDown}
            spellCheck
            aria-label="Note content (Markdown)"
            placeholder={"# Heading\n\nWrite in Markdown. **bold**, `code`, - lists, | tables |\n\nCtrl+S saves immediately."}
            className="min-h-[60vh] w-full resize-y rounded-[var(--radius-card)] border border-line bg-surface p-4 font-mono text-[13.5px] leading-relaxed placeholder:text-faint focus:border-accent focus:outline-none"
          />
        )}
        {mode !== "write" && (
          <Card className={cn("min-h-[60vh] p-5 md:p-7", mode === "split" && "max-h-[75vh] overflow-y-auto")}>
            {current.content.trim() ? <Markdown content={current.content} /> : <p className="text-sm text-faint">Nothing to preview yet.</p>}
          </Card>
        )}
      </div>
      {confirmDialog}
    </div>
  );
}
