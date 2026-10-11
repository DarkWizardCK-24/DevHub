import Link from "next/link";
import type { ProjectRef } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Small colored project label; links to the project unless `static`. */
export function ProjectBadge({ project, className, asLink = true }: { project: ProjectRef | null; className?: string; asLink?: boolean }) {
  if (!project) return null;
  const content = (
    <>
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: project.color }} aria-hidden />
      <span className="truncate">{project.name}</span>
    </>
  );
  const classes = cn("inline-flex max-w-full items-center gap-1.5 text-xs font-medium text-muted", className);
  return asLink ? (
    <Link href={`/projects/${project.id}`} className={cn(classes, "hover:text-ink")} onClick={(e) => e.stopPropagation()}>
      {content}
    </Link>
  ) : (
    <span className={classes}>{content}</span>
  );
}
