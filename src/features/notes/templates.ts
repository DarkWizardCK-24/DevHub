/** Starter documents for the common per-project docs. */
export const NOTE_TEMPLATES: { id: string; title: string; folder: string; content: string }[] = [
  { id: "blank", title: "", folder: "", content: "" },
  {
    id: "architecture",
    title: "architecture.md",
    folder: "docs",
    content: "# Architecture\n\n## Overview\n\nWhat the system does, in two sentences.\n\n## Components\n\n| Component | Responsibility | Tech |\n|---|---|---|\n|  |  |  |\n\n## Data flow\n\n1. \n\n## Key decisions\n\n- \n",
  },
  {
    id: "database",
    title: "database.md",
    folder: "docs",
    content: "# Database\n\n## Tables\n\n### `table_name`\n\n| Column | Type | Notes |\n|---|---|---|\n| id | uuid | PK |\n\n## Indexes\n\n- \n\n## Migrations\n\n- \n",
  },
  {
    id: "api",
    title: "api.md",
    folder: "docs",
    content: "# API\n\nBase URL: `https://`\n\n## Authentication\n\n## Endpoints\n\n### `GET /resource`\n\nResponse:\n\n```json\n{}\n```\n",
  },
  {
    id: "deployment",
    title: "deployment.md",
    folder: "docs",
    content: "# Deployment\n\n## Environments\n\n| Env | URL | Branch |\n|---|---|---|\n| Production |  | main |\n\n## Steps\n\n```bash\n\n```\n\n## Rollback\n\n",
  },
  {
    id: "decisions",
    title: "decisions.md",
    folder: "docs",
    content: "# Decisions\n\n## YYYY-MM-DD: Title\n\n**Context:** \n\n**Decision:** \n\n**Consequences:** \n",
  },
  {
    id: "bugs",
    title: "bugs.md",
    folder: "docs",
    content: "# Known bugs\n\n- [ ] **Bug title**: steps to reproduce, expected vs actual\n",
  },
];
