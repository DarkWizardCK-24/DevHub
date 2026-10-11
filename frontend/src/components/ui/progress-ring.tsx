import { cn } from "@/lib/utils";

/** Circular progress (0–100). Used on project cards and dashboard widgets. */
export function ProgressRing({ value, size = 44, stroke = 4, className }: { value: number; size?: number; stroke?: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-line" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className={cn(
            "transition-[stroke-dashoffset] duration-700 ease-out",
            clamped === 100 ? "stroke-mint" : "stroke-accent",
          )}
        />
      </svg>
      <span className="absolute text-[10px] font-medium tabular-nums text-ink" aria-label={`${clamped}% complete`}>
        {clamped}%
      </span>
    </div>
  );
}
