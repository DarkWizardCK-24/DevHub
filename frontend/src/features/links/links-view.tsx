"use client";

import {
  BookOpen,
  Database,
  ExternalLink,
  Flame,
  FlaskConical,
  GitBranch,
  Globe,
  Link2,
  MonitorPlay,
  PenTool,
  Pencil,
  Pin,
  Plus,
  Trash2,
  Triangle,
  Webhook,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { TimelineIllustration } from "@/components/illustrations";
import { PageHeader } from "@/components/shell/page-header";
import { ProjectBadge } from "@/components/shared/project-badge";
import { ProjectSelect } from "@/components/shared/project-select";
import { ActionMenu } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { TextField } from "@/components/ui/field";
import { CardGridSkeleton } from "@/components/ui/list-skeleton";
import { Modal } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { SelectField } from "@/components/ui/select-field";
import { ViewToggle } from "@/components/ui/view-toggle";
import { refresh, useApi } from "@/hooks/use-api";
import { useConfirm } from "@/hooks/use-confirm";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useViewMode } from "@/hooks/use-view-mode";
import { api, errorMessage } from "@/lib/api/client";
import { LINK_TYPE, options } from "@/lib/constants";
import type { LinkItem, LinkType, Page } from "@/lib/types";
import { cn } from "@/lib/utils";

export const LINK_ICON: Record<LinkType, typeof Link2> = {
  github: GitBranch,
  supabase: Database,
  firebase: Flame,
  vercel: Triangle,
  figma: PenTool,
  documentation: BookOpen,
  api: Webhook,
  demo: MonitorPlay,
  production: Globe,
  staging: FlaskConical,
  other: Link2,
};

/** Guess the type from the URL so the form fills itself in. */
function guessType(url: string): LinkType | null {
  const rules: [RegExp, LinkType][] = [
    [/github\.com|gitlab\.com|bitbucket\.org/, "github"],
    [/supabase\.(co|com)/, "supabase"],
    [/firebase|console\.cloud\.google/, "firebase"],
    [/vercel\.(com|app)/, "vercel"],
    [/figma\.com/, "figma"],
    [/docs?\.|readthedocs|\/docs/, "documentation"],
    [/staging|\.dev\.|preview/, "staging"],
    [/api\.|\/api/, "api"],
  ];
  return rules.find(([re]) => re.test(url))?.[1] ?? null;
}

const schema = z.object({
  name: z.string().trim().min(1, "Give the link a name").max(120),
  url: z.string().trim().url("Enter a full URL starting with https://").refine((u) => /^https?:\/\//i.test(u), "Only http(s) links"),
  type: z.enum(["github", "supabase", "firebase", "vercel", "figma", "documentation", "api", "demo", "production", "staging", "other"]),
  description: z.string().max(1000),
  project_id: z.string(),
  is_pinned: z.boolean(),
});
type Values = z.infer<typeof schema>;

function LinkForm({ link, projectId, onClose }: { link?: LinkItem; projectId?: string; onClose: () => void }) {
  const editing = Boolean(link);
  const { register, handleSubmit, setValue, getValues, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: link?.name ?? "",
      url: link?.url ?? "",
      type: link?.type ?? "other",
      description: link?.description ?? "",
      project_id: link?.project_id ?? projectId ?? "",
      is_pinned: link?.is_pinned ?? false,
    },
  });

  async function onSubmit(values: Values) {
    const payload = { ...values, description: values.description.trim() || null, project_id: values.project_id || null };
    try {
      if (editing) await api.patch(`/links/${link!.id}`, payload);
      else await api.post("/links", payload);
      toast.success(editing ? "Link saved" : "Link added");
      await refresh("/links", "/projects", "/activity");
      onClose();
    } catch (error) {
      toast.error(editing ? "Link not saved" : "Link not added", { description: errorMessage(error) });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <TextField
        label="URL"
        type="url"
        inputMode="url"
        autoFocus={!editing}
        placeholder="https://"
        error={errors.url?.message}
        {...register("url", {
          onBlur: (e) => {
            const guessed = guessType(e.target.value);
            if (guessed && getValues("type") === "other") setValue("type", guessed);
          },
        })}
      />
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <TextField label="Name" placeholder="e.g. Production dashboard" error={errors.name?.message} {...register("name")} />
        <SelectField label="Type" options={options(LINK_TYPE)} {...register("type")} />
      </div>
      <TextField label="Description" placeholder="Optional" error={errors.description?.message} {...register("description")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <ProjectSelect {...register("project_id")} />
        <label className="flex items-center gap-2.5 self-end pb-2.5 text-sm">
          <input type="checkbox" className="size-4 accent-[var(--accent)]" {...register("is_pinned")} /> Pin to top
        </label>
      </div>
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} className="h-12 sm:h-10">Cancel</Button>
        <Button type="submit" loading={isSubmitting} className="h-12 sm:h-10">{editing ? "Save link" : "Add link"}</Button>
      </div>
    </form>
  );
}

