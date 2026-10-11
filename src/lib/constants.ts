import type { Tone } from "@/components/ui/badge";
import type {
  BuildStatus,
  CredentialType,
  Environment,
  FileCategory,
  Language,
  LinkType,
  Platform,
  Priority,
  ProjectStatus,
  TaskStatus,
} from "./types";

/** Display labels and badge tones for every enum the API uses. */
type Meta = { label: string; tone: Tone };

export const PROJECT_STATUS: Record<ProjectStatus, Meta> = {
  planning: { label: "Planning", tone: "iris" },
  in_progress: { label: "In progress", tone: "accent" },
  on_hold: { label: "On hold", tone: "neutral" },
  completed: { label: "Completed", tone: "mint" },
  archived: { label: "Archived", tone: "neutral" },
};

export const PRIORITY: Record<Priority, Meta> = {
  low: { label: "Low", tone: "neutral" },
  medium: { label: "Medium", tone: "sky" },
  high: { label: "High", tone: "amber" },
  urgent: { label: "Urgent", tone: "coral" },
};

export const TASK_STATUS: Record<TaskStatus, Meta> = {
  backlog: { label: "Backlog", tone: "neutral" },
  todo: { label: "Todo", tone: "sky" },
  in_progress: { label: "In progress", tone: "accent" },
  review: { label: "Review", tone: "iris" },
  done: { label: "Done", tone: "mint" },
};
export const TASK_STATUS_ORDER: TaskStatus[] = ["backlog", "todo", "in_progress", "review", "done"];

export const LANGUAGES: Record<Language, { label: string; color: string }> = {
  python: { label: "Python", color: "#3776ab" },
  dart: { label: "Dart", color: "#0175c2" },
  typescript: { label: "TypeScript", color: "#3178c6" },
  javascript: { label: "JavaScript", color: "#e5c100" },
  sql: { label: "SQL", color: "#e38c00" },
  bash: { label: "Bash", color: "#4eaa25" },
  json: { label: "JSON", color: "#8a93a6" },
  yaml: { label: "YAML", color: "#cb171e" },
};

export const FILE_CATEGORY: Record<FileCategory, string> = {
  screenshot: "Screenshot",
  pdf: "PDF",
  markdown: "Markdown",
  code: "Code",
  design: "Design",
  documentation: "Documentation",
  build_artifact: "Build artifact",
  other: "Other",
};

export const LINK_TYPE: Record<LinkType, string> = {
  github: "GitHub",
  supabase: "Supabase",
  firebase: "Firebase",
  vercel: "Vercel",
  figma: "Figma",
  documentation: "Docs",
  api: "API",
  demo: "Demo",
  production: "Production",
  staging: "Staging",
  other: "Other",
};

export const CREDENTIAL_TYPE: Record<CredentialType, string> = {
  api_key: "API key",
  env_variable: "Env variable",
  test_account: "Test account",
  service: "Service",
  database: "Database",
  login: "Login",
  other: "Other",
};

export const ENVIRONMENT: Record<Environment, Meta> = {
  development: { label: "Development", tone: "sky" },
  staging: { label: "Staging", tone: "iris" },
  production: { label: "Production", tone: "coral" },
  other: { label: "Other", tone: "neutral" },
};

export const PLATFORM: Record<Platform, string> = {
  android: "Android",
  ios: "iOS",
  web: "Web",
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
  other: "Other",
};

export const BUILD_STATUS: Record<BuildStatus, Meta> = {
  building: { label: "Building", tone: "sky" },
  successful: { label: "Successful", tone: "mint" },
  failed: { label: "Failed", tone: "coral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const PROJECT_COLORS = ["#4F6BFF", "#FFAA33", "#3CCB9A", "#F25F5C", "#8B8FFF", "#5CB2F0", "#E86FD6", "#9AA3B8"];

export const options = <K extends string>(record: Record<K, string | { label: string }>) =>
  (Object.keys(record) as K[]).map((value) => {
    const entry = record[value];
    return { value, label: typeof entry === "string" ? entry : entry.label };
  });
