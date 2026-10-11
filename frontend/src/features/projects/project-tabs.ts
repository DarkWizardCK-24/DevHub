/** Plain module (no "use client") so server pages can validate ?tab= without importing client code. */
export const PROJECT_TABS = ["overview", "team", "tasks", "notes", "files", "links", "vault", "builds", "activity"] as const;
export type ProjectTab = (typeof PROJECT_TABS)[number];

export function isProjectTab(value: unknown): value is ProjectTab {
  return typeof value === "string" && (PROJECT_TABS as readonly string[]).includes(value);
}
