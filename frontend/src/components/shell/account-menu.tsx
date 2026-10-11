"use client";

import Link from "next/link";
import { LogOut, Settings, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useSignOut } from "@/hooks/use-sign-out";
import { useProfile } from "@/lib/auth/profile-context";
import { displayName } from "@/lib/auth/types";
import { UserAvatar } from "./user-avatar";

/** Desktop avatar dropdown: identity, settings, admin (if allowed), sign out. */
export function AccountMenu() {
  const { profile } = useProfile();
  const { signOut, signingOut } = useSignOut();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const name = displayName(profile);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => !ref.current?.contains(event.target as Node) && setOpen(false);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemClass = "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-surface-2 transition-colors";

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu" aria-label="Account menu" className="rounded-full ring-2 ring-transparent transition-all hover:ring-accent/40">
        <UserAvatar name={name} src={profile.avatar_url} className="size-8 text-xs" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 z-50 mt-2 w-60 origin-top-right rounded-xl border border-line/80 bg-surface p-1.5 shadow-pop"
          >
            <div className="flex items-center gap-2.5 px-2.5 py-2">
              <UserAvatar name={name} src={profile.avatar_url} className="size-8 text-xs" />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold tracking-tight text-ink">{name}</p>
                <p className="truncate text-[11px] text-muted">{profile.email}</p>
              </div>
            </div>
            {profile.role === "admin" && (
              <div className="px-2.5 pb-2">
                <Badge tone="iris">Admin</Badge>
              </div>
            )}
            <div className="my-1 h-px bg-line" />
            <Link href="/settings" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
              <Settings className="size-4 text-muted" /> Settings
            </Link>
            {profile.role === "admin" && (
              <Link href="/admin" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
                <ShieldCheck className="size-4 text-muted" /> Admin panel
              </Link>
            )}
            <div className="my-1 h-px bg-line" />
            <button type="button" role="menuitem" className={`${itemClass} text-coral`} onClick={signOut} disabled={signingOut}>
              <LogOut className="size-4" /> {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
