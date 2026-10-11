"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Grip, Plus } from "lucide-react";
import { motion } from "motion/react";
import { MOBILE_TABS, NAV_SECTIONS, isActive, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { MoreSheet } from "./more-sheet";
import { QuickCreateSheet } from "./quick-create-sheet";

const tabClass = "relative flex flex-1 flex-col items-center justify-center gap-1 pt-2 pb-1.5 text-[11px] font-medium";

/** Native-app style bottom navigation, shown below 768px. */
export function MobileTabBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const pinned = new Set(MOBILE_TABS.map((tab) => tab.href));
  const moreActive =
    pathname.startsWith("/admin") ||
    NAV_SECTIONS.flatMap((s) => s.items).some((item) => !pinned.has(item.href) && isActive(pathname, item.href));

  const renderTab = (item: NavItem) => {
    const active = isActive(pathname, item.href);
    const Icon = item.icon;
    return (
      <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn(tabClass, active ? "text-ink" : "text-faint")}>
        {active && <motion.span layoutId="tab-active" className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" />}
        <Icon className={cn("size-[22px]", active && "text-accent")} strokeWidth={active ? 2.2 : 1.8} />
        {item.label}
      </Link>
    );
  };

  const [first, second, third] = MOBILE_TABS;

  return (
    <>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/85 pb-safe backdrop-blur-xl md:hidden">
        <div className="mx-auto flex h-16 max-w-lg items-stretch">
          {renderTab(first)}
          {renderTab(second)}

          <div className="flex flex-1 items-start justify-center">
            <motion.button
              type="button"
              aria-label="Create new"
              onClick={() => setCreateOpen(true)}
              whileTap={{ scale: 0.92 }}
              className="-mt-5 grid size-14 place-items-center rounded-[18px] bg-accent text-accent-ink shadow-[0_8px_24px_-6px_var(--accent)] ring-4 ring-bg"
            >
              <Plus className="size-7" strokeWidth={2.4} />
            </motion.button>
          </div>

          {renderTab(third)}

          <button type="button" onClick={() => setMoreOpen(true)} className={cn(tabClass, moreActive ? "text-ink" : "text-faint")}>
            {moreActive && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" />}
            <Grip className={cn("size-[22px]", moreActive && "text-accent")} strokeWidth={1.8} />
            More
          </button>
        </div>
      </nav>

      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
      <QuickCreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
