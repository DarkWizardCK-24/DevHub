-- =============================================================================
-- DevHub — initial schema
--
-- Run this FIRST in the Supabase SQL editor (on an empty project), then run
-- 02_create_admin.sql to create the first admin account.
--
-- Conventions
--   * Primary keys: uuid (gen_random_uuid) — safe to expose in URLs, no
--     enumeration of other users' records. activity_logs uses bigint identity
--     because it is append-only, high-volume and naturally ordered.
--   * Every table has created_at / updated_at (timestamptz, UTC).
--   * owner_id on every user-owned row = the profile that created it. Project
--     sharing is handled by project_members; owner_id keeps "my stuff" queries
--     simple and survives if a row is detached from a project.
--   * Fixed workflow values use Postgres ENUMs (type-safe, compact). Adding a
--     value later is a one-liner: ALTER TYPE ... ADD VALUE '...'.
--   * RLS is enabled on every table with NO policies: the public key can read
--     nothing through the Supabase Data API. All access goes through FastAPI,
--     which connects as the table owner (RLS does not apply to it).
-- =============================================================================

-- gen_random_uuid() is built into Postgres 13+, so no extension is needed.

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.user_role        as enum ('user', 'admin');
create type public.member_role      as enum ('owner', 'editor', 'viewer');
create type public.project_status   as enum ('planning', 'in_progress', 'on_hold', 'completed', 'archived');
create type public.priority_level   as enum ('low', 'medium', 'high', 'urgent');
create type public.task_status      as enum ('backlog', 'todo', 'in_progress', 'review', 'done');
create type public.snippet_language as enum ('python', 'dart', 'typescript', 'javascript', 'sql', 'bash', 'json', 'yaml');
create type public.file_category    as enum ('screenshot', 'pdf', 'markdown', 'code', 'design', 'documentation', 'build_artifact', 'other');
create type public.link_type        as enum ('github', 'supabase', 'firebase', 'vercel', 'figma', 'documentation', 'api', 'demo', 'production', 'staging', 'other');
create type public.credential_type  as enum ('api_key', 'env_variable', 'test_account', 'service', 'database', 'login', 'other');
create type public.environment_kind as enum ('development', 'staging', 'production', 'other');
create type public.build_platform   as enum ('android', 'ios', 'web', 'windows', 'macos', 'linux', 'other');
create type public.build_status     as enum ('building', 'successful', 'failed', 'cancelled');

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

-- Keeps updated_at honest even when rows are changed outside the API.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- array_to_string() is STABLE, but generated columns require IMMUTABLE
-- expressions. For text[] this is genuinely immutable, so we wrap it.
create or replace function public.immutable_array_to_string(arr text[], sep text)
returns text
language sql
immutable
parallel safe
as $$ select array_to_string(arr, sep) $$;

-- =============================================================================
-- profiles — one row per auth.users row; holds app-level data and the role.
-- =============================================================================
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text check (char_length(full_name) <= 120),
  avatar_url  text check (char_length(avatar_url) <= 2048),
  bio         text check (char_length(bio) <= 500),
  role        public.user_role not null default 'user',
  is_active   boolean not null default true,
  timezone    text not null default 'UTC',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index profiles_email_key on public.profiles (lower(email));
