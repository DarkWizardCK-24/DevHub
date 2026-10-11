"use client";

import { Eye, EyeOff, KeyRound, Pencil, Plus, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { VaultIllustration } from "@/components/illustrations";
import { PageHeader } from "@/components/shell/page-header";
import { ProjectBadge } from "@/components/shared/project-badge";
import { ProjectSelect } from "@/components/shared/project-select";
import { ActionMenu } from "@/components/ui/action-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton, copyToClipboard } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { TextAreaField, TextField } from "@/components/ui/field";
import { FilterChips } from "@/components/ui/filter-chips";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { Modal } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { SelectField } from "@/components/ui/select-field";
import { Spinner } from "@/components/ui/spinner";
import { ViewToggle } from "@/components/ui/view-toggle";
import { refresh, useApi } from "@/hooks/use-api";
import { useConfirm } from "@/hooks/use-confirm";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useViewMode } from "@/hooks/use-view-mode";
import { api, errorMessage } from "@/lib/api/client";
import { CREDENTIAL_TYPE, ENVIRONMENT, options } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import type { Credential, CredentialType, Environment, RevealedSecret } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

const REVEAL_SECONDS = 30;

export type VaultKind = "accounts" | "env";

/** The vault is two lists over one table: logins for people/accounts, and env secrets. */
const KIND = {
  accounts: {
    title: "Credential vault",
    description: "Logins by account: name, role, email and password. Encrypted at rest and masked until you ask.",
    add: "Add account",
    types: ["login", "test_account", "other"] as CredentialType[],
    defaultType: "login" as CredentialType,
    nameLabel: "Account name",
    namePlaceholder: "e.g. Priya Sharma (QA)",
    identifierLabel: "Email or username",
    identifierHint: "Not secret. Shown in clear so you can copy it.",
    identifierPlaceholder: "priya@example.com",
    secretLabel: "Password",
    notesLabel: "Other details",
    notesHint: "Also encrypted: security answers, 2FA backup codes, anything else.",
    empty: "No accounts stored yet",
    emptyHint: "Store admin, tester and service logins for this project.",
  },
  env: {
    title: "Env vault",
    description: "Environment secrets: API keys, variables and connection strings, encrypted and masked.",
    add: "Add secret",
    types: ["env_variable", "api_key", "database", "service", "other"] as CredentialType[],
    defaultType: "env_variable" as CredentialType,
    nameLabel: "Name",
    namePlaceholder: "e.g. Stripe secret key",
    identifierLabel: "Variable name",
    identifierHint: "Not secret: the env var name, e.g. STRIPE_SECRET_KEY.",
    identifierPlaceholder: "STRIPE_SECRET_KEY",
    secretLabel: "Value",
    notesLabel: "Notes",
    notesHint: "Also encrypted. Where it's used, rotation notes…",
    empty: "No secrets stored yet",
    emptyHint: "Keep API keys, tokens and connection strings out of chat and sticky notes.",
  },
} as const;

const schema = z.object({
  name: z.string().trim().min(1, "Give it a name").max(120),
  type: z.enum(["api_key", "env_variable", "test_account", "service", "database", "login", "other"]),
  environment: z.enum(["development", "staging", "production", "other"]),
  identifier: z.string().max(255),
  account_role: z.string().trim().max(80),
  url: z.union([z.literal(""), z.string().trim().url("Enter a full URL")]),
  secret: z.string().max(10_000),
  notes: z.string().max(5_000),
  project_id: z.string(),
});
type Values = z.infer<typeof schema>;

/**
 * Create/edit form. When editing, the secret field starts EMPTY: the current
 * value is never sent to the browser just to prefill a form. Leave it empty
 * to keep the existing secret, or type a new one to rotate it.
 */
