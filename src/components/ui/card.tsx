import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[var(--radius-card)] border border-line/70 bg-surface shadow-card transition-all duration-200", className)} {...props} />;
}

export function CardHeader({
  title,
  icon,
  action,
  className,
}: {
  title: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 px-5 pt-4 pb-3", className)}>
      <h2 className="flex items-center gap-2.5 font-sans text-sm font-semibold tracking-tight text-ink">
        {icon && <span className="grid size-6 place-items-center rounded-lg bg-accent-soft text-accent [&>svg]:size-3.5">{icon}</span>}
        {title}
      </h2>
      {action}
    </div>
  );
}
