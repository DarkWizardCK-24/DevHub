"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { ADMIN_NAV_ITEM, NAV_SECTIONS, isActive, type NavItem } from "@/config/navigation";
import { useProfile } from "@/lib/auth/profile-context";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

export function SidebarLink({ item, active, layoutId = "sidebar-active" }: { item: NavItem; active: boolean; layoutId?: string }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-9 items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 text-[13px] font-normal tracking-tight transition-colors",
        active ? "text-accent font-medium" : "text-muted hover:bg-surface-2 hover:text-ink",
      )}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-[var(--radius-control)] bg-accent-soft"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <Icon className={cn("relative size-4 transition-colors", active ? "text-accent" : "text-muted group-hover:text-ink")} />
      <span className="relative flex-1 truncate">{item.label}</span>
      {active && <span className="relative size-1.5 rounded-full bg-accent" aria-hidden />}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useProfile();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col border-r border-line/60 bg-surface/60 backdrop-blur-xl md:flex">
      <div className="flex h-15 items-center px-4.5">
        <Link href="/dashboard" aria-label="DevHub home" className="transition-opacity hover:opacity-90">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-2 scrollbar-none" aria-label="Main">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="mb-1 px-2.5 text-[10px] font-medium tracking-[0.14em] text-faint uppercase">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} />
              ))}
            </div>
          </div>
        ))}
        {profile.role === "admin" && (
          <div className="border-t border-line/60 pt-3">
            <SidebarLink item={ADMIN_NAV_ITEM} active={isActive(pathname, ADMIN_NAV_ITEM.href)} />
          </div>
        )}
      </nav>

      {/* Subtle workspace footer status */}
      <div className="border-t border-line/60 p-3">
        <div className="flex items-center gap-2 rounded-lg bg-surface/50 border border-line/40 px-2.5 py-1.5 text-xs text-muted">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-mint" />
          </span>
          <span className="truncate text-[11px] font-medium">Workspace synced</span>
        </div>
      </div>
    </aside>
  );
}
