import { cn } from "@/lib/utils";

const sizes = { sm: "size-4 border-2", md: "size-6 border-2", lg: "size-10 border-[3px]" } as const;

export function Spinner({ size = "md", className, label = "Loading" }: { size?: keyof typeof sizes; className?: string; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-block animate-spin rounded-full border-current border-r-transparent text-accent", sizes[size], className)}
    />
  );
}

/** Full-area loader for route-level loading states. */
export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-muted">
        <Spinner size="lg" label={label} />
        <span className="text-sm">{label}…</span>
      </div>
    </div>
  );
}
