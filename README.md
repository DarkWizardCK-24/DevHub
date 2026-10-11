<div align="center">

<img src="docs/assets/banner.svg" alt="DevHub — Your Personal Developer Workspace" width="100%" />

<br />
<br />

# DevHub

### Your projects, tasks, notes, snippets, vault and releases — unified in one fast, calm workspace.

DevHub replaces scattered markdown files, messy browser bookmarks, sticky notes, and *"where did I put that API key?"* moments with a high-performance command center built for developers.

<br />

[![Next.js 16](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python 3.12](https://img.shields.io/badge/Python_3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![AES-256-GCM](https://img.shields.io/badge/AES--256--GCM-Vault-4f46e5?style=for-the-badge&logo=security&logoColor=white)](#-zero-knowledge-encrypted-vault)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br />

[**✨ Key Features**](#-key-features) &nbsp;•&nbsp;
[**📸 Screenshot Gallery**](#-screenshot-gallery) &nbsp;•&nbsp;
[**🏗️ Architecture**](#️-system-architecture) &nbsp;•&nbsp;
[**🗓️ Daily Workflow**](#️-a-day-with-devhub) &nbsp;•&nbsp;
[**🚀 Quick Start**](#-quick-start) &nbsp;•&nbsp;
[**🔐 Security & Privacy**](#-security--privacy)

</div>

<br />

---

## 📸 Screenshot Gallery

<div align="center">

### 📊 Command Center & Dashboard
*Greeting hero, live metric tiles, 14-day activity rail, due-soon tasks and latest builds, all in a light, airy layout.*

<img src="docs/assets/screenshots/dashboard-light.png" alt="DevHub dashboard, light theme" width="100%" />

<br />

<img src="docs/assets/screenshots/dashboard-dark.png" alt="DevHub dashboard, dark theme" width="100%" />

</div>

<br />

### 🔐 Invite-only Sign-in
There is no public registration. The admin creates every account, so the login page is the only way in. Light and dark themes persist without flicker.

<table>
  <tr>
    <td width="50%"><img src="docs/assets/screenshots/login-light.png" alt="Login, light theme" width="100%" /></td>
    <td width="50%"><img src="docs/assets/screenshots/login-dark.png" alt="Login, dark theme" width="100%" /></td>
  </tr>
</table>

### 🗂️ Projects: grid, list or compact table
Switch the layout with the toggle next to search; each screen remembers your choice. Every project shows health (on track / at risk / off track), task progress with overdue count and due date.

<img src="docs/assets/screenshots/projects-grid.png" alt="Projects, grid view" width="100%" />

<table>
  <tr>
    <td width="50%"><img src="docs/assets/screenshots/projects-list.png" alt="Projects, list view" width="100%" /></td>
    <td width="50%"><img src="docs/assets/screenshots/projects-compact.png" alt="Projects, compact table" width="100%" /></td>
  </tr>
</table>

### ⚡ Project hub: Pulse, schedule & effort
Open a project for its **Pulse**: completion, time left, estimated vs actual effort, a velocity-based projected finish, a forecast that learns from how long finished tasks really took, and an explained health rating.

<img src="docs/assets/screenshots/project-overview.png" alt="Project pulse, timeline, donut charts and team" width="100%" />

### 👥 Team: who is working on it
Everyone on a project sees its team; admins add people, change roles (editor / viewer) and remove them. Every change lands in the audit log.

<img src="docs/assets/screenshots/project-team.png" alt="Project team" width="100%" />

### 📋 Tasks: List, Board, Timeline & Calendar
Drag-and-drop kanban, a Gantt-style timeline (created → due/completed, today line, project start/target and build milestones), calendar and list views.

<table>
  <tr>
    <td width="50%"><img src="docs/assets/screenshots/project-board.png" alt="Project kanban board" width="100%" /></td>
    <td width="50%"><img src="docs/assets/screenshots/project-tasks.png" alt="Project task timeline" width="100%" /></td>
  </tr>
</table>

<img src="docs/assets/screenshots/tasks-board.png" alt="Kanban board" width="100%" />

### 🔑 Credential vault, 🔐 env vault, 🔗 links, 📝 notes & 📦 builds (inside every project)
The **credential vault** keeps account logins (name, role, email, password, other details); the **env vault** keeps environment secrets. Both are encrypted and masked until revealed.

<table>
  <tr>
    <td width="50%"><img src="docs/assets/screenshots/project-credentials.png" alt="Project credential vault" width="100%" /></td>
    <td width="50%"><img src="docs/assets/screenshots/project-env.png" alt="Project env vault" width="100%" /></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/assets/screenshots/project-links.png" alt="Project link vault" width="100%" /></td>
    <td width="50%"><img src="docs/assets/screenshots/project-activity.png" alt="Project activity timeline" width="100%" /></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/assets/screenshots/project-notes.png" alt="Project notes" width="100%" /></td>
    <td width="50%"><img src="docs/assets/screenshots/project-builds.png" alt="Project builds" width="100%" /></td>
  </tr>
</table>

### 🛡️ Admin: users, projects & audit log
Admins create accounts, reset passwords, change roles, oversee every project and read a filterable, exportable **audit trail** (who, what, when to the second, IP and browser). Secrets never enter the log.

<table>
  <tr>
    <td width="50%"><img src="docs/assets/screenshots/admin-overview.png" alt="Admin overview with clickable stat cards" width="100%" /></td>
    <td width="50%"><img src="docs/assets/screenshots/admin-audit.png" alt="Admin audit log" width="100%" /></td>
    <td width="50%"><img src="docs/assets/screenshots/admin-projects.png" alt="Admin projects" width="100%" /></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/assets/screenshots/admin-users.png" alt="Admin users list" width="100%" /></td>
    <td width="50%"><img src="docs/assets/screenshots/admin-create-user.png" alt="Create user dialog" width="100%" /></td>
  </tr>
</table>

### 📝 Markdown Notes, 🧩 Snippets & 🔑 Encrypted Vault

<img src="docs/assets/screenshots/notes-editor.png" alt="Markdown notes editor" width="100%" />

<table>
  <tr>
    <td width="50%"><img src="docs/assets/screenshots/snippets-grid.png" alt="Code snippets, grid view" width="100%" /></td>
    <td width="50%"><img src="docs/assets/screenshots/snippets-compact.png" alt="Code snippets, compact view" width="100%" /></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/assets/screenshots/vault.png" alt="Credential vault" width="100%" /></td>
    <td width="50%"><img src="docs/assets/screenshots/vault-env.png" alt="Env vault" width="100%" /></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/assets/screenshots/notes-grid.png" alt="Notes, grid view" width="100%" /></td>
    <td width="50%"><img src="docs/assets/screenshots/builds-grid.png" alt="Builds, grid view" width="100%" /></td>
  </tr>
</table>

### 📱 Mobile
Bottom tab bar, sheets and touch-friendly controls.

<table>
  <tr>
    <td width="50%" align="center"><img src="docs/assets/screenshots/mobile-dashboard.png" alt="Mobile dashboard" width="60%" /></td>
    <td width="50%" align="center"><img src="docs/assets/screenshots/mobile-tasks.png" alt="Mobile tasks" width="60%" /></td>
  </tr>
</table>

---

## ✨ Key Features

| Capability | Highlights |
| :--- | :--- |
| **📊 Dashboard** | Personalized greeting, 14-day activity graph, Quick Tools widget, live health pulse, and active metrics. |
| **📁 Project Hub** | Group tasks, technical docs, links, files, and credentials under unified projects with progress indicators. |
| **✅ Task Management** | Switch seamlessly between **Kanban Board**, **Grouped List**, and **Calendar Schedule** views. |
| **📝 Notes & Specs** | Split-pane Markdown editor, live formatting, code blocks, folder trees, and autosave. |
| **🧩 Snippet Manager** | Syntax-highlighted code bank with search across code bodies, language filtering, and 1-tap copy. |
| **🔐 Encrypted Vault** | Zero-knowledge secret storage with AES-256-GCM, auto-lock countdown (30s), and zero log persistence. |
| **📎 Cloud Files** | Direct uploads to Supabase Storage with progress bars, MIME categorisation, and 60-second signed URLs. |
| **🔗 Quick Links** | Intelligent URL bookmarks that auto-detect GitHub, Vercel, Supabase, Figma, and documentation endpoints. |
| **📦 Build Tracker** | Log releases with git branch, commit hash, platform target, artifact links, and changelog notes. |
| **🔎 Global Search** | Instant modal search with <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>K</kbd> across all projects, tasks, notes, and code. |
| **🎨 Design System** | Clean **Inter** and **JetBrains Mono** typography, Electric Indigo palette, and smooth micro-interactions. |

---

## 🏗️ System Architecture

DevHub enforces strict separation of concerns with a modern zero-trust architecture:

<div align="center">

<img src="docs/assets/architecture.svg" alt="DevHub System Architecture Diagram" width="100%" />

</div>

1. **Next.js 16 (App Router)**: Client-side UI using React 19, Tailwind CSS v4, Lucide icons, and SWR for real-time optimistic updates.
2. **FastAPI Backend (Python 3.12)**: Asynchronous REST API validating Supabase JWT bearer tokens, enforcing RBAC, and isolating tenant data.
3. **Supabase Cloud Infrastructure**:
   - **Auth Engine**: Secure PKCE session management and password resets.
   - **PostgreSQL**: 14 normalized tables, full-text search indexes (`tsvector`), and strict schema constraints.
   - **Storage**: Private encrypted bucket serving short-lived signed URLs.

---

## 🗓️ A Day with DevHub

```
 08:30 AM ─── ☕ Check morning dashboard & review overdue/high-priority tasks
 09:15 AM ─── 📋 Drag tasks on Kanban board into "In Progress"
 11:30 AM ─── 📝 Draft API specs in split-pane Markdown editor with live preview
 02:00 PM ─── 🧩 Copy database migration snippet directly from snippet library
 03:45 PM ─── 🔐 Reveal Stripe test API key for 30s; automatically re-masks
 05:30 PM ─── 🚀 Log production release v1.4.0 in build tracker with release notes
 06:00 PM ─── 📈 Watch activity bar fill up on the 14-day contribution graph
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: `20.x` or higher
- **Python**: `3.10` or higher
- Free **[Supabase](https://supabase.com)** project

---

### Step 1: Database Setup
1. Create a project in [Supabase](https://supabase.com).
2. Open the **SQL Editor** and run every file in [`supabase/migrations/`](supabase/migrations) **in filename order**:
   1. `20261003000001_initial_schema.sql`: tables, enums, triggers, RLS
   2. `20261011000001_admin_only_signup.sql`: self-registered accounts stay inactive
   3. `20261012000001_credential_account_role.sql`: account role on credential-vault entries
3. Create a **private** Storage bucket named `devhub-files` (50 MB limit). The initial migration also creates it.
4. **Authentication → Sign In / Providers → turn OFF "Allow new users to sign up".** Accounts are created by the admin only.
5. Under **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback`.

---

### Step 2: Configure Environment Variables

#### Backend (`backend/.env`):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key        # server only
SUPABASE_JWT_SECRET=your-legacy-jwt-secret              # HS256 projects
DATABASE_URL=postgresql://postgres.your-project:DB_PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres
VAULT_ENCRYPTION_KEY=generate-a-fernet-key
CORS_ORIGINS=http://localhost:3000
```

#### Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> [!WARNING]
> Never commit `.env` files (they are git-ignored). The service-role key and database password must stay server-side.

---

### Step 3: Run the Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1        # macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```
API docs: **http://localhost:8000/docs**.

---

### Step 4: Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** and sign in.

---

### 🔑 Admin account & user management

| | |
|---|---|
| **Default admin** | `admin@gmail.com` / `123456` |
| **Regular users** | Created by the admin: **Admin → Users → New user** |
| **Public sign-up** | Removed from the app, and blocked server-side (see below) |

> [!CAUTION]
> `123456` is a throwaway bootstrap password. **Change it** (Admin → Users → Password) before exposing the app anywhere public.

Create or re-create the admin on any project with the Auth admin API:

```bash
curl -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"123456","email_confirm":true,"app_metadata":{"created_by_admin":true}}'
```
then run [`supabase/seed/make_admin.sql`](supabase/seed/make_admin.sql) with that email to grant the `admin` role.

**How accounts stay admin-only:** the app has no register page; the API creates users through the service-role key and flags them with `app_metadata.created_by_admin`; a database trigger marks every profile *inactive* unless that flag is present, so even a direct call to Supabase's `/signup` endpoint yields an account the API rejects.

---

## 🧾 CRUD, roles & auditing

| Module | Create | Read | Update | Delete | Audited |
|---|:--:|:--:|:--:|:--:|:--:|
| Projects (+ pulse) | ✅ | ✅ | ✅ | ✅ owner / admin | ✅ |
| Tasks (list, board, timeline, calendar) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Notes | ✅ | ✅ | ✅ | ✅ | ✅ |
| Files (Supabase Storage) | ✅ | ✅ signed URLs | ✅ | ✅ | ✅ |
| Links | ✅ | ✅ | ✅ | ✅ | ✅ |
| Credentials vault (AES-256) | ✅ | ✅ masked, reveal logged | ✅ | ✅ | ✅ |
| Builds + artifacts | ✅ | ✅ | ✅ | ✅ | ✅ |
| Snippets & tags | ✅ | ✅ | ✅ | ✅ | ✅ |
| Users (admin only) | ✅ | ✅ | ✅ role / active / password | deactivate | ✅ |

**Audit trail.** Every write (and every sign-in/out and credential reveal) appends a row to `activity_logs` in the same transaction as the change, with the actor, action, item name, project, **timestamp**, **IP address** and **browser**. Users see their own history under *Activity*; admins see everyone's under **Admin → Audit log** with filters (module, user, date range, item name), expandable details and CSV export. Secret values are stripped before logging.

**Roles.** `admin` (manages users, sees all projects and the audit log) and `user` (works only inside their own / shared projects). Authorization is enforced in the API; hiding UI is never the only protection.

---

## ☁️ Deployment

<details>
<summary><b>Deploying to Production (Vercel + Render)</b></summary>

<br />

| Component | Recommended Host | Deployment Steps |
| :--- | :--- | :--- |
| **Frontend** | **Vercel** | 1. Import repository on Vercel.<br />2. Set root directory to `frontend`.<br />3. Add environment variables pointing `NEXT_PUBLIC_API_URL` to your backend URL. |
| **Backend** | **Render** | 1. Use the included [`render.yaml`](file:///C:/Users/katar/Desktop/Projects/Web/DevHub/render.yaml) Blueprint.<br />2. Fill in the environment secrets when prompted. |
| **Database** | **Supabase** | Fully managed PostgreSQL, Auth, and Storage. |

> [!NOTE]
> Ensure your production Vercel domain is added to `ALLOWED_ORIGINS` in the backend environment variables and Supabase Redirect URLs.

</details>

<details>
<summary><b>🩺 Troubleshooting & Common Questions</b></summary>

<br />

| Symptom | Cause & Solution |
| :--- | :--- |
| 🧩 **"Connect DevHub to Supabase" Screen** | Frontend `.env.local` variables are missing or unreadable. Restart `npm run dev` after configuring. |
| 📡 **"Can't reach the DevHub API"** | Backend is not running on port 8000 or `NEXT_PUBLIC_API_URL` is pointing to an incorrect URL. |
| 🗄️ **Database Unreachable Error** | Ensure you are using the **Session pooler** (port 5432 or 6543) connection string from Supabase. |
| 👤 **"Account profile is missing"** | The account was created before running migrations. Delete the user in Supabase Auth and have the admin create it again. |
| 🚫 **CORS Error in Console** | Add your frontend origin (e.g., `http://localhost:3000`) to `ALLOWED_ORIGINS` in `backend/.env`. |

</details>

---

## 🔐 Security & Privacy

DevHub is built with defensive defaults to keep side-projects and client secrets secure:

- 🛡️ **Zero-Knowledge Encrypted Vault**: Secrets are encrypted using symmetric Fernet / AES-256 before disk persistence and are never emitted in API logs or application traces.
- 🔒 **Row-Level Security & Tenant Isolation**: Every project, note, task, and link is tied to your account UUID. Other accounts have zero read or write visibility.
- ⏱️ **Auto-Expiring Signed URLs**: Assets uploaded to storage buckets are never made public; short-lived (60s) HMAC signed URLs are generated on demand.
- 🔑 **Dual-Layer Validation**: Strict input filtering in Next.js with Zod schema resolvers and server-side validation with Pydantic v2 schemas.
- 🧪 **Test Suite**: Over 50 automated backend tests verifying access controls, auth sessions, and vault operations.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free for personal and commercial usage.

<div align="center">
<br />
<sub>Crafted with care for developers who want a calmer, more productive workflow.</sub>
</div>
