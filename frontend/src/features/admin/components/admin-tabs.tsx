"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { ShieldCheck } from "lucide-react";
import { ADMIN_SECTIONS, isActive } from "@/config/navigation";
import { cn } from "@/lib/utils";

/** Segmented control for admin sections; works the same on mobile and desktop. */
export function AdminTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2 text-sm font-medium text-iris">
        <ShieldCheck className="size-4" /> Admin panel
      </div>
      <nav aria-label="Admin sections" className="flex rounded-[var(--radius-control)] border border-line bg-surface-2 p-1">
        {ADMIN_SECTIONS.map((item) => {
          const active = isActive(pathname, item.href, item.href === "/admin");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn("relative flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium md:flex-none", active ? "text-ink" : "text-muted")}
            >
              {active && <motion.span layoutId="admin-tab" className="absolute inset-0 rounded-lg bg-surface shadow-card" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
              <Icon className="relative size-4" />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