export function LinksView({ projectId, openNew = false }: { projectId?: string; openNew?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const embedded = Boolean(projectId);
  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query.trim());
  const [type, setType] = useState<"" | LinkType>("");
  const [form, setForm] = useState<{ link?: LinkItem } | null>(openNew ? {} : null);
  const [confirm, confirmDialog] = useConfirm();
  const [view, setView] = useViewMode("links", "grid");

  const { data, error, isLoading, mutate } = useApi<Page<LinkItem>>("/links", { project_id: projectId, type: type || undefined, q, limit: 200 });

  const hostOf = (url: string) => {
    try {
      return new URL(url).host;
    } catch {
      return url;
    }
  };

  const actions = (link: LinkItem) => (
    <>
      <CopyButton text={link.url} label="Copy URL" toastLabel="URL copied" />
      <ActionMenu
        items={[
          { label: "Edit", icon: Pencil, onSelect: () => setForm({ link }) },
          {
            label: "Delete",
            icon: Trash2,
            danger: true,
            onSelect: () =>
              confirm({
                title: "Delete this link?",
                description: `"${link.name}" will be removed.`,
                confirmLabel: "Delete link",
                successMessage: "Link deleted",
                action: async () => {
                  await api.delete(`/links/${link.id}`);
                  await refresh("/links", "/projects");
                },
              }),
          },
        ]}
      />
    </>
  );

  return (
    <>
      {!embedded && (
        <PageHeader
          title="Links"
          description="Repos, dashboards, docs and environments in one place."
          actions={<Button onClick={() => setForm({})} className="w-full md:w-auto"><Plus className="size-4" /> Add link</Button>}
        />
      )}
      <div className="mb-5 flex gap-2">
        <SearchInput value={query} onValueChange={setQuery} placeholder="Search links" className="flex-1 md:max-w-sm" />
        <SelectField aria-label="Filter by type" placeholder="All types" value={type} onChange={(e) => setType(e.target.value as "" | LinkType)} options={options(LINK_TYPE)} className="w-36" />
        <ViewToggle value={view} onChange={setView} />
        {embedded && <Button onClick={() => setForm({})}><Plus className="size-4" /> Add</Button>}
      </div>

      {isLoading && !data ? (
        <CardGridSkeleton />
      ) : error ? (
        <Card><ErrorState title="Links didn't load" message={error.message} onRetry={() => mutate()} /></Card>
      ) : data && data.items.length === 0 ? (
        <Card>
          <EmptyState
            illustration={<TimelineIllustration />}
            title={q || type ? "No matching links" : "No links yet"}
            description={q || type ? "Try another search or type." : "Save the dashboards and URLs you open every day."}
            action={!q && !type ? <Button onClick={() => setForm({})}><Plus className="size-4" /> Add link</Button> : undefined}
          />
        </Card>
      ) : (
        view === "grid" ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data?.items.map((link) => {
              const Icon = LINK_ICON[link.type];
              return (
                <Card key={link.id} className="group flex items-start gap-3 p-4 border-line/80 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-sm">
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", link.type === "production" ? "bg-coral-soft text-coral" : link.type === "staging" ? "bg-iris-soft text-iris" : "bg-raised text-ink")}>
                    <Icon className="size-4.5" />
                  </span>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {link.is_pinned && <Pin className="size-3 shrink-0 fill-accent text-accent" aria-label="Pinned" />}
                      <p className="truncate font-sans text-sm font-semibold tracking-tight text-ink transition-colors group-hover:text-accent">{link.name}</p>
                      <ExternalLink className="size-3 shrink-0 text-faint" />
                    </div>
                    <p className="truncate font-mono text-[11px] text-faint">{hostOf(link.url)}</p>
                    {link.description && <p className="mt-1 line-clamp-2 text-xs text-muted">{link.description}</p>}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-md border border-line/60 bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">{LINK_TYPE[link.type]}</span>
                      {!embedded && <ProjectBadge project={link.project} asLink={false} />}
                    </div>
                  </a>
                  <div className="flex flex-col items-center">{actions(link)}</div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {data?.items.map((link) => {
                const Icon = LINK_ICON[link.type];
                const compact = view === "compact";
                return (
                  <li key={link.id} className={cn("group flex items-center gap-3 px-4", compact ? "py-1.5" : "py-3")}>
                    <span className={cn("grid shrink-0 place-items-center rounded-lg", compact ? "size-6" : "size-9 rounded-xl", link.type === "production" ? "bg-coral-soft text-coral" : link.type === "staging" ? "bg-iris-soft text-iris" : "bg-raised text-ink")}>
                      <Icon className={compact ? "size-3.5" : "size-4.5"} />
                    </span>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {link.is_pinned && <Pin className="size-3 shrink-0 fill-accent text-accent" aria-label="Pinned" />}
                        <p className="truncate text-sm font-medium text-ink transition-colors group-hover:text-accent">{link.name}</p>
                        {!compact && <span className="shrink-0 rounded-md border border-line/60 bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">{LINK_TYPE[link.type]}</span>}
                      </div>
                      {!compact && (
                        <p className="truncate text-xs text-faint">
                          <span className="font-mono">{hostOf(link.url)}</span>
                          {link.description && <span className="text-muted"> · {link.description}</span>}
                        </p>
                      )}
                    </a>
                    {compact && <span className="hidden w-28 shrink-0 truncate text-xs text-muted sm:block">{LINK_TYPE[link.type]}</span>}
                    {compact && <span className="hidden w-44 shrink-0 truncate font-mono text-[11px] text-faint md:block">{hostOf(link.url)}</span>}
                    {!embedded && <span className="hidden w-36 shrink-0 truncate lg:block"><ProjectBadge project={link.project} asLink={false} /></span>}
                    <div className="flex shrink-0 items-center">{actions(link)}</div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )
      )}

      <Modal
        open={form !== null}
        onClose={() => {
          setForm(null);
          if (openNew) router.replace(pathname);
        }}
        title={form?.link ? "Edit link" : "Add link"}
      >
        {form && (
          <LinkForm
            link={form.link}
            projectId={projectId}
            onClose={() => {
              setForm(null);
              if (openNew) router.replace(pathname);
            }}
          />
        )}
      </Modal>
      {confirmDialog}
    </>
  );
}
