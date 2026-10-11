import { cn } from "@/lib/utils";

/**
 * 14-day activity strip — the dashboard's signature element.
 * Bar height and intensity scale with how much you did that day; today's bar
 * is outlined so you can see whether you've shipped anything yet.
 */
export function CommitRail({ counts, className }: { counts: number[]; className?: string }) {
  const max = Math.max(1, ...counts);
  const today = new Date();

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex h-14 items-end gap-1.5" role="img" aria-label={`Activity over the last ${counts.length} days`}>
        {counts.map((count, index) => {
          const ratio = count / max;
          const date = new Date(today);
          date.setDate(today.getDate() - (counts.length - 1 - index));
          const isToday = index === counts.length - 1;
          const formattedDate = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
          return (
            <div
              key={index}
              suppressHydrationWarning
              title={`${formattedDate}: ${count} ${count === 1 ? "action" : "actions"}`}
              className={cn(
                "group relative flex-1 origin-bottom animate-rail-in rounded-t-[3px] rounded-b-[1px] transition-all duration-200 hover:brightness-110",
                count === 0 ? "bg-line/70 hover:bg-line-strong" : "bg-accent hover:opacity-100",
                isToday && "ring-1.5 ring-accent ring-offset-2 ring-offset-surface",
              )}
              style={{
                height: `${count === 0 ? 12 : 20 + ratio * 80}%`,
                opacity: count === 0 ? 0.7 : 0.4 + ratio * 0.6,
                animationDelay: `${index * 25}ms`,
              }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-faint">
        <span>2 weeks ago</span>
        <span className="font-medium text-accent">Today</span>
      </div>
    </div>
  );
}
