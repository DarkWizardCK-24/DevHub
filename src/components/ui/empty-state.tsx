import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shown when a list has no items. An empty screen is an invitation to act,
 * so it explains what belongs here and offers the next step.
 */
export function EmptyState({
  illustration,
  title,
  description,
  action,
  className,
}: {
  illustration?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      {illustration && <div className="mb-5 text-faint">{illustration}</div>}
      <h3 className="font-sans text-base font-semibold tracking-tight text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
