/**
 * API response/request types. Each mirrors a Pydantic schema in the backend
 * (file noted per block). Keep them in sync when the API changes.
 */

export type Priority = "low" | "medium" | "high" | "urgent";
export type ProjectStatus = "planning" | "in_progress" | "on_hold" | "completed" | "archived";
export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";
export type Language = "python" | "dart" | "typescript" | "javascript" | "sql" | "bash" | "json" | "yaml";
export type FileCategory = "screenshot" | "pdf" | "markdown" | "code" | "design" | "documentation" | "build_artifact" | "other";
export type LinkType =
  | "github" | "supabase" | "firebase" | "vercel" | "figma" | "documentation" | "api" | "demo" | "production" | "staging" | "other";
export type CredentialType = "api_key" | "env_variable" | "test_account" | "service" | "database" | "login" | "other";
export type Environment = "development" | "staging" | "production" | "other";
export type Platform = "android" | "ios" | "web" | "windows" | "macos" | "linux" | "other";
export type BuildStatus = "building" | "successful" | "failed" | "cancelled";
export type MemberRole = "owner" | "editor" | "viewer";

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ProjectRef {
  id: string;
  name: string;
  color: string;
}

// app/modules/projects/schemas.py
export interface Project {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: Priority;
  category: string | null;
  technologies: string[];
  github_url: string | null;
  live_url: string | null;
  color: string;
  start_date: string | null;
  target_date: string | null;
  progress: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  role: MemberRole;
  open_tasks: number;
  total_tasks: number;
  done_tasks: number;
  overdue_tasks: number;
  estimated_minutes: number;
  actual_minutes: number;
}

export interface ProjectDetail extends Project {
  counts: {
    tasks: number;
    open_tasks: number;
    done_tasks: number;
    notes: number;
    files: number;
    links: number;
    credentials: number;
    builds: number;
    members: number;
  };
}

export interface ProjectOption extends ProjectRef {
  status: ProjectStatus;
}

// app/modules/tags/router.py
export interface Tag {
  id: string;
  name: string;
  color: string;
}

// app/modules/tasks/schemas.py
export interface Task {
  id: string;
  owner_id: string;
  project_id: string | null;
  project: ProjectRef | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  position: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

// app/modules/notes/router.py
export interface NoteSummary {
  id: string;
  owner_id: string;
  project_id: string | null;
  project: ProjectRef | null;
  title: string;
  folder: string | null;
  is_pinned: boolean;
  excerpt: string;
  created_at: string;
  updated_at: string;
}

export interface Note extends NoteSummary {
  content: string;
}

// app/modules/snippets/router.py
export interface Snippet {
  id: string;
  owner_id: string;
  project_id: string | null;
  project: ProjectRef | null;
  title: string;
  description: string | null;
  language: Language;
  code: string;
  is_favorite: boolean;
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

// app/modules/files/router.py
export interface StoredFile {
  id: string;
  owner_id: string;
  project_id: string | null;
  project: ProjectRef | null;
  name: string;
  mime_type: string;
  size_bytes: number;
  category: FileCategory;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// app/modules/links/router.py
export interface LinkItem {
  id: string;
  owner_id: string;
  project_id: string | null;
  project: ProjectRef | null;
  name: string;
  url: string;
  type: LinkType;
  description: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

// app/modules/credentials/router.py — note: never contains the secret
export interface Credential {
  id: string;
  project_id: string | null;
  project: ProjectRef | null;
  name: string;
  type: CredentialType;
  environment: Environment;
  identifier: string | null;
  account_role: string | null;
  url: string | null;
  has_notes: boolean;
  last_revealed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RevealedSecret {
  secret: string;
  notes: string | null;
}

// app/modules/builds/router.py
export interface Build {
  id: string;
  owner_id: string;
  project_id: string;
  project: ProjectRef;
  platform: Platform;
  version: string;
  build_number: number | null;
  branch: string | null;
  commit_sha: string | null;
  status: BuildStatus;
  artifact: StoredFile | null;
  release_notes: string | null;
  started_at: string;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

// app/modules/activity/router.py
export interface ActivityItem {
  id: number;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  project: ProjectRef | null;
  actor_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ActivityPage {
  items: ActivityItem[];
  next_before_id: number | null;
}

// app/modules/search/router.py
export type SearchEntity = "project" | "task" | "note" | "snippet" | "file" | "link" | "build";

export interface SearchResult {
  type: SearchEntity;
  id: string;
  title: string;
  subtitle: string | null;
  project_id: string | null;
  project_name: string | null;
  project_color: string | null;
  rank: number;
}

// app/modules/dashboard/router.py
export interface DashboardData {
  stats: { open_tasks: number; active_projects: number; builds_this_week: number; notes: number };
  activity_rail: number[];
  due_tasks: Task[];
  projects: Project[];
  builds: Build[];
  activity: ActivityItem[];
}

// app/modules/projects/pulse.py
export type Health = "on_track" | "at_risk" | "off_track" | "completed" | "not_started";

export interface Pulse {
  health: Health;
  health_reasons: string[];
  schedule: {
    start_date: string | null;
    target_date: string | null;
    total_days: number | null;
    elapsed_days: number | null;
    days_left: number | null;
    elapsed_pct: number | null;
  };
  tasks: {
    total: number;
    done: number;
    open: number;
    overdue: number;
    due_this_week: number;
    unestimated: number;
    by_status: Partial<Record<TaskStatus, number>>;
    completion_pct: number;
  };
  effort: {
    estimated_minutes: number;
    actual_minutes: number;
    remaining_minutes: number;
    forecast_minutes: number;
    accuracy_ratio: number | null;
    variance_minutes: number;
  };
  velocity: { done_last_14d: number; per_week: number; projected_finish: string | null };
  weeks: { week_start: string; created: number; completed: number; scope_total: number; done_total: number }[];
  builds: { id: string; version: string; platform: Platform; status: BuildStatus; at: string }[];
}

// app/modules/admin/schemas.py
export interface AuditEntry {
  id: number;
  created_at: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  actor: { id: string; email: string; name: string | null } | null;
  project_name: string | null;
  ip: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
}

export interface AuditPage {
  items: AuditEntry[];
  next_before_id: number | null;
  total_24h: number;
}

export interface AdminProject {
  id: string;
  name: string;
  status: ProjectStatus;
  color: string;
  owner_email: string | null;
  owner_name: string | null;
  created_at: string;
  updated_at: string;
  tasks: number;
  notes: number;
  files: number;
  links: number;
  credentials: number;
  builds: number;
  members: number;
}

export interface ProjectMember {
  user_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: MemberRole;
  is_active: boolean;
  joined_at: string;
}
