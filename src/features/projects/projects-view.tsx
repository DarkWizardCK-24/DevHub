"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FolderIllustration } from "@/components/illustrations";
import { PageHeader } from "@/components/shell/page-header";
import { useAssignThumbnails } from "@/components/shared/project-thumbnail";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FilterChips } from "@/components/ui/filter-chips";
import { CardGridSkeleton } from "@/components/ui/list-skeleton";
import { SearchInput } from "@/components/ui/search-input";
import { ViewToggle } from "@/components/ui/view-toggle";
import { useApi } from "@/hooks/use-api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useViewMode } from "@/hooks/use-view-mode";
import type { Page, Project, ProjectStatus } from "@/lib/types";
import { ProjectCard } from "./project-card";
import { ProjectForm } from "./project-form";
import { ProjectRow, ProjectTable } from "./project-row";

type StatusFilter = "active" | ProjectStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "active", label: "All active" },
  { value: "in_progress", label: "In progress" },
  { value: "planning", label: "Planning" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export function ProjectsView({ openNew = false }: { openNew?: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusFilter>("active");
  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query.trim());
  const [formOpen, setFormOpen] = useState(openNew);
  const [view, setView] = useViewMode("projects", "grid");

  const { data, error, isLoading, mutate } = useApi<Page<Project>>("/projects", {
    status: status === "active" ? undefined : status,
    q,
    limit: 200,
  });
  useAssignThumbnails(data?.items); // each project gets its own unique, permanent thumbnail

  return (
    <>
      <PageHeader
        title="Projects"
        description="Open a project for its pulse, timeline, board, notes, files, links, vault and builds."
        actions={
          <Button onClick={() => setFormOpen(true)} className="w-full md:w-auto">
            <Plus className="size-4" /> New project
          </Button>
        }
      />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips label="Filter by status" value={status} onChange={setStatus} options={FILTERS} />
        <div className="flex items-center gap-2">
          <SearchInput value={query} onValueChange={setQuery} placeholder="Search projects" className="flex-1 lg:w-72 lg:flex-none" />
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {isLoading && !data ? (
        <CardGridSkeleton />
      ) : error ? (
        <Card>
          <ErrorState title="Projects didn't load" message={error.message} onRetry={() => mutate()} />
        </Card>
      ) : data && data.items.length === 0 ? (
        <Card>
          <EmptyState
            illustration={<FolderIllustration />}
            title={q || status !== "active" ? "No matching projects" : "Start your first project"}
            description={q || status !== "active" ? "Try another filter or search term." : "A project groups everything about one thing you're building."}
            action={!q && status === "active" ? <Button onClick={() => setFormOpen(true)}><Plus className="size-4" /> New project</Button> : undefined}
          />
        </Card>
      ) : (
        view === "grid" ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {data?.items.map((project) => <ProjectCard key={project.id} project={project} />)}
          </div>
        ) : view === "list" ? (
          <div className="space-y-3">{data?.items.map((project) => <ProjectRow key={project.id} project={project} />)}</div>
        ) : (
          <ProjectTable projects={data?.items ?? []} />
        )
      )}

      <ProjectForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          if (openNew) router.replace("/projects");
        }}
        onSaved={(project) => router.push(`/projects/${project.id}`)}
      />
    </>
  );
}