create index profiles_role_idx on public.profiles (role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create the profile automatically when someone signs up through Supabase Auth.
-- SECURITY DEFINER: runs with the function owner's rights because the insert
-- into auth.users happens as an internal role. search_path is pinned to ''
-- so a malicious object on the search path cannot be substituted.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in sync if the user changes their email.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- =============================================================================
-- projects
-- =============================================================================
create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles (id) on delete cascade,
  name          text not null check (char_length(btrim(name)) between 1 and 120),
  description   text check (char_length(description) <= 5000),
  status        public.project_status not null default 'planning',
  priority      public.priority_level not null default 'medium',
  category      text check (char_length(category) <= 60),
  technologies  text[] not null default '{}' check (cardinality(technologies) <= 30),
  github_url    text check (github_url ~* '^https?://'),
  live_url      text check (live_url ~* '^https?://'),
  color         text not null default '#4F6BFF' check (color ~* '^#[0-9a-f]{6}$'),
  start_date    date,
  target_date   date,
  -- Stored, not computed: you may want to set progress manually for projects
  -- that are not tracked task-by-task. The API can recalculate it from tasks.
  progress      smallint not null default 0 check (progress between 0 and 100),
  is_pinned     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint projects_dates_order check (target_date is null or start_date is null or target_date >= start_date),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(category, '') || ' ' || public.immutable_array_to_string(technologies, ' ')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored
);
-- One user can't have two projects with the same name (case-insensitive).
create unique index projects_owner_name_key on public.projects (owner_id, lower(name));
create index projects_owner_status_idx on public.projects (owner_id, status);
create index projects_search_idx on public.projects using gin (search_vector);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- =============================================================================
-- project_members — who can access a project and with which role.
-- The owner is inserted automatically so permission checks have ONE place to
-- look ("is there a membership row with a sufficient role?").
-- =============================================================================
create table public.project_members (
  project_id  uuid not null references public.projects (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        public.member_role not null default 'viewer',
  created_at  timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index project_members_user_idx on public.project_members (user_id);

create or replace function public.add_project_owner_membership()
returns trigger
language plpgsql
as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (project_id, user_id) do update set role = 'owner';
  return new;
end;
$$;

create trigger projects_add_owner_membership
  after insert on public.projects
  for each row execute function public.add_project_owner_membership();

-- =============================================================================
-- tags — owned by a user, reused across tasks and snippets.
-- =============================================================================
create table public.tags (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 40),
  color       text not null default '#8A93A6' check (color ~* '^#[0-9a-f]{6}$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index tags_owner_name_key on public.tags (owner_id, lower(name));

create trigger tags_set_updated_at
  before update on public.tags
  for each row execute function public.set_updated_at();

-- =============================================================================
-- tasks
-- project_id is nullable: personal tasks ("renew domain") don't need a project.
-- =============================================================================
create table public.tasks (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references public.profiles (id) on delete cascade,
  project_id         uuid references public.projects (id) on delete cascade,
  assignee_id        uuid references public.profiles (id) on delete set null,
  title              text not null check (char_length(btrim(title)) between 1 and 200),
  description        text check (char_length(description) <= 20000),
  status             public.task_status not null default 'todo',
  priority           public.priority_level not null default 'medium',
  due_date           date,
  estimated_minutes  integer check (estimated_minutes between 0 and 100000),
  actual_minutes     integer check (actual_minutes between 0 and 100000),
  -- Kanban ordering within a column. A float lets us insert between two cards
  -- (average of neighbours) without renumbering the whole column.
  position           double precision not null default 0,
  completed_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint tasks_completed_consistency check ((status = 'done') = (completed_at is not null)),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored
);
create index tasks_owner_status_idx on public.tasks (owner_id, status, position);
create index tasks_project_status_idx on public.tasks (project_id, status, position);
create index tasks_due_date_idx on public.tasks (owner_id, due_date) where due_date is not null and status <> 'done';
create index tasks_search_idx on public.tasks using gin (search_vector);

-- Maintain completed_at automatically from status, so the check constraint
-- above can never be violated by a client that forgets to set it.
create or replace function public.sync_task_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'done' and (tg_op = 'INSERT' or old.status <> 'done') then
    new.completed_at = coalesce(new.completed_at, now());
  elsif new.status <> 'done' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger tasks_sync_completed_at
  before insert or update of status on public.tasks
  for each row execute function public.sync_task_completed_at();

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create table public.task_tags (
  task_id  uuid not null references public.tasks (id) on delete cascade,
  tag_id   uuid not null references public.tags (id) on delete cascade,
  primary key (task_id, tag_id)
);
create index task_tags_tag_idx on public.task_tags (tag_id);

-- =============================================================================
-- notes — Markdown documents, optionally attached to a project.
-- =============================================================================
create table public.notes (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  project_id  uuid references public.projects (id) on delete cascade,
  title       text not null check (char_length(btrim(title)) between 1 and 200),
  -- Optional grouping, e.g. "architecture", "runbooks". Plain text rather
  -- than a folders table: simple, and enough for a personal workspace.
  folder      text check (char_length(folder) <= 80),
  content     text not null default '' check (char_length(content) <= 500000),
  is_pinned   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(folder, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'D')
  ) stored
);
create index notes_owner_updated_idx on public.notes (owner_id, updated_at desc);
create index notes_project_idx on public.notes (project_id, updated_at desc);
create index notes_search_idx on public.notes using gin (search_vector);

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- =============================================================================
-- snippets — a cross-project library. Deleting a project keeps its snippets
-- (project_id → NULL) because a good snippet outlives the project it came from.
-- =============================================================================
create table public.snippets (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  project_id   uuid references public.projects (id) on delete set null,
  title        text not null check (char_length(btrim(title)) between 1 and 200),
  description  text check (char_length(description) <= 2000),
  language     public.snippet_language not null,
  code         text not null check (char_length(code) between 1 and 100000),
  is_favorite  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- 'simple' config for code: no English stemming ("useEffect" stays intact).
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(code, '')), 'D')
  ) stored
);
create index snippets_owner_lang_idx on public.snippets (owner_id, language);
create index snippets_project_idx on public.snippets (project_id);
create index snippets_search_idx on public.snippets using gin (search_vector);

