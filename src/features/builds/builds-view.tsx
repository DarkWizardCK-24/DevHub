"use client";

import { CheckCircle2, Download, GitBranch, Pencil, Plus, Trash2, Upload, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { RocketIllustration } from "@/components/illustrations";
import { PageHeader } from "@/components/shell/page-header";
import { ProjectBadge } from "@/components/shared/project-badge";
import { ProjectSelect } from "@/components/shared/project-select";
import { ActionMenu } from "@/components/ui/action-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { TextAreaField, TextField } from "@/components/ui/field";
import { FilterChips } from "@/components/ui/filter-chips";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { Markdown } from "@/components/ui/markdown";
import { Modal } from "@/components/ui/modal";
import { SelectField } from "@/components/ui/select-field";
import { ViewToggle } from "@/components/ui/view-toggle";
import { Spinner } from "@/components/ui/spinner";
import { refresh, useApi } from "@/hooks/use-api";
import { useConfirm } from "@/hooks/use-confirm";
import { useViewMode } from "@/hooks/use-view-mode";
import { ApiError, api, errorMessage } from "@/lib/api/client";
import { BUILD_STATUS, PLATFORM, options } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import type { Build, BuildStatus, Page } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { openFile } from "../files/file-actions";

const schema = z.object({
  project_id: z.string().min(1, "Choose a project"),
  platform: z.enum(["android", "ios", "web", "windows", "macos", "linux", "other"]),
  version: z.string().trim().min(1, "Version is required").max(50),
  build_number: z.union([z.literal(""), z.coerce.number().int().min(0)]),
  branch: z.string().trim().max(255),
  commit_sha: z.union([z.literal(""), z.string().trim().regex(/^[0-9a-fA-F]{7,40}$/, "7 to 40 hex characters")]),
  status: z.enum(["building", "successful", "failed", "cancelled"]),
  release_notes: z.string().max(20000),
});
type FormInput = z.input<typeof schema>;
type Values = z.output<typeof schema>;

function BuildForm({ build, projectId, onClose }: { build?: Build; projectId?: string; onClose: () => void }) {
  const editing = Boolean(build);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormInput, unknown, Values>({
    resolver: zodResolver(schema),
    values: {
      project_id: build?.project_id ?? projectId ?? "",
      platform: build?.platform ?? "android",
      version: build?.version ?? "",
      build_number: build?.build_number ?? "",
      branch: build?.branch ?? "",
      commit_sha: build?.commit_sha ?? "",
      status: build?.status ?? "building",
      release_notes: build?.release_notes ?? "",
    },
  });

  async function onSubmit(values: Values) {
    const payload = {
      ...values,
      build_number: values.build_number === "" ? null : values.build_number,
      branch: values.branch || null,
      commit_sha: values.commit_sha || null,
      release_notes: values.release_notes.trim() || null,
    };
    try {
      if (editing) {
        // A build can't move between projects, so project_id isn't sent on edit.
        await api.patch(`/builds/${build!.id}`, { ...payload, project_id: undefined });
      } else {
        await api.post("/builds", payload);
      }
      toast.success(editing ? "Build saved" : "Build recorded");
      await refresh("/builds", "/dashboard", "/projects", "/activity");
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) return setError("build_number", { message: error.message });
      toast.error(editing ? "Build not saved" : "Build not recorded", { description: errorMessage(error) });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {!editing && <ProjectSelect noneLabel="Choose a project" error={errors.project_id?.message} {...register("project_id")} />}
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Platform" options={options(PLATFORM)} {...register("platform")} />
        <SelectField label="Status" options={options(BUILD_STATUS)} {...register("status")} />
        <TextField label="Version" placeholder="1.4.0" error={errors.version?.message} {...register("version")} />
        <TextField label="Build number" type="number" inputMode="numeric" placeholder="42" error={errors.build_number?.message} {...register("build_number")} />
        <TextField label="Branch" placeholder="main" error={errors.branch?.message} {...register("branch")} />
        <TextField label="Commit SHA" placeholder="a1b2c3d" className="font-mono" error={errors.commit_sha?.message} {...register("commit_sha")} />
      </div>
      <TextAreaField label="Release notes" rows={5} placeholder="What changed? (Markdown)" error={errors.release_notes?.message} {...register("release_notes")} />
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} className="h-12 sm:h-10">Cancel</Button>
        <Button type="submit" loading={isSubmitting} className="h-12 sm:h-10">{editing ? "Save build" : "Record build"}</Button>
      </div>
    </form>
  );
}

