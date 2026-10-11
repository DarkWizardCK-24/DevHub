"use client";

import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { FolderIllustration } from "@/components/illustrations";
import { PageHeader } from "@/components/shell/page-header";
import { ProjectBadge } from "@/components/shared/project-badge";
import { TagChip } from "@/components/shared/tag-picker";
import { ActionMenu } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FilterChips } from "@/components/ui/filter-chips";
import { CardGridSkeleton } from "@/components/ui/list-skeleton";
import { Modal } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { ViewToggle } from "@/components/ui/view-toggle";
import { refresh, useApi } from "@/hooks/use-api";
import { useConfirm } from "@/hooks/use-confirm";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useViewMode } from "@/hooks/use-view-mode";
import { api } from "@/lib/api/client";
import { LANGUAGES } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import type { Language, Page, Snippet } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SnippetForm } from "./snippet-form";

type LangFilter = "" | Language | "favorites";

function LanguageDot({ language }: { language: Language }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
      <span className="size-2 rounded-full" style={{ backgroundColor: LANGUAGES[language].color }} aria-hidden />
      {LANGUAGES[language].label}
    </span>
  );
}

export function SnippetsView({ projectId, openNew = false, openSnippetId }: { projectId?: string; openNew?: boolean; openSnippetId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const embedded = Boolean(projectId);
  const [filter, setFilter] = useState<LangFilter>("");
  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query.trim());
  const [form, setForm] = useState<{ snippet?: Snippet } | null>(openNew ? {} : null);
  const [viewing, setViewing] = useState<Snippet | null>(null);
  const [confirm, confirmDialog] = useConfirm();
  const [view, setView] = useViewMode("snippets", "grid");

  const { data, error, isLoading, mutate } = useApi<Page<Snippet>>("/snippets", {
    project_id: projectId,
    language: filter && filter !== "favorites" ? filter : undefined,
    favorite: filter === "favorites" ? true : undefined,
    q: q || undefined,
    limit: 200,
  });

  const deepLinked = openSnippetId ? data?.items.find((s) => s.id === openSnippetId) : undefined;
  const shown = viewing ?? deepLinked ?? null;

  const toggleFavorite = async (snippet: Snippet) => {
    await mutate(
      async (page) => {
        const saved = await api.patch<Snippet>(`/snippets/${snippet.id}`, { is_favorite: !snippet.is_favorite });
        return page && { ...page, items: page.items.map((s) => (s.id === saved.id ? saved : s)) };
      },
      {
        optimisticData: (page) => ({ ...page!, items: page!.items.map((s) => (s.id === snippet.id ? { ...s, is_favorite: !s.is_favorite } : s)) }),
        rollbackOnError: true,
        revalidate: false,
      },
    );
  };

  const remove = (snippet: Snippet) =>
    confirm({
      title: "Delete this snippet?",
      description: `"${snippet.title}" will be permanently deleted.`,
      confirmLabel: "Delete snippet",
      successMessage: "Snippet deleted",
      action: async () => {
        await api.delete(`/snippets/${snippet.id}`);
        setViewing(null);
        await refresh("/snippets");
      },
    });

  const starButton = (snippet: Snippet) => (
    <button
      type="button"
      onClick={() => toggleFavorite(snippet)}
      aria-label={snippet.is_favorite ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={snippet.is_favorite}
      className="grid size-8 place-items-center rounded-lg hover:bg-raised"
    >
      <Star className={cn("size-4", snippet.is_favorite ? "fill-accent text-accent" : "text-faint")} />
    </button>
  );

  const menu = (snippet: Snippet) => (
    <ActionMenu
      items={[
        { label: "Edit", icon: Pencil, onSelect: () => setForm({ snippet }) },
        { label: "Delete", icon: Trash2, onSelect: () => remove(snippet), danger: true },
      ]}
    />
  );

  const filters: { value: LangFilter; label: string }[] = [
    { value: "", label: "All" },
    { value: "favorites", label: "★ Favorites" },
    ...(Object.keys(LANGUAGES) as Language[]).map((l) => ({ value: l, label: LANGUAGES[l].label })),
  ];

  return (
    <>
      {!embedded && (
        <PageHeader
          title="Snippets"
          description="Code you reach for again and again."
          actions={<Button onClick={() => setForm({})} className="w-full md:w-auto"><Plus className="size-4" /> New snippet</Button>}
        />
      )}
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex gap-2">
          <SearchInput value={query} onValueChange={setQuery} placeholder="Search titles and code" className="flex-1 md:max-w-sm" />
          <ViewToggle value={view} onChange={setView} />
          {embedded && <Button onClick={() => setForm({})}><Plus className="size-4" /> New snippet</Button>}
        </div>
        <FilterChips label="Language" value={filter} onChange={setFilter} options={filters} />
      </div>

      {isLoading && !data ? (
        <CardGridSkeleton />
      ) : error ? (
        <Card><ErrorState title="Snippets didn't load" message={error.message} onRetry={() => mutate()} /></Card>
      ) : data && data.items.length === 0 ? (
        <Card>
          <EmptyState
            illustration={<FolderIllustration />}
            title={query || filter ? "No matching snippets" : "Your snippet library is empty"}
            description={query || filter ? "Try another language or search." : "Save the code you keep looking up: hooks, queries, scripts, configs."}
            action={!query && !filter ? <Button onClick={() => setForm({})}><Plus className="size-4" /> New snippet</Button> : undefined}
          />
        </Card>
      ) : (
        view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {data?.items.map((snippet) => (
            <Card key={snippet.id} className="flex flex-col p-4 border-line/80 transition-all hover:border-line-strong hover:shadow-xs">
              <div className="flex items-start gap-2">
                <button type="button" onClick={() => setViewing(snippet)} className="min-w-0 flex-1 text-left">
                  <h3 className="truncate font-sans text-sm font-semibold tracking-tight text-ink transition-colors hover:text-accent">{snippet.title}</h3>
                  {snippet.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted">{snippet.description}</p>}
                </button>
                {starButton(snippet)}
                {menu(snippet)}
              </div>
              <CodeBlock code={snippet.code} language={snippet.language} maxLines={12} className="mt-3" />
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <LanguageDot language={snippet.language} />
                {!embedded && <ProjectBadge project={snippet.project} />}
                {snippet.tags.map((tag) => <TagChip key={tag.id} tag={tag} />)}
                <span className="ml-auto text-xs text-faint">{timeAgo(snippet.updated_at)}</span>
              </div>
            </Card>
          ))}
        </div>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {data?.items.map((snippet) => {
                const compact = view === "compact";
                return (
                  <li key={snippet.id} className={cn("flex items-center gap-3 px-4", compact ? "py-1" : "py-3")}>
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: LANGUAGES[snippet.language].color }} aria-hidden />
                    <button type="button" onClick={() => setViewing(snippet)} className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-medium text-ink hover:text-accent">{snippet.title}</p>
                      {!compact && (snippet.description || snippet.code) && (
                        <p className="truncate font-mono text-[11px] text-faint">{snippet.description || snippet.code.split("\n").find((l) => l.trim()) || ""}</p>
                      )}
                    </button>
                    <span className="hidden w-24 shrink-0 text-xs text-muted sm:block">{LANGUAGES[snippet.language].label}</span>
                    {!embedded && <span className="hidden w-36 shrink-0 truncate md:block"><ProjectBadge project={snippet.project} asLink={false} /></span>}
                    {!compact && <span className="hidden shrink-0 gap-1 lg:flex">{snippet.tags.slice(0, 2).map((tag) => <TagChip key={tag.id} tag={tag} />)}</span>}
                    <span className="hidden w-20 shrink-0 text-right text-xs text-faint sm:block">{timeAgo(snippet.updated_at)}</span>
                    {starButton(snippet)}
                    {menu(snippet)}
                  </li>
                );
              })}
            </ul>
          </Card>
        )
      )}

      <Modal
        open={shown !== null}
        onClose={() => {
          setViewing(null);
          if (openSnippetId) router.replace(pathname);
        }}
        title={shown?.title ?? ""}
        description={shown?.description ?? undefined}
        className="md:max-w-3xl"
      >
        {shown && (
          <div className="space-y-3">
            <CodeBlock code={shown.code} language={shown.language} />
            <div className="flex flex-wrap items-center gap-3">
              <LanguageDot language={shown.language} />
              <ProjectBadge project={shown.project} />
              {shown.tags.map((tag) => <TagChip key={tag.id} tag={tag} />)}
              <Button size="sm" variant="secondary" className="ml-auto" onClick={() => { setForm({ snippet: shown }); setViewing(null); }}>
                <Pencil className="size-3.5" /> Edit
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <SnippetForm
        open={form !== null}
        snippet={form?.snippet}
        projectId={projectId}
        onClose={() => {
          setForm(null);
          if (openNew) router.replace(pathname);
        }}
      />
      {confirmDialog}
    </>
  );
}
