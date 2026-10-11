import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Page title block. On mobile it renders as a large, app-style title;
 * on desktop it sits inline with the page's primary actions.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 md:mb-7 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-[26px] font-medium tracking-[-0.04em] text-ink md:text-[30px]">{title}</h1>
        {description && <p className="mt-1 max-w-prose text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