function ArtifactCell({ build }: { build: Build }) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  async function upload(file: File) {
    const form = new FormData();
    form.append("file", file);
    setProgress(0);
    try {
      await api.upload(`/builds/${build.id}/artifact`, form, setProgress);
      toast.success("Artifact uploaded");
      await refresh("/builds", "/files");
    } catch (error) {
      toast.error("Artifact not uploaded", { description: errorMessage(error) });
    } finally {
      setProgress(null);
    }
  }

  return (
    <>
      {progress !== null ? (
        <span className="flex items-center gap-2 text-xs text-muted"><Spinner size="sm" /> {progress}%</span>
      ) : build.artifact ? (
        <button type="button" onClick={() => openFile(build.artifact!.id, { download: true })} className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline">
          <Download className="size-3.5" /> {build.artifact.name} <span className="text-faint">({formatBytes(build.artifact.size_bytes)})</span>
        </button>
      ) : (
        <button type="button" onClick={() => input.current?.click()} className="flex items-center gap-1.5 text-xs text-muted hover:text-ink">
          <Upload className="size-3.5" /> Attach artifact
        </button>
      )}
      <input ref={input} type="file" hidden onChange={(e) => e.target.files?.[0] && (upload(e.target.files[0]), (e.target.value = ""))} />
    </>
  );
}