function CredentialForm({ kind, credential, projectId, onClose }: { kind: VaultKind; credential?: Credential; projectId?: string; onClose: () => void }) {
  const copy = KIND[kind];
  const editing = Boolean(credential);
  const typeOptions = options(CREDENTIAL_TYPE).filter((o) => (copy.types as readonly string[]).includes(o.value));
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: credential?.name ?? "",
      type: credential?.type ?? copy.defaultType,
      environment: credential?.environment ?? "development",
      identifier: credential?.identifier ?? "",
      account_role: credential?.account_role ?? "",
      url: credential?.url ?? "",
      secret: "",
      notes: "",
      project_id: credential?.project_id ?? projectId ?? "",
    },
  });

  async function onSubmit(values: Values) {
    if (!editing && !values.secret) return setError("secret", { message: `Enter the ${copy.secretLabel.toLowerCase()}` });
    const payload: Record<string, unknown> = {
      name: values.name,
      type: values.type,
      environment: values.environment,
      identifier: values.identifier.trim() || null,
      account_role: kind === "accounts" ? values.account_role || null : null,
      url: values.url || null,
      project_id: values.project_id || null,
    };
    if (values.secret) payload.secret = values.secret;
    if (values.notes) payload.notes = values.notes;
    try {
      if (editing) await api.patch(`/credentials/${credential!.id}`, payload);
      else await api.post("/credentials", payload);
      toast.success(editing ? (values.secret ? "Secret rotated" : "Saved") : "Stored securely");
      await refresh("/credentials", "/projects", "/activity");
      onClose();
    } catch (error) {
      toast.error(editing ? "Not saved" : "Not stored", { description: errorMessage(error) });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate autoComplete="off" className="space-y-4">
      <TextField label={copy.nameLabel} autoFocus={!editing} placeholder={copy.namePlaceholder} error={errors.name?.message} {...register("name")} />
      {kind === "accounts" && (
        <TextField label="Role" hint="What this account is for: Administrator, QA tester, Customer…" placeholder="Administrator" error={errors.account_role?.message} {...register("account_role")} />
      )}
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Type" options={typeOptions} {...register("type")} />
        <SelectField label="Environment" options={options(ENVIRONMENT)} {...register("environment")} />
      </div>
      <TextField label={copy.identifierLabel} hint={copy.identifierHint} placeholder={copy.identifierPlaceholder} error={errors.identifier?.message} {...register("identifier")} />
      <TextField
        label={editing ? `New ${copy.secretLabel.toLowerCase()}` : copy.secretLabel}
        type="password"
        autoComplete="new-password"
        hint={editing ? "Leave empty to keep the current one." : "Encrypted before it's stored. Never logged."}
        error={errors.secret?.message}
        {...register("secret")}
      />
      <TextAreaField
        label={editing ? `Replace ${copy.notesLabel.toLowerCase()}` : copy.notesLabel}
        rows={2}
        hint={editing && credential?.has_notes ? "Existing details are kept unless you type new ones." : copy.notesHint}
        error={errors.notes?.message}
        {...register("notes")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="URL" type="url" placeholder="Login page or dashboard" error={errors.url?.message} {...register("url")} />
        <ProjectSelect {...register("project_id")} />
      </div>
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} className="h-12 sm:h-10">Cancel</Button>
        <Button type="submit" loading={isSubmitting} className="h-12 sm:h-10">{editing ? "Save changes" : "Store securely"}</Button>
      </div>
    </form>
  );
}

