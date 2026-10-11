import { cn } from "@/lib/utils";

/** Placeholder block that mirrors the shape of content while it loads. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-[var(--radius-chip)] bg-[length:200%_100%]",
        "bg-[linear-gradient(90deg,var(--raised)_0%,var(--line)_50%,var(--raised)_100%)]",
        className,
      )}
    />
  );
}
