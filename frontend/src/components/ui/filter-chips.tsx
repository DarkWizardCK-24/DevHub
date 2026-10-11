"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Single-choice filter as a row of chips. Scrolls sideways on phones instead
 * of wrapping, like filter bars in native apps.
 */
export function FilterChips<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
  label: string;
}) {
  const layoutId = useId();
  return (
    <div role="radiogroup" aria-label={label} className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:flex-wrap md:px-0">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium tracking-tight transition-all",
              active ? "border-transparent text-accent-ink shadow-xs" : "border-line/70 bg-surface/80 text-muted hover:border-line-strong hover:bg-surface hover:text-ink shadow-2xs",
            )}
          >
            {active && <motion.span layoutId={layoutId} className="absolute inset-0 rounded-full bg-accent" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            <span className="relative">{option.label}</span>
            {option.count !== undefined && <span className={cn("relative text-xs", active ? "opacity-70" : "text-faint")}>{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
