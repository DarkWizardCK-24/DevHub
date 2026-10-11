import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DonutSegment {
  label: string;
  value: number;
  /** Any CSS color, e.g. "var(--mint)". */
  color: string;
  /** Makes the legend row and the slice navigate somewhere. */
  href?: string;
}

/**
 * Donut chart with a centre label and a legend. Slices are stroke-dasharray
 * arcs on one circle, so no chart library is needed.
 */
export function DonutChart({
  segments,
  size = 132,
  stroke = 16,
  centerValue,
  centerLabel,
  className,
  emptyLabel = "Nothing yet",
}: {
  segments: DonutSegment[];
  size?: number;
  stroke?: number;
  centerValue?: ReactNode;
  centerLabel?: ReactNode;
  className?: string;
  emptyLabel?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const visible = segments.filter((s) => s.value > 0);
  const gap = visible.length > 1 ? 2 : 0;

  const arcs = visible.map((segment, i) => {
    const before = visible.slice(0, i).reduce((sum, s) => sum + s.value, 0);
    const length = (segment.value / total) * circumference;
    return { segment, dash: Math.max(length - gap, 0.5), start: (before / total) * circumference };
  });

  return (
    <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-4", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-line" />
          {arcs.map(({ segment, dash, start }) => (
            <circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              stroke={segment.color}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-start}
            >
              <title>{`${segment.label}: ${segment.value}`}</title>
            </circle>
          ))}
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <span className="text-2xl leading-none font-medium tracking-[-0.04em] tabular-nums">{centerValue ?? total}</span>
          {total === 0 ? (
            <span className="mt-1 text-[11px] text-faint">{emptyLabel}</span>
          ) : (
            centerLabel && <span className="mt-1 text-[11px] text-muted">{centerLabel}</span>
          )}
        </div>
      </div>
      <ul className="min-w-36 flex-1 space-y-1.5 text-sm">
        {segments.map((segment) => {
          const pct = total ? Math.round((segment.value / total) * 100) : 0;
          const row = (
            <>
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} aria-hidden />
              <span className="flex-1 truncate text-muted">{segment.label}</span>
              <span className="tabular-nums text-ink">{segment.value}</span>
              <span className="w-9 text-right text-xs tabular-nums text-faint">{pct}%</span>
            </>
          );
          return (
            <li key={segment.label}>
              {segment.href ? (
                <Link href={segment.href} className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1 transition-colors hover:bg-surface-2">
                  {row}
                </Link>
              ) : (
                <div className="flex items-center gap-2.5 py-1">{row}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