create trigger snippets_set_updated_at
  before update on public.snippets
  for each row execute function public.set_updated_at();

create table public.snippet_tags (
  snippet_id  uuid not null references public.snippets (id) on delete cascade,
  tag_id      uuid not null references public.tags (id) on delete cascade,
  primary key (snippet_id, tag_id)
);
create index snippet_tags_tag_idx on public.snippet_tags (tag_id);

-- =============================================================================
-- files — metadata for objects in the private Supabase Storage bucket.
-- The binary lives in Storage; Postgres holds what we need to list, search,
-- authorize and clean up. The API deletes the Storage object before the row.
-- =============================================================================
create table public.files (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles (id) on delete cascade,
  project_id      uuid references public.projects (id) on delete cascade,
  name            text not null check (char_length(btrim(name)) between 1 and 255),
  storage_path    text not null unique check (char_length(storage_path) <= 1024),
  mime_type       text not null check (char_length(mime_type) <= 255),
  size_bytes      bigint not null check (size_bytes > 0),
  category        public.file_category not null default 'other',
  description     text check (char_length(description) <= 2000),
  checksum_sha256 text check (checksum_sha256 ~ '^[0-9a-f]{64}$'),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored
);
create index files_owner_created_idx on public.files (owner_id, created_at desc);
create index files_project_idx on public.files (project_id, created_at desc);
create index files_search_idx on public.files using gin (search_vector);

create trigger files_set_updated_at
  before update on public.files
  for each row execute function public.set_updated_at();

-- =============================================================================
-- links
-- =============================================================================
create table public.links (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  project_id   uuid references public.projects (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 120),
  url          text not null check (url ~* '^https?://' and char_length(url) <= 2048),
  type         public.link_type not null default 'other',
  description  text check (char_length(description) <= 1000),
  is_pinned    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(url, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored
);
create index links_owner_idx on public.links (owner_id, type);
create index links_project_idx on public.links (project_id);
create index links_search_idx on public.links using gin (search_vector);

create trigger links_set_updated_at
  before update on public.links
  for each row execute function public.set_updated_at();

-- =============================================================================
-- credentials — secrets are ENCRYPTED BY THE API before they reach Postgres.
-- No plaintext secret column exists, and credentials are intentionally NOT
-- part of global search (no search_vector).
-- =============================================================================
create table public.credentials (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references public.profiles (id) on delete cascade,
  project_id         uuid references public.projects (id) on delete cascade,
  name               text not null check (char_length(btrim(name)) between 1 and 120),
  type               public.credential_type not null default 'api_key',
  environment        public.environment_kind not null default 'development',
  -- Non-secret identifiers shown in clear: an env var name, a login username,
  -- a dashboard URL.
  identifier         text check (char_length(identifier) <= 255),
  url                text check (url ~* '^https?://' and char_length(url) <= 2048),
  secret_ciphertext  text not null,
  notes_ciphertext   text,
  key_version        smallint not null default 1,
  last_revealed_at   timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index credentials_owner_idx on public.credentials (owner_id, environment);
create index credentials_project_idx on public.credentials (project_id);
create unique index credentials_unique_name on public.credentials
  (owner_id, coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid), environment, lower(name));

create trigger credentials_set_updated_at
  before update on public.credentials
  for each row execute function public.set_updated_at();

-- =============================================================================
-- builds
-- =============================================================================
create table public.builds (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references public.profiles (id) on delete cascade,
  project_id        uuid not null references public.projects (id) on delete cascade,
  platform          public.build_platform not null,
  version           text not null check (char_length(btrim(version)) between 1 and 50),
  build_number      integer check (build_number >= 0),
  branch            text check (char_length(branch) <= 255),
  commit_sha        text check (commit_sha ~* '^[0-9a-f]{7,40}$'),
  status            public.build_status not null default 'building',
  artifact_file_id  uuid references public.files (id) on delete set null,
  release_notes     text check (char_length(release_notes) <= 20000),
  started_at        timestamptz not null default now(),
  finished_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint builds_finished_after_start check (finished_at is null or finished_at >= started_at),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(version, '') || ' ' || coalesce(branch, '') || ' ' || coalesce(commit_sha, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(release_notes, '')), 'C')
  ) stored
);
create unique index builds_unique_number on public.builds (project_id, platform, version, build_number)
  where build_number is not null;
