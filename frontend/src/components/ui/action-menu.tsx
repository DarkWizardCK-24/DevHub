"use client";

import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface ActionItem {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
  hidden?: boolean;
}

/** The "⋯" button on rows and cards: edit, delete and similar actions. */
export function ActionMenu({ items, label = "More actions", className }: { items: ActionItem[]; label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const visible = items.filter((item) => !item.hidden);
  if (visible.length === 0) return null;

  return (
    <div ref={ref} className={cn("relative", className)} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault();
          setOpen((value) => !value);
        }}
        className="grid size-8 place-items-center rounded-lg text-faint transition-colors hover:bg-raised hover:text-ink"
      >
        <MoreHorizontal className="size-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 z-40 mt-1 min-w-44 origin-top-right rounded-[var(--radius-control)] border border-line bg-surface p-1 shadow-pop"
          >
            {visible.map(({ label: itemLabel, icon: Icon, onSelect, danger }) => (
              <button
                key={itemLabel}
                type="button"
                role="menuitem"
                onClick={(event) => {
                  event.preventDefault();
                  setOpen(false);
                  onSelect();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-raised",
                  danger ? "text-coral" : "text-ink",
                )}
              >
                <Icon className="size-4 opacity-70" />
                {itemLabel}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
