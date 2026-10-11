"use client";

import { ChevronLeft, ChevronRight, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@/lib/api/client";
import { PROJECT_STATUS } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import type { AdminProject, Page } from "@/lib/types";

const PAGE_SIZE = 20;

/** Admin oversight: every project in the workspace, with its owner and content counts. */
export function ProjectsManager() {
  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query.trim());
  const [offset, setOffset] = useState(0);
  const [reload, setReload] = useState(0);
  const [page, setPage] = useState<Page<AdminProject> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<AdminProject | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<Page<AdminProject>>("/admin/projects", { q, limit: PAGE_SIZE, offset }, controller.signal)
      .then((data) => { setPage(data); setError(null); })
      .catch((err: Error) => { if (err.name !== "AbortError") setError(err.message); });
    return () => controller.abort();
  }, [q, offset, reload]);

  async function remove() {
    if (!target) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/projects/${target.id}`);
      toast.success("Project deleted", { description: target.name });
      setTarget(null);
      setReload((n) => n + 1);
    } catch (err) {
      toast.error("Couldn't delete the project", { description: (err as Error).message });
    } finally {
      setDeleting(false);
    }
  }

  const total = page?.total ?? 0;

  return (
    <>
      <div className="mb-4 md:max-w-sm">
        <SearchInput value={query} onValueChange={(v) => { setQuery(v); setOffset(0); }} placeholder="Search by project or owner" />
      </div>

      <Card className="overflow-hidden">
        {error ? (
          <ErrorState title="Projects didn't load" message={error} onRetry={() => setReload((n) => n + 1)} />
        ) : !page ? (
          <ul className="divide-y divide-line">{Array.from({ length: 5 }, (_, i) => <li key={i} className="p-4"><Skeleton className="h-10 w-full" /></li>)}</ul>
        ) : page.items.length === 0 ? (
          <EmptyState title="No projects" description={q ? `Nothing matches "${q}".` : "Nobody has created a project yet."} />
        ) : (
          <ul className="divide-y divide-line">
            {page.items.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl text-sm font-medium text-white" style={{ backgroundColor: p.color }}>{p.name.slice(0, 1).toUpperCase()}</span>
                  <div className="min-w-0">
                    <Link href={`/projects/${p.id}`} className="block truncate text-sm font-medium hover:text-accent">{p.name}</Link>
                    <p className="truncate text-xs text-muted">{p.owner_name || p.owner_email} · updated {timeAgo(p.updated_at)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                  <Badge tone={PROJECT_STATUS[p.status].tone}>{PROJECT_STATUS[p.status].label}</Badge>
                  <Link href={`/projects/${p.id}?tab=team`} className="font-medium text-accent hover:underline">{p.members} {p.members === 1 ? "member" : "members"}</Link><span>·</span><span>{p.tasks} tasks</span><span>·</span><span>{p.notes} notes</span><span>·</span><span>{p.files} files</span><span>·</span>
                  <span>{p.links} links</span><span>·</span><span>{p.credentials} creds</span><span>·</span><span>{p.builds} builds</span>
                </div>
                <div className="flex gap-1.5 md:ml-2">
                  <Link href={`/projects/${p.id}`} className={buttonStyles({ variant: "secondary", size: "sm" })}><ExternalLink className="size-3.5" /> Open</Link>
                  <Button size="sm" variant="secondary" onClick={() => setTarget(p)} className="text-coral"><Trash2 className="size-3.5" /> Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-muted">
            <span>{offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}</span>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" aria-label="Previous page" disabled={offset === 0} onClick={() => setOffset(offset - PAGE_SIZE)}><ChevronLeft className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Next page" disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}><ChevronRight className="size-4" /></Button>
            </div>
          </div>
        )}
      </Card>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-faint"><ExternalLink className="size-3" /> Admins manage projects here; content inside is private to its members. <Link href="/admin/audit" className="text-accent hover:underline">Every deletion is audited.</Link></p>

      <ConfirmDialog
        open={target !== null}
        onClose={() => setTarget(null)}
        onConfirm={remove}
        loading={deleting}
        title={`Delete ${target?.name ?? "project"}?`}
        description={`Permanently removes the project owned by ${target?.owner_email ?? "its owner"} with all ${target?.tasks ?? 0} tasks, ${target?.notes ?? 0} notes, ${target?.files ?? 0} files, ${target?.credentials ?? 0} credentials and ${target?.builds ?? 0} builds. This is recorded in the audit log.`}
        confirmLabel="Delete project"
        variant="danger"
      />
    </>
  );
}
