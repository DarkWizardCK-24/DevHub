import type { Tone } from "@/components/ui/badge";
import { parseDateOnly } from "@/lib/format";
import type { Health, Project } from "@/lib/types";

export const HEALTH: Record<Health, { label: string; tone: Tone; bar: string; text: string }> = {
  on_track: { label: "On track", tone: "mint", bar: "bg-mint", text: "text-mint" },
  at_risk: { label: "At risk", tone: "amber", bar: "bg-amber", text: "text-amber" },
  off_track: { label: "Off track", tone: "coral", bar: "bg-coral", text: "text-coral" },
  completed: { label: "Completed", tone: "mint", bar: "bg-mint", text: "text-mint" },
  not_started: { label: "No tasks yet", tone: "neutral", bar: "bg-line-strong", text: "text-muted" },
};

/** Percent of the planned time window that has passed (null without both dates). */
export function elapsedPct(start: string | null, target: string | null): number | null {
  if (!start || !target) return null;
  const s = parseDateOnly(start).getTime();
  const t = parseDateOnly(target).getTime();
  if (t <= s) return null;
  return Math.round(Math.max(0, Math.min(1, (Date.now() - s) / (t - s))) * 100);
}

/** Lightweight health for list cards, from fields already on the project row. */
export function cardHealth(project: Project): Health {
  if (project.status === "completed") return "completed";
  if (project.total_tasks === 0) return "not_started";
  if (project.overdue_tasks >= 3) return "off_track";
  const done = Math.round((project.done_tasks / project.total_tasks) * 100);
  const elapsed = elapsedPct(project.start_date, project.target_date);
  const gap = elapsed === null ? 0 : elapsed - done;
  if (gap > 25) return "off_track";
  if (project.overdue_tasks >= 1 || gap > 10) return "at_risk";
  return "on_track";
}

/** 90 -> "1h 30m", 3000 -> "50h", 0 -> "0h". Large values read better in hours. */
export function hoursLabel(minutes: number): string {
  if (minutes <= 0) return "0h";
  if (minutes < 60) return `${minutes}m`;
  const h = minutes / 60;
  return h >= 100 ? `${Math.round(h)}h` : `${Math.round(h * 10) / 10}h`;
}
