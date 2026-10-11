"use client";

import { KeyRound, ShieldCheck, UsersRound } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/shell/page-header";
import { cn } from "@/lib/utils";
import { VaultView, type VaultKind } from "./vault-view";

const TABS: { kind: VaultKind; label: string; icon: typeof KeyRound; blurb: string }[] = [
  { kind: "accounts", label: "Credential vault", icon: UsersRound, blurb: "Logins by account: name, role, email and password." },
  { kind: "env", label: "Env vault", icon: KeyRound, blurb: "API keys, variables and connection strings." },
];

/** The two vaults behind one switch: account logins, and environment secrets. */
export function VaultHub({ projectId, openNew = false, initialKind = "accounts" }: { projectId?: string; openNew?: boolean; initialKind?: VaultKind }) {
  const [kind, setKind] = useState<VaultKind>(initialKind);
  const embedded = Boolean(projectId);

  return (
    <>
      {!embedded && (
        <>
          <PageHeader title="Vault" description="Account logins and environment secrets, encrypted at rest and masked until you ask." />
          <div className="mb-4 flex items-start gap-3 rounded-[var(--radius-card)] border border-mint/25 bg-mint-soft/60 p-3.5 text-sm">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-mint" />
            <p className="text-muted">Secrets are encrypted by the API before reaching the database, are only visible to you, and are never written to logs.</p>
          </div>
        </>
      )}
      <div role="tablist" aria-label="Vault" className="mb-4 grid max-w-xl grid-cols-2 gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.kind === kind;
          return (
            <button
              key={tab.kind}
              role="tab"
              aria-selected={active}
              onClick={() => setKind(tab.kind)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                active ? "border-accent/40 bg-accent-soft/60 shadow-card" : "border-line/70 bg-surface hover:border-line-strong",
              )}
            >
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", active ? "bg-accent text-accent-ink" : "bg-raised text-muted")}><Icon className="size-4" /></span>
              <span className="min-w-0">
                <span className={cn("block text-sm font-medium", active && "text-accent")}>{tab.label}</span>
                <span className="block truncate text-xs text-muted">{tab.blurb}</span>
              </span>
            </button>
          );
        })}
      </div>
      <VaultView key={kind} kind={kind} projectId={projectId} openNew={openNew && kind === initialKind} hideHeader />
    </>
  );
}