/** Masked value; reveals for 30 seconds on request, then hides itself. */
function SecretValue({ credential, label, className }: { credential: Credential; label: string; className?: string }) {
  const [revealed, setRevealed] = useState<RevealedSecret | null>(null);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!revealed) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRevealed(null);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [revealed]);

  async function reveal(): Promise<RevealedSecret | null> {
    setLoading(true);
    try {
      const data = await api.post<RevealedSecret>(`/credentials/${credential.id}/reveal`);
      setRevealed(data);
      setSecondsLeft(REVEAL_SECONDS);
      refresh("/credentials", "/activity");
      return data;
    } catch (error) {
      toast.error("Couldn't reveal it", { description: errorMessage(error) });
      return null;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("rounded-[var(--radius-control)] border border-line bg-surface-2", className)}>
      <div className="flex items-center gap-2 px-3 py-1.5">
        <code className="min-w-0 flex-1 truncate font-mono text-[13px]">{revealed ? revealed.secret : "•".repeat(14)}</code>
        {revealed && <span className="text-[11px] tabular-nums text-faint">{secondsLeft}s</span>}
        {loading ? (
          <Spinner size="sm" />
        ) : (
          <button
            type="button"
            onClick={() => (revealed ? setRevealed(null) : reveal())}
            aria-label={revealed ? `Hide ${label}` : `Reveal ${label}`}
            className="grid size-8 place-items-center rounded-lg text-faint hover:bg-raised hover:text-ink"
          >
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
        <CopyButton label={`Copy ${label}`} toastLabel={`${label} copied`} text={async () => revealed?.secret ?? (await reveal())?.secret ?? ""} />
      </div>
      {revealed?.notes && <p className="border-t border-line px-3 py-2 text-xs whitespace-pre-wrap text-muted">{revealed.notes}</p>}
    </div>
  );
}

function Identifier({ credential }: { credential: Credential }) {
  if (!credential.identifier) return null;
  return (
    <button type="button" onClick={() => copyToClipboard(credential.identifier!, "Copied")} className="max-w-full truncate font-mono text-xs text-muted hover:text-ink" title="Click to copy">
      {credential.identifier}
    </button>
  );
}

function Avatar({ credential, kind }: { credential: Credential; kind: VaultKind }) {
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl border text-[12px] font-semibold", kind === "accounts" ? "border-iris/20 bg-iris-soft text-iris" : "border-accent/20 bg-accent-soft text-accent")}>
      {kind === "accounts" ? initials(credential.name) || <UserRound className="size-4" /> : <KeyRound className="size-4" />}
    </span>
  );
}