create index builds_project_created_idx on public.builds (project_id, created_at desc);
create index builds_owner_status_idx on public.builds (owner_id, status);
create index builds_search_idx on public.builds using gin (search_vector);

create trigger builds_set_updated_at
  before update on public.builds
  for each row execute function public.set_updated_at();

-- =============================================================================
-- activity_logs — append-only timeline.
-- entity_label snapshots the entity's name so the timeline still reads well
-- after the entity is deleted. FKs use SET NULL so history is never lost.
-- metadata must NEVER contain secret values (enforced in the API layer).
-- =============================================================================
create table public.activity_logs (
  id            bigint generated always as identity primary key,
  actor_id      uuid references public.profiles (id) on delete set null,
  project_id    uuid references public.projects (id) on delete set null,
  action        text not null check (action ~ '^[a-z_]+\.[a-z_]+$'),  -- e.g. task.completed
  entity_type   text not null check (char_length(entity_type) <= 40),
  entity_id     uuid,
  entity_label  text check (char_length(entity_label) <= 255),
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index activity_actor_created_idx on public.activity_logs (actor_id, created_at desc);
create index activity_project_created_idx on public.activity_logs (project_id, created_at desc);
create index activity_entity_idx on public.activity_logs (entity_type, entity_id);

-- =============================================================================
-- Row Level Security: enable everywhere, add no policies → deny-all for the
-- anon / authenticated roles used by the Supabase Data API.
-- =============================================================================
alter table public.profiles        enable row level security;
alter table public.projects        enable row level security;
alter table public.project_members enable row level security;
alter table public.tags            enable row level security;
alter table public.tasks           enable row level security;
alter table public.task_tags       enable row level security;
alter table public.notes           enable row level security;
alter table public.snippets        enable row level security;
alter table public.snippet_tags    enable row level security;
alter table public.files           enable row level security;
alter table public.links           enable row level security;
alter table public.credentials     enable row level security;
alter table public.builds          enable row level security;
alter table public.activity_logs   enable row level security;

-- =============================================================================
-- Storage: one private bucket. 50 MB matches the Supabase free-tier limit;
-- raise it in the dashboard on a paid plan for larger build artifacts.
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('devhub-files', 'devhub-files', false, 52428800)
on conflict (id) do nothing;

-- =============================================================================
-- Admin-only accounts
--
-- Public registration is removed from the app, but Supabase Auth's /signup
-- endpoint is reachable with the public anon key unless "Allow new users to
-- sign up" is switched off in the dashboard (Authentication -> Sign In / Providers).
--
-- Defence in depth: a profile is only ACTIVE when the auth user was created by an
-- admin with the service-role key (app_metadata.created_by_admin = true;
-- clients cannot set app_metadata). Anyone who self-registers gets an inactive
-- profile, which the API rejects ("Your account has been deactivated").
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, is_active)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    coalesce((new.raw_app_meta_data ->> 'created_by_admin')::boolean, false)
  );
  return new;
end;
$$;

-- Credential vault: person/account logins carry the role of the account
-- (e.g. "Admin", "QA tester", "Customer"), shown in clear next to the name.
alter table public.credentials
  add column if not exists account_role text check (char_length(account_role) <= 80);
