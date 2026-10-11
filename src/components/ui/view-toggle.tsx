"use client";

import { LayoutGrid, List, Rows3, type LucideIcon } from "lucide-react";
import type { ViewMode } from "@/hooks/use-view-mode";
import { cn } from "@/lib/utils";

const META: Record<ViewMode, { label: string; icon: LucideIcon }> = {
  grid: { label: "Grid view", icon: LayoutGrid },
  list: { label: "List view", icon: List },
  compact: { label: "Compact table", icon: Rows3 },
};

/** Segmented switch between layouts. Pass only the modes a screen supports. */
export function ViewToggle({
  value,
  onChange,
  modes = ["grid", "list", "compact"],
  className,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  modes?: ViewMode[];
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label="Layout" className={cn("inline-flex h-9 shrink-0 items-center gap-0.5 rounded-xl border border-line/70 bg-surface-2/60 p-0.5", className)}>
      {modes.map((mode) => {
        const { label, icon: Icon } = META[mode];
        const active = mode === value;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => onChange(mode)}
            className={cn("grid size-8 place-items-center rounded-[10px] transition-all", active ? "bg-surface text-accent shadow-xs" : "text-faint hover:text-ink")}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