export function VaultView({ projectId, openNew = false, kind = "accounts", hideHeader = false }: { projectId?: string; openNew?: boolean; kind?: VaultKind; hideHeader?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const copy = KIND[kind];
  const embedded = Boolean(projectId);
  const [mode, setMode] = useViewMode(`vault-${kind}`, "list");
  const [environment, setEnvironment] = useState<"" | Environment>("");
  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query.trim());
  const [form, setForm] = useState<{ credential?: Credential } | null>(openNew ? {} : null);
  const [confirm, confirmDialog] = useConfirm();

  const { data, error, isLoading, mutate } = useApi<Credential[]>("/credentials", { project_id: projectId, environment: environment || undefined, kind, q });

  const closeForm = () => {
    setForm(null);
    if (openNew) router.replace(pathname);
  };

  const menu = (credential: Credential) => (
    <ActionMenu
      items={[
        { label: "Edit or rotate", icon: Pencil, onSelect: () => setForm({ credential }) },
        {
          label: "Delete",
          icon: Trash2,
          danger: true,
          onSelect: () =>
            confirm({
              title: "Delete this entry?",
              description: `"${credential.name}" will be permanently destroyed. Make sure you don't still need it.`,
              confirmLabel: "Delete",
              successMessage: "Deleted",
              action: async () => {
                await api.delete(`/credentials/${credential.id}`);
                await refresh("/credentials", "/projects", "/activity");
              },
            }),
        },
      ]}
    />
  );

  const title = (credential: Credential) => (
    <div className="flex flex-wrap items-center gap-2">
      <p className="font-sans text-sm font-semibold tracking-tight text-ink">{credential.name}</p>
      {kind === "accounts" && credential.account_role && <Badge tone="iris">{credential.account_role}</Badge>}
      <Badge tone={ENVIRONMENT[credential.environment].tone}>{ENVIRONMENT[credential.environment].label}</Badge>
    </div>
  );

  const filtered = Boolean(q || environment);

  return (
    <>
      {!embedded && !hideHeader && (
        <PageHeader title={copy.title} description={copy.description} actions={<Button onClick={() => setForm({})} className="w-full md:w-auto"><Plus className="size-4" /> {copy.add}</Button>} />
      )}
      {!embedded && !hideHeader && (
        <div className="mb-4 flex items-start gap-3 rounded-[var(--radius-card)] border border-mint/25 bg-mint-soft/60 p-3.5 text-sm">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-mint" />
          <p className="text-muted">Secrets are encrypted by the API before reaching the database, are only visible to you, and are never written to logs.</p>
        </div>
      )}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterChips label="Environment" value={environment} onChange={setEnvironment} options={[{ value: "" as const, label: "All" }, ...options(ENVIRONMENT)]} />
        <div className="flex gap-2">
          <SearchInput value={query} onValueChange={setQuery} placeholder={kind === "accounts" ? "Search name, role, email" : "Search name or variable"} className="min-w-0 flex-1 md:w-60" />
          <ViewToggle value={mode} onChange={setMode} />
          {(embedded || hideHeader) && <Button onClick={() => setForm({})}><Plus className="size-4" /> <span className="hidden sm:inline">{copy.add}</span><span className="sm:hidden">Add</span></Button>}
        </div>
      </div>

      {isLoading && !data ? (
        <Card><ListSkeleton /></Card>
      ) : error ? (
        <Card><ErrorState title="Vault didn't load" message={error.message} onRetry={() => mutate()} /></Card>
      ) : data && data.length === 0 ? (
        <Card>
          <EmptyState
            illustration={<VaultIllustration />}
            title={filtered ? "Nothing matches" : copy.empty}
            description={filtered ? "Try another environment or search." : copy.emptyHint}
            action={!filtered ? <Button onClick={() => setForm({})}><Plus className="size-4" /> {copy.add}</Button> : undefined}
          />
        </Card>
      ) : mode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data?.map((credential) => (
            <Card key={credential.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start gap-3">
                <Avatar credential={credential} kind={kind} />
                <div className="min-w-0 flex-1">
                  {title(credential)}
                  <div className="mt-1 flex min-w-0 flex-col gap-0.5">
                    <Identifier credential={credential} />
                    {!embedded && <ProjectBadge project={credential.project} asLink={false} />}
                  </div>
                </div>
                {menu(credential)}
              </div>
              <SecretValue credential={credential} label={copy.secretLabel.toLowerCase()} />
              <p className="text-xs text-faint">{credential.last_revealed_at ? `Revealed ${timeAgo(credential.last_revealed_at)}` : "Never revealed"} · {CREDENTIAL_TYPE[credential.type]}</p>
            </Card>
          ))}
        </div>
      ) : mode === "compact" ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-xs text-faint">
              <tr>
                <th className="px-4 py-2.5 font-medium">{kind === "accounts" ? "Account" : "Name"}</th>
                {kind === "accounts" && <th className="px-2 py-2.5 font-medium">Role</th>}
                <th className="px-2 py-2.5 font-medium">{copy.identifierLabel}</th>
                <th className="px-2 py-2.5 font-medium">Env</th>
                <th className="w-64 px-2 py-2.5 font-medium">{copy.secretLabel}</th>
                <th className="w-10 px-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data?.map((credential) => (
                <tr key={credential.id} className="align-middle transition-colors hover:bg-surface-2/50">
                  <td className="px-4 py-2">
                    <p className="font-medium">{credential.name}</p>
                    {!embedded && <ProjectBadge project={credential.project} asLink={false} />}
                  </td>
                  {kind === "accounts" && <td className="px-2 py-2 text-muted">{credential.account_role ?? "–"}</td>}
                  <td className="max-w-48 px-2 py-2"><Identifier credential={credential} /></td>
                  <td className="px-2 py-2"><Badge tone={ENVIRONMENT[credential.environment].tone}>{ENVIRONMENT[credential.environment].label}</Badge></td>
                  <td className="px-2 py-1.5"><SecretValue credential={credential} label={copy.secretLabel.toLowerCase()} /></td>
                  <td className="px-2 py-2">{menu(credential)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {data?.map((credential) => (
              <li key={credential.id} className="px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <Avatar credential={credential} kind={kind} />
                  <div className="min-w-0 flex-1">
                    {title(credential)}
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-faint">
                      <Identifier credential={credential} />
                      {!embedded && <ProjectBadge project={credential.project} asLink={false} />}
                      <span>{CREDENTIAL_TYPE[credential.type]}</span>
                      <span>{credential.last_revealed_at ? `Revealed ${timeAgo(credential.last_revealed_at)}` : "Never revealed"}</span>
                    </div>
                    <SecretValue credential={credential} label={copy.secretLabel.toLowerCase()} className="mt-2" />
                  </div>
                  {menu(credential)}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal open={form !== null} onClose={closeForm} title={form?.credential ? `Edit ${kind === "accounts" ? "account" : "secret"}` : copy.add}>
        {form && <CredentialForm kind={kind} credential={form.credential} projectId={projectId} onClose={closeForm} />}
      </Modal>
      {confirmDialog}
    </>
  );
}
