"use client";

import { ChevronLeft, ChevronRight, KeyRound, Plus, Search, ShieldCheck, ShieldOff, UserCheck, UserX } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shell/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@/lib/api/client";
import { useProfile } from "@/lib/auth/profile-context";
import { displayName, type Profile } from "@/lib/auth/types";
import type { UserPage } from "../types";
import { CreateUserDialog, ResetPasswordDialog } from "./create-user-dialog";

const PAGE_SIZE = 20;

type PendingAction =
  | { kind: "role"; user: Profile; role: Profile["role"] }
  | { kind: "active"; user: Profile; isActive: boolean };

function describe(action: PendingAction) {
  const name = displayName(action.user);
  if (action.kind === "role") {
    return action.role === "admin"
      ? { title: `Make ${name} an admin?`, body: "Admins can manage every user and see system-wide stats.", label: "Make admin", variant: "primary" as const }
      : { title: `Remove admin access from ${name}?`, body: "They keep their account and data, but lose the admin panel.", label: "Remove admin", variant: "danger" as const }
  }
  return action.isActive
    ? { title: `Reactivate ${name}?`, body: "They'll be able to sign in and use DevHub again.", label: "Reactivate", variant: "primary" as const }
    : { title: `Deactivate ${name}?`, body: "They'll be blocked from the API immediately. Their data is kept, and you can reactivate them later.", label: "Deactivate", variant: "danger" as const };
}

export function UsersManager() {
  const { profile: me } = useProfile();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim());
  const [offset, setOffset] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  // The result remembers which request produced it. While the current key
  // differs from the result's key, a request is in flight, so "loading" is
  // derived rather than stored (no setState at the start of the effect).
  const [result, setResult] = useState<{ key: string; page?: UserPage; error?: string } | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<Profile | null>(null);

  const requestKey = `${debouncedQuery}|${offset}|${reloadToken}`;
  const loading = result?.key !== requestKey;
  const page = result?.page ?? null;
  const error = result?.key === requestKey ? (result.error ?? null) : null;

  useEffect(() => {
    // Abort the previous request when inputs change, so a slow old response
    // can't overwrite newer results.
    const controller = new AbortController();
    api
      .get<UserPage>("/admin/users", { q: debouncedQuery, limit: PAGE_SIZE, offset }, controller.signal)
      .then((data) => setResult({ key: requestKey, page: data }))
      .catch((err: Error) => {
        if (err.name !== "AbortError") setResult((prev) => ({ key: requestKey, page: prev?.page, error: err.message }));
      });
    return () => controller.abort();
  }, [debouncedQuery, offset, requestKey]);

  const updatePage = (updater: (current: UserPage) => UserPage) =>
    setResult((prev) => (prev?.page ? { ...prev, page: updater(prev.page) } : prev));

  async function confirm() {
    if (!pending) return;
    setSaving(true);
    try {
      const body = pending.kind === "role" ? { role: pending.role } : { is_active: pending.isActive };
      const updated = await api.patch<Profile>(`/admin/users/${pending.user.id}`, body);
      updatePage((current) => ({ ...current, items: current.items.map((u) => (u.id === updated.id ? updated : u)) }));
      toast.success(`${describe(pending).label}: done`, { description: updated.email });
      setPending(null);
    } catch (err) {
      toast.error("Change not saved", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  const copy = pending ? describe(pending) : null;
  const total = page?.total ?? 0;

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOffset(0); // a new search starts from the first page
            }}
            placeholder="Search by name or email"
            aria-label="Search users"
            className="h-10 w-full rounded-[var(--radius-control)] border border-line bg-surface pr-3 pl-10 text-sm placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
          />
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          New user
        </Button>
      </div>

      <Card className="overflow-hidden">
        {loading && !page && !error ? (
          <ul className="divide-y divide-line">
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </li>
            ))}
          </ul>
        ) : error ? (
          <ErrorState title="Users didn't load" message={error} onRetry={() => setReloadToken((n) => n + 1)} />
        ) : page && page.items.length === 0 ? (
          <EmptyState title="No matching users" description={debouncedQuery ? `Nobody matches "${debouncedQuery}".` : "No users yet. Create the first account."} />
        ) : (
          <ul className={`divide-y divide-line transition-opacity ${loading ? "opacity-60" : ""}`}>
            {page?.items.map((user) => {
              const isMe = user.id === me.id;
              return (
                <li key={user.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <UserAvatar name={displayName(user)} src={user.avatar_url} className="size-10" />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate text-sm font-semibold">
                        {displayName(user)}
                        {isMe && <span className="text-xs font-normal text-faint">(you)</span>}
                      </p>
                      <p className="truncate text-sm text-muted">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <Badge tone={user.role === "admin" ? "iris" : "neutral"}>{user.role === "admin" ? "Admin" : "User"}</Badge>
                    <Badge tone={user.is_active ? "mint" : "coral"} dot>
                      {user.is_active ? "Active" : "Deactivated"}
                    </Badge>
                    <span className="hidden text-xs text-faint lg:inline">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                    <div className="ml-auto flex gap-1.5 md:ml-2">
                      <Button size="sm" variant="secondary" onClick={() => setResetting(user)}>
                        <KeyRound className="size-3.5" />
                        Password
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isMe}
                        title={isMe ? "You can't change your own role" : undefined}
                        onClick={() => setPending({ kind: "role", user, role: user.role === "admin" ? "user" : "admin" })}
                      >
                        {user.role === "admin" ? <ShieldOff className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
                        {user.role === "admin" ? "Remove admin" : "Make admin"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isMe}
                        className={user.is_active ? "text-coral" : "text-mint"}
                        onClick={() => setPending({ kind: "active", user, isActive: !user.is_active })}
                      >
                        {user.is_active ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
                        {user.is_active ? "Deactivate" : "Reactivate"}
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-muted">
            <span>
              {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" aria-label="Previous page" disabled={offset === 0} onClick={() => setOffset(offset - PAGE_SIZE)}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button size="icon" variant="ghost" aria-label="Next page" disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <CreateUserDialog open={creating} onClose={() => setCreating(false)} onCreated={() => setReloadToken((n) => n + 1)} />
      <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />
      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={confirm}
        loading={saving}
        title={copy?.title ?? ""}
        description={copy?.body ?? ""}
        confirmLabel={copy?.label ?? ""}
        variant={copy?.variant}
      />
    </>
  );
}
