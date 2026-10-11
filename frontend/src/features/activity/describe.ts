import type { ActivityItem } from "@/lib/types";

const VERBS: Record<string, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
  completed: "Completed",
  reopened: "Reopened",
  uploaded: "Uploaded",
  added: "Added",
  revealed: "Revealed",
  rotated: "Rotated the secret of",
  password_reset: "Reset the password of",
  role_changed: "Changed the role of",
  removed: "Removed",
};

const NOUNS: Record<string, string> = {
  project: "project",
  task: "task",
  note: "note",
  snippet: "snippet",
  file: "file",
  link: "link",
  credential: "credential",
  build: "build",
  user: "user",
  tag: "tag",
  member: "team member",
};

/** "task.completed" + "Fix login" → "Completed task “Fix login”" */
export function describeActivity(item: ActivityItem): string {
  const [entity, verb] = item.action.split(".");
  const label = item.entity_label ? ` “${item.entity_label}”` : "";
  if (entity === "auth") return verb === "login" ? "Signed in" : "Signed out";
  if (item.action === "build.completed") {
    const to = (item.metadata?.status as { to?: string } | undefined)?.to;
    return `Build${label} finished${to ? `: ${to}` : ""}`;
  }
  return `${VERBS[verb] ?? verb} ${NOUNS[entity] ?? entity}${label}`;
}

/** Where clicking an activity entry should go (null if the item is gone or has no page). */
export function activityHref(item: ActivityItem): string | null {
  if (!item.entity_id || item.action.endsWith(".deleted")) return null;
  switch (item.entity_type) {
    case "project":
      return `/projects/${item.entity_id}`;
    case "task":
      return `/tasks?task=${item.entity_id}`;
    case "note":
      return `/notes/${item.entity_id}`;
    case "snippet":
      return `/snippets?snippet=${item.entity_id}`;
    case "file":
      return "/files";
    case "link":
      return "/links";
    case "credential":
      return "/vault";
    case "build":
      return "/builds";
    default:
      return null;
  }
}
