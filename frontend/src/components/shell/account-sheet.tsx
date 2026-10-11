"use client";

import Link from "next/link";
import { ChevronRight, LogOut, Moon, Settings, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme/use-theme";
import { useSignOut } from "@/hooks/use-sign-out";
import { useProfile } from "@/lib/auth/profile-context";
import { displayName } from "@/lib/auth/types";
import { UserAvatar } from "./user-avatar";

/** Mobile account sheet, styled like an iOS settings group. */
export function AccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile } = useProfile();
  const { theme, setTheme } = useTheme();
  const { signOut, signingOut } = useSignOut();
  const name = displayName(profile);

  const row = "flex items-center gap-3 px-4 py-3.5 text-[15px]";

  return (
    <Modal open={open} onClose={onClose} title="Account">
      <div className="mb-4 flex items-center gap-3.5">
        <UserAvatar name={name} src={profile.avatar_url} className="size-14 text-lg" />
        <div className="min-w-0">
          <p className="truncate font-sans text-base font-semibold tracking-tight text-ink">{name}</p>
          <p className="truncate text-xs text-muted">{profile.email}</p>
          {profile.role === "admin" && <Badge tone="iris" className="mt-1">Admin</Badge>}
        </div>
      </div>

      <div className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-2">
        <Link href="/settings" onClick={onClose} className={row}>
          <Settings className="size-5 text-muted" />
          <span className="flex-1">Settings</span>
          <ChevronRight className="size-4 text-faint" />
        </Link>
        {profile.role === "admin" && (
          <Link href="/admin" onClick={onClose} className={row}>
            <ShieldCheck className="size-5 text-muted" />
            <span className="flex-1">Admin panel</span>
            <ChevronRight className="size-4 text-faint" />
          </Link>
        )}
        <div className={row}>
          <Moon className="size-5 text-muted" />
          <span className="flex-1">Dark theme</span>
          <Switch label="Dark theme" checked={theme === "dark"} onCheckedChange={(on) => setTheme(on ? "dark" : "light")} />
        </div>
      </div>

      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[var(--radius-card)] border border-line bg-surface-2 py-3.5 text-[15px] font-semibold text-coral active:bg-raised"
      >
        <LogOut className="size-5" /> {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </Modal>
  );
}
