"use client";

import { Crown, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shell/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { Modal } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { SelectField } from "@/components/ui/select-field";
import { refresh, useApi } from "@/hooks/use-api";
import { useConfirm } from "@/hooks/use-confirm";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api, errorMessage } from "@/lib/api/client";
import { useProfile } from "@/lib/auth/profile-context";
import type { Profile } from "@/lib/auth/types";
import { timeAgo } from "@/lib/format";
import type { MemberRole, ProjectMember } from "@/lib/types";

const ROLE_OPTIONS = [
  { value: "editor", label: "Editor: can change content" },
  { value: "viewer", label: "Viewer: read only" },
];

const ROLE_TONE: Record<MemberRole, "accent" | "sky" | "neutral"> = { owner: "accent", editor: "sky", viewer: "neutral" };

/** Compact stack of the first few members; used on the overview. */
export function TeamAvatars({ members, max = 5 }: { members: ProjectMember[]; max?: number }) {
  const shown = members.slice(0, max);
  return (
    <div className="flex -space-x-2">
      {shown.map((m) => <UserAvatar key={m.user_id} name={m.full_name || m.email} src={m.avatar_url} className="size-8 text-[11px] ring-2 ring-surface" />)}
      {members.length > max && <span className="grid size-8 place-items-center rounded-full bg-raised text-[11px] font-medium text-muted ring-2 ring-surface">+{members.length - max}</span>}
    </div>
  );
}

function AddMemberDialog({ projectId, existing, open, onClose }: { projectId: string; existing: Set<string>; open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query.trim());
  const [role, setRole] = useState("editor");
  const [busy, setBusy] = useState<string | null>(null);
  const { data, error, isLoading } = useApi<{ items: Profile[] }>(open ? "/admin/users" : null, { q, limit: 50 });

  async function add(user: Profile) {
    setBusy(user.id);
    try {
      await api.post(`/projects/${projectId}/members`, { user_id: user.id, role });
      toast.success("Added to the project", { description: user.full_name || user.email });
      await refresh(`/projects/${projectId}`, "/activity", "/admin/projects");
      onClose();
    } catch (err) {
      toast.error("Couldn't add that user", { description: errorMessage(err) });
    } finally {
      setBusy(null);
    }
  }

  const candidates = (data?.items ?? []).filter((u) => u.is_active && !existing.has(u.id));

  return (
    <Modal open={open} onClose={onClose} title="Add to project" description="Pick a user and the access they should have.">
      <div className="space-y-3">
        <div className="flex gap-2">
          <SearchInput value={query} onValueChange={setQuery} placeholder="Search by name or email" className="flex-1" />
          <SelectField aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)} options={ROLE_OPTIONS} className="w-52" />
        </div>
        {error ? (
          <p className="text-sm text-coral">{error.message}</p>
        ) : isLoading && !data ? (
          <ListSkeleton rows={3} />
        ) : candidates.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{q ? "No matching users." : "Everyone is already on this project."}</p>
        ) : (
          <ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-xl border border-line">
            {candidates.map((user) => (
              <li key={user.id} className="flex items-center gap-3 px-3 py-2.5">
                <UserAvatar name={user.full_name || user.email} src={user.avatar_url} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.full_name || user.email}</p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
                <Button size="sm" loading={busy === user.id} disabled={busy !== null} onClick={() => add(user)}>
                  <UserPlus className="size-3.5" /> Add
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

/** Who is working on the project. Everyone on it can see the team; admins manage it. */
export function ProjectTeam({ projectId }: { projectId: string }) {
  const { profile } = useProfile();
  const isAdmin = profile.role === "admin";
  const [adding, setAdding] = useState(false);
  const [confirm, confirmDialog] = useConfirm();
  const { data, error, isLoading, mutate } = useApi<ProjectMember[]>(`/projects/${projectId}/members`);

  async function changeRole(member: ProjectMember, role: string) {
    try {
      await api.patch(`/projects/${projectId}/members/${member.user_id}`, { role });
      toast.success("Role updated", { description: member.full_name || member.email });
      await mutate();
      refresh("/activity");
    } catch (err) {
      toast.error("Couldn't change the role", { description: errorMessage(err) });
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Team"
          icon={<Users />}
          action={isAdmin ? <Button size="sm" onClick={() => setAdding(true)}><UserPlus className="size-3.5" /> Add member</Button> : undefined}
        />
        {isLoading && !data ? (
          <ListSkeleton rows={3} />
        ) : error ? (
          <ErrorState title="Team didn't load" message={error.message} onRetry={() => mutate()} />
        ) : !data?.length ? (
          <EmptyState title="No one here yet" description="Admins can add people to this project." />
        ) : (
          <ul className="divide-y divide-line px-5 pb-2">
            {data.map((member) => (
              <li key={member.user_id} className="flex flex-wrap items-center gap-3 py-3">
                <UserAvatar name={member.full_name || member.email} src={member.avatar_url} className="size-10" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                    {member.full_name || member.email}
                    {member.role === "owner" && <Crown className="size-3.5 text-amber" aria-label="Owner" />}
                    {!member.is_active && <Badge tone="neutral">Deactivated</Badge>}
                  </p>
                  <p className="truncate text-xs text-muted">{member.email} · joined {timeAgo(member.joined_at)}</p>
                </div>
                {isAdmin && member.role !== "owner" ? (
                  <>
                    <SelectField aria-label={`Role for ${member.full_name || member.email}`} value={member.role} onChange={(e) => changeRole(member, e.target.value)} options={ROLE_OPTIONS} className="w-52" />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove from project"
                      className="text-coral"
                      onClick={() =>
                        confirm({
                          title: `Remove ${member.full_name || member.email}?`,
                          description: "They lose access to this project's tasks, notes, files, links and builds. Their own work stays.",
                          confirmLabel: "Remove",
                          successMessage: "Removed from the project",
                          action: async () => {
                            await api.delete(`/projects/${projectId}/members/${member.user_id}`);
                            await refresh(`/projects/${projectId}`, "/activity", "/admin/projects");
                          },
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                ) : (
                  <Badge tone={ROLE_TONE[member.role]}>{member.role === "owner" ? "Owner" : member.role === "editor" ? "Editor" : "Viewer"}</Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
      {!isAdmin && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-faint"><ShieldCheck className="size-3.5" /> Only admins can add or remove people.</p>
      )}
      <AddMemberDialog projectId={projectId} existing={new Set((data ?? []).map((m) => m.user_id))} open={adding} onClose={() => setAdding(false)} />
      {confirmDialog}
    </>
  );
}
