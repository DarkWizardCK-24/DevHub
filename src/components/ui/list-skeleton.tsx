import { Skeleton } from "./skeleton";

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-line" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="space-y-3 rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}
