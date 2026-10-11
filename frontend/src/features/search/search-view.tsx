"use client";

import Link from "next/link";
import { CodeXml, FileText, FolderKanban, Link2, ListChecks, Package, Paperclip, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FilterChips } from "@/components/ui/filter-chips";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { SearchInput } from "@/components/ui/search-input";
import { useApi } from "@/hooks/use-api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { SearchEntity, SearchResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPES: Record<SearchEntity, { label: string; icon: typeof Search; tone: string; href: (r: SearchResult) => string }> = {
  project: { label: "Project", icon: FolderKanban, tone: "bg-iris-soft text-iris", href: (r) => `/projects/${r.id}` },
  task: { label: "Task", icon: ListChecks, tone: "bg-accent-soft text-accent", href: (r) => `/tasks?task=${r.id}` },
  note: { label: "Note", icon: FileText, tone: "bg-sky-soft text-sky", href: (r) => `/notes/${r.id}` },
  snippet: { label: "Snippet", icon: CodeXml, tone: "bg-mint-soft text-mint", href: (r) => `/snippets?snippet=${r.id}` },
  file: { label: "File", icon: Paperclip, tone: "bg-sky-soft text-sky", href: (r) => (r.project_id ? `/projects/${r.project_id}?tab=files` : "/files") },
  link: { label: "Link", icon: Link2, tone: "bg-raised text-ink", href: (r) => (r.project_id ? `/projects/${r.project_id}?tab=links` : "/links") },
  build: { label: "Build", icon: Package, tone: "bg-accent-soft text-accent", href: (r) => (r.project_id ? `/projects/${r.project_id}?tab=builds` : "/builds") },
};

export function SearchView({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<"" | SearchEntity>("");
  const q = useDebouncedValue(query.trim(), 250);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => input.current?.focus(), []);

  const { data, error, isLoading, mutate } = useApi<{ query: string; results: SearchResult[] }>(q ? "/search" : null, { q, types: type ? [type] : undefined, limit_per_type: 10 });
  const results = data?.results ?? [];

  const counts = results.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.type]: (acc[r.type] ?? 0) + 1 }), {});

  return (
    <>
      <PageHeader title="Search" description="Projects, tasks, notes, snippets, files, links and builds." />
      <SearchInput ref={input} value={query} onValueChange={setQuery} placeholder="Search everything…" className="mb-4 [&_input]:h-12 [&_input]:text-base" />
      {q && (
        <div className="mb-4">
          <FilterChips
            label="Result type"
            value={type}
            onChange={setType}
            options={[{ value: "" as const, label: "All" }, ...(Object.keys(TYPES) as SearchEntity[]).map((t) => ({ value: t, label: TYPES[t].label, count: type ? undefined : counts[t] }))]}
          />
        </div>
      )}

      <Card className="overflow-hidden">
        {!q ? (
          <EmptyState title="Find anything" description="Start typing. Partial words work: “kube” finds “Kubernetes”." />
        ) : isLoading && !data ? (
          <ListSkeleton rows={4} />
        ) : error ? (
          <ErrorState title="Search failed" message={error.message} onRetry={() => mutate()} />
        ) : results.length === 0 ? (
          <EmptyState title="No results" description={`Nothing matches “${q}”. Try fewer or different words.`} />
        ) : (
          <ul className="divide-y divide-line">
            {results.map((result) => {
              const meta = TYPES[result.type];
              const Icon = meta.icon;
              return (
                <li key={`${result.type}-${result.id}`}>
                  <Link href={meta.href(result)} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", meta.tone)}>
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{result.title}</p>
                      <div className="flex items-center gap-2 text-xs text-faint">
                        <span className="font-medium text-muted">{meta.label}</span>
                        {result.subtitle && <span className="truncate">{result.subtitle.replaceAll("_", " ")}</span>}
                        {result.project_name && result.type !== "project" && (
                          <span className="flex items-center gap-1 truncate">
                            <span className="size-1.5 rounded-full" style={{ backgroundColor: result.project_color ?? undefined }} />
                            {result.project_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
