"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEM, MOBILE_TABS, NAV_SECTIONS, isActive } from "@/config/navigation";
import { Modal } from "@/components/ui/modal";
import { useProfile } from "@/lib/auth/profile-context";
import { cn } from "@/lib/utils";

export function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { profile } = useProfile();
  const pinned = new Set(MOBILE_TABS.map((tab) => tab.href));
  const items = NAV_SECTIONS.flatMap((section) => section.items).filter((item) => !pinned.has(item.href));
  if (profile.role === "admin") items.push(ADMIN_NAV_ITEM);

  return (
    <Modal open={open} onClose={onClose} title="More">
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex flex-col items-center gap-2 rounded-[var(--radius-card)] border px-2 py-4 text-center transition-colors",
                active ? "border-accent/40 bg-accent-soft" : "border-line bg-surface-2 active:bg-raised",
              )}
            >
              <span className={cn("grid size-10 place-items-center rounded-xl", active ? "bg-accent text-accent-ink" : "bg-raised text-ink")}>
                <Icon className="size-5" />
              </span>
              <span className="text-xs font-medium tracking-tight text-ink">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </Modal>
  );
}