export function BuildsView({ projectId, openNew = false }: { projectId?: string; openNew?: boolean }) {
  const embedded = Boolean(projectId);
  const [status, setStatus] = useState<"" | BuildStatus>("");
  const [form, setForm] = useState<{ build?: Build } | null>(openNew ? {} : null);
  const [notes, setNotes] = useState<Build | null>(null);
  const [view, setView] = useViewMode("builds", "list");
  const [confirm, confirmDialog] = useConfirm();
  const { data, error, isLoading, mutate } = useApi<Page<Build>>("/builds", { project_id: projectId, status: status || undefined, limit: 100 });

  async function setBuildStatus(build: Build, next: BuildStatus) {
    try {
      await api.patch(`/builds/${build.id}`, { status: next });
      toast.success(`Marked ${BUILD_STATUS[next].label.toLowerCase()}`);
      await refresh("/builds", "/dashboard", "/activity");
    } catch (err) {
      toast.error("Status not changed", { description: errorMessage(err) });
    }
  }

  const rowMenu = (build: Build) => (
    <ActionMenu
                    items={[
                      { label: "Mark successful", icon: CheckCircle2, onSelect: () => setBuildStatus(build, "successful"), hidden: build.status === "successful" },
                      { label: "Mark failed", icon: XCircle, onSelect: () => setBuildStatus(build, "failed"), hidden: build.status === "failed" },
                      { label: "Edit", icon: Pencil, onSelect: () => setForm({ build }) },
                      {
                        label: "Delete",
                        icon: Trash2,
                        danger: true,
                        onSelect: () =>
                          confirm({
                            title: "Delete this build?",
                            description: `${PLATFORM[build.platform]} v${build.version}${build.artifact ? " and its artifact" : ""} will be permanently deleted.`,
                            confirmLabel: "Delete build",
                            successMessage: "Build deleted",
                            action: async () => {
                              await api.delete(`/builds/${build.id}`);
                              await refresh("/builds", "/files", "/dashboard");
                            },
                          }),
                      },
                    ]}
                  />
  );

  return (
    <>
      {!embedded && (
        <PageHeader
          title="Builds"
          description="Every release: version, commit, status and artifact."
          actions={<Button onClick={() => setForm({})} className="w-full md:w-auto"><Plus className="size-4" /> Record build</Button>}
        />
      )}
      <div className="mb-4 flex items-center justify-between gap-3">
        <FilterChips label="Status" value={status} onChange={setStatus} options={[{ value: "" as const, label: "All" }, ...options(BUILD_STATUS)]} />
        <div className="flex shrink-0 items-center gap-2">
          <ViewToggle value={view} onChange={setView} />
          {embedded && <Button onClick={() => setForm({})} className="shrink-0"><Plus className="size-4" /> Record</Button>}
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading && !data ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState title="Builds didn't load" message={error.message} onRetry={() => mutate()} />
        ) : data && data.items.length === 0 ? (
          <EmptyState
            illustration={<RocketIllustration />}
            title={status ? "No builds with this status" : "No builds recorded"}
            description={status ? "Try another status." : "Log each release so you know what shipped, from which commit."}
            action={!status ? <Button onClick={() => setForm({})}><Plus className="size-4" /> Record build</Button> : undefined}
          />
        ) : view === "compact" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] tracking-wide text-faint uppercase">
                  <th className="px-4 py-2.5 font-medium">Version</th>
                  <th className="px-3 py-2.5 font-medium">Platform</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Date</th>
                  <th className="px-3 py-2.5 font-medium">Commit</th>
                  <th className="w-10 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {data?.items.map((build) => (
                  <tr key={build.id} className="transition-colors hover:bg-surface-2/60">
                    <td className="px-4 py-2 font-mono font-medium text-ink">
                      v{build.version}{build.build_number !== null && <span className="text-xs text-muted"> ({build.build_number})</span>}
                      {!embedded && <span className="ml-2 font-sans text-xs font-normal text-faint">{build.project.name}</span>}
                    </td>
                    <td className="px-3 py-2 text-muted">{PLATFORM[build.platform]}</td>
                    <td className="px-3 py-2"><Badge tone={BUILD_STATUS[build.status].tone} dot>{BUILD_STATUS[build.status].label}</Badge></td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap text-muted">{timeAgo(build.created_at)}</td>
                    <td className="px-3 py-2 font-mono text-xs text-muted">{build.commit_sha ? build.commit_sha.slice(0, 7) : "–"}</td>
                    <td className="px-3 py-2 text-right">{rowMenu(build)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : view === "grid" ? (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {data?.items.map((build) => (
              <div key={build.id} className="flex flex-col rounded-2xl border border-line/70 bg-surface-2/40 p-4 transition-colors hover:border-line-strong">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted">{PLATFORM[build.platform]}</p>
                    <p className="font-mono text-lg font-medium tracking-tight text-ink">
                      v{build.version}{build.build_number !== null && <span className="text-xs text-muted"> ({build.build_number})</span>}
                    </p>
                  </div>
                  {rowMenu(build)}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone={BUILD_STATUS[build.status].tone} dot>{BUILD_STATUS[build.status].label}</Badge>
                  <span className="text-xs text-faint">{timeAgo(build.created_at)}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
                  {!embedded && <ProjectBadge project={build.project} />}
                  {build.branch && <span className="flex items-center gap-1"><GitBranch className="size-3" />{build.branch}</span>}
                  {build.commit_sha && <span className="font-mono">{build.commit_sha.slice(0, 7)}</span>}
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-4 pt-3">
                  <ArtifactCell build={build} />
                  {build.release_notes && <button type="button" onClick={() => setNotes(build)} className="text-xs text-muted hover:text-ink">Release notes</button>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {data?.items.map((build) => (
              <li key={build.id} className="px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-sans text-sm font-semibold tracking-tight text-ink">
                        {PLATFORM[build.platform]} <span className="font-mono font-medium">v{build.version}</span>
                        {build.build_number !== null && <span className="font-mono text-xs text-muted"> ({build.build_number})</span>}
                      </p>
                      <Badge tone={BUILD_STATUS[build.status].tone} dot>{BUILD_STATUS[build.status].label}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
                      {!embedded && <ProjectBadge project={build.project} />}
                      {build.branch && <span className="flex items-center gap-1"><GitBranch className="size-3" />{build.branch}</span>}
                      {build.commit_sha && (
                        <span className="flex items-center gap-0.5 font-mono">
                          {build.commit_sha.slice(0, 7)}
                          <CopyButton text={build.commit_sha} label="Copy commit SHA" toastLabel="SHA copied" className="size-6" />
                        </span>
                      )}
                      <span>{timeAgo(build.created_at)}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4">
                      <ArtifactCell build={build} />
                      {build.release_notes && (
                        <button type="button" onClick={() => setNotes(build)} className="text-xs text-muted hover:text-ink">Release notes</button>
                      )}
                    </div>
                  </div>
                  {build.status === "building" && (
                    <div className="hidden gap-1 sm:flex">
                      <Button size="sm" variant="secondary" onClick={() => setBuildStatus(build, "successful")}><CheckCircle2 className="size-3.5 text-mint" /> Success</Button>
                      <Button size="sm" variant="secondary" onClick={() => setBuildStatus(build, "failed")}><XCircle className="size-3.5 text-coral" /> Failed</Button>
                    </div>
                  )}
                  {rowMenu(build)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={form !== null} onClose={() => setForm(null)} title={form?.build ? "Edit build" : "Record build"} className="md:max-w-xl">
        {form && <BuildForm build={form.build} projectId={projectId} onClose={() => setForm(null)} />}
      </Modal>
      <Modal open={notes !== null} onClose={() => setNotes(null)} title={notes ? `${PLATFORM[notes.platform]} v${notes.version}` : ""} description="Release notes" className="md:max-w-2xl">
        {notes?.release_notes && <Markdown content={notes.release_notes} />}
      </Modal>
      {confirmDialog}
    </>
  );
}
