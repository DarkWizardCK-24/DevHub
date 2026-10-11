"use client";

import { ChevronDown, Download, RefreshCw, ShieldAlert } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SearchInput } from "@/components/ui/search-input";
import { SelectField } from "@/components/ui/select-field";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@/lib/api/client";
import type { AuditEntry, AuditPage, Page } from "@/lib/types";
import type { Profile } from "@/lib/auth/types";
import { cn } from "@/lib/utils";
import { describeActivity } from "@/features/activity/describe";

const MODULES = ["auth", "project", "task", "note", "snippet", "file", "link", "credential", "build", "tag", "user", "member"];

const VERB_TONE: Record<string, Tone> = {
  created: "mint",
  added: "mint",
  uploaded: "mint",
  login: "sky",
  logout: "neutral",
  updated: "accent",
  completed: "mint",
  reopened: "amber",
  revealed: "amber",
  rotated: "amber",
  password_reset: "amber",
  deleted: "coral",
};

const stamp = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });

function browser(ua: string | null) {
  if (!ua) return "unknown";
  const name = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : ua.slice(0, 24);
  const os = /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${name} on ${os}` : name;
}

function toCsv(items: AuditEntry[]) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["timestamp", "actor", "action", "entity_type", "entity", "project", "ip", "user_agent", "details"];
  const rows = items.map((e) => [e.created_at, e.actor?.email, e.action, e.entity_type, e.entity_label, e.project_name, e.ip, e.user_agent, JSON.stringify(e.metadata)].map(esc).join(","));
  return [head.join(","), ...rows].join("\n");
}

export function AuditLog() {
  const [module, setModule] = useState("");
  const [actor, setActor] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query.trim());
  const [users, setUsers] = useState<Profile[]>([]);
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [total24h, setTotal24h] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState<number | null>(null);

  const params = useMemo(
    () => ({ action: module || undefined, actor_id: actor || undefined, date_from: from || undefined, date_to: to || undefined, q: q || undefined, limit: 50 }),
    [module, actor, from, to, q],
  );

  useEffect(() => {
    api.get<Page<Profile>>("/admin/users", { limit: 100 }).then((p) => setUsers(p.items)).catch(() => undefined);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<AuditPage>("/admin/audit", params, controller.signal)
      .then((page) => {
        setItems(page.items);
        setCursor(page.next_before_id);
        setTotal24h(page.total_24h);
        setError(null);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setError(err.message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [params, reload]);

  // Any filter change starts a fresh query (shows the skeleton again).
  const setFilter = useCallback(<T,>(setter: (v: T) => void) => (v: T) => { setLoading(true); setter(v); }, []);

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    try {
      const page = await api.get<AuditPage>("/admin/audit", { ...params, before_id: cursor });
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.next_before_id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    const url = URL.createObjectURL(new Blob([toCsv(items)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `devhub-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[repeat(5,minmax(0,1fr))_auto]">
        <SelectField aria-label="Module" placeholder="All modules" value={module} onChange={(e) => setFilter(setModule)(e.target.value)} options={MODULES.map((m) => ({ value: m, label: m[0].toUpperCase() + m.slice(1) }))} />
        <SelectField aria-label="User" placeholder="All users" value={actor} onChange={(e) => setFilter(setActor)(e.target.value)} options={users.map((u) => ({ value: u.id, label: u.full_name || u.email }))} />
        <input type="date" aria-label="From date" value={from} onChange={(e) => setFilter(setFrom)(e.target.value)} className="h-10 rounded-[var(--radius-control)] border border-line bg-surface px-3 text-[13px] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15" />
        <input type="date" aria-label="To date" value={to} onChange={(e) => setFilter(setTo)(e.target.value)} className="h-10 rounded-[var(--radius-control)] border border-line bg-surface px-3 text-[13px] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15" />
        <SearchInput value={query} onValueChange={(v) => setFilter(setQuery)(v)} placeholder="Search by item name" />
        <div className="flex gap-2">
          <Button variant="secondary" size="icon" aria-label="Refresh" onClick={() => { setLoading(true); setReload((n) => n + 1); }}>
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
          <Button variant="secondary" onClick={exportCsv} disabled={items.length === 0}>
            <Download className="size-4" /> CSV
          </Button>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs text-muted">
        <ShieldAlert className="size-3.5 text-iris" />
        {total24h} events in the last 24 hours. Entries are append-only and never contain secret values.
      </div>

      <Card className="overflow-hidden">
        {error ? (
          <ErrorState title="Audit log didn't load" message={error} onRetry={() => { setLoading(true); setReload((n) => n + 1); }} />
        ) : loading && items.length === 0 ? (
          <ul className="divide-y divide-line">
            {Array.from({ length: 8 }, (_, i) => (
              <li key={i} className="flex items-center gap-4 p-4"><Skeleton className="h-4 w-40" /><Skeleton className="h-4 flex-1" /></li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <EmptyState title="No matching events" description="Try widening the date range or clearing a filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2/50 text-[11px] tracking-[0.12em] text-faint uppercase">
                  <th className="px-4 py-2.5 font-medium">When</th>
                  <th className="px-4 py-2.5 font-medium">User</th>
                  <th className="px-4 py-2.5 font-medium">Action</th>
                  <th className="px-4 py-2.5 font-medium">Item</th>
                  <th className="px-4 py-2.5 font-medium">From</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className={cn("divide-y divide-line/70", loading && "opacity-60")}>
                {items.map((e) => {
                  const verb = e.action.split(".")[1] ?? "";
                  const expanded = open === e.id;
                  return (
                    <Fragment key={e.id}>
                      <tr className="cursor-pointer align-top transition-colors hover:bg-surface-2/50" onClick={() => setOpen(expanded ? null : e.id)}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <time dateTime={e.created_at} className="text-[13px] tabular-nums">{stamp(e.created_at)}</time>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[13px]">{e.actor?.name || e.actor?.email.split("@")[0] || "System"}</p>
                          <p className="text-[11px] text-faint">{e.actor?.email}</p>
                        </td>
                        <td className="px-4 py-3"><Badge tone={VERB_TONE[verb] ?? "neutral"}>{e.action}</Badge></td>
                        <td className="max-w-[260px] px-4 py-3">
                          <p className="truncate text-[13px]">{e.entity_label ?? "—"}</p>
                          <p className="truncate text-[11px] text-faint">{e.project_name ? `${e.project_name} · ` : ""}{e.entity_type}</p>
                        </td>
                        <td className="px-4 py-3 text-[12px] whitespace-nowrap text-muted">
                          <p className="tabular-nums">{e.ip ?? "—"}</p>
                          <p className="text-[11px] text-faint">{browser(e.user_agent)}</p>
                        </td>
                        <td className="pr-3"><ChevronDown className={cn("size-4 text-faint transition-transform", expanded && "rotate-180")} /></td>
                      </tr>
                      {expanded && (
                        <tr className="bg-surface-2/40">
                          <td colSpan={6} className="px-4 py-3 text-xs">
                            <p className="mb-2 text-muted">{describeActivity({ ...e, actor_name: e.actor?.name ?? null, project: null })}</p>
                            <pre className="overflow-x-auto rounded-xl bg-surface p-3 font-mono text-[11px] leading-relaxed text-muted">
                              {JSON.stringify({ id: e.id, entity_id: e.entity_id, user_agent: e.user_agent, ...e.metadata }, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {cursor && (
          <div className="border-t border-line p-3 text-center">
            <Button variant="ghost" onClick={loadMore} loading={loading}>Load older events</Button>
          </div>
        )}
      </Card>
    </>
  );
}
