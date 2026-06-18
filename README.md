# Project Estimation Tool

A web app to estimate projects using reusable **templates** of tasks and subtasks,
then build per-project estimates with live **cost calculations** in CAD, USD, and INR.

---

## Tech stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 14.2.5 | App Router, server & client components, API routes |
| **React** | 18.3 | UI component model, hooks (`useState`, `useEffect`, `useMemo`) |
| **TypeScript** | 5.5 | Static typing across all source files (`strict` mode) |
| **Tailwind CSS** | 3.4 | Utility-first styling with a custom `brand` colour palette |
| **Recharts** | 2.12 | Bar chart (effort by project) and pie chart (effort by task) on dashboard |

### Backend / API
| Technology | Version | Purpose |
|---|---|---|
| **Next.js API Routes** | 14.2.5 | REST endpoints under `src/app/api/` (App Router route handlers) |
| **node-postgres (`pg`)** | 8.12 | PostgreSQL client; connection pooling via `pg.Pool` |
| **PostgreSQL** | any 14+ | Primary data store (Neon hosted in production) |

### Data layer
- **`src/lib/db.ts`** — pool setup, SSL auto-detection, `query()` / `queryOne()` / `withTransaction()` helpers
- **`src/lib/repo.ts`** — all SQL queries for projects, templates, settings, and dashboard aggregation
- **`src/lib/schema.sql`** — fully idempotent schema (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`); applied via the "Initialize database" button or `npm run db:init`

### External services
| Service | Purpose |
|---|---|
| **[Neon](https://neon.tech)** | Serverless PostgreSQL hosting (used via Vercel Postgres integration) |
| **[frankfurter.app](https://api.frankfurter.app)** | Live CAD → USD / INR exchange rates; hardcoded fallback (`USD 0.74`, `INR 61.5`) used if fetch fails |

### Toolchain
| Tool | Version | Purpose |
|---|---|---|
| **TypeScript compiler** | 5.5 | `tsc --noEmit` for static analysis; target ES2020 |
| **PostCSS** | 8.4 | Required by Tailwind |
| **Autoprefixer** | 10.4 | CSS vendor prefixes via PostCSS |
| **ESLint** | via Next.js | `npm run lint` |
| **Node.js** | 18+ | Runtime (local dev and Vercel serverless functions) |

### Deployment
- **Vercel** — zero-config Next.js deployment; serverless functions for all API routes
- **Vercel Postgres (Neon)** — managed PostgreSQL; `POSTGRES_URL` injected automatically

---

## Features

- **Templates** — reusable sets of tasks and subtasks with day estimates
- **Projects** — import a full template or individual tasks, then customize freely; estimates update live
- **Bill rate & cost** — global default rate (CA$/hr) set in Settings, overridable per project; total cost shown in CA$, US$, and ₹ using live FX rates
- **Save as Template** — convert any project into a reusable template from the list or view page
- **Dashboard** — project/template counts, total & average days, bar chart (click to filter pie), pie chart with hours in labels
- **Settings** — CA$/hr input with read-only CA$/day equivalent and a live CAD/USD/INR rates table

---

## Run locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start Postgres** and create a database, e.g. `estimation`.

3. **Configure the connection** — copy `.env.example` to `.env.local` and set:

   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/estimation
   ```

4. **Apply schema**

   ```bash
   npm run db:init
   ```

5. **Start dev server**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000. If tables are missing, click **"Initialize database"** on the Dashboard.

---

## Deploy to Vercel

1. Push to a Git repo (GitHub / GitLab / Bitbucket).
2. **New Project** in Vercel → import the repo. Framework detected as Next.js automatically.
3. Go to **Storage → Create Database → Postgres** (Neon). Vercel injects `POSTGRES_URL` and related vars.
4. **Redeploy** so functions pick up the new env vars.
5. Open the app → Dashboard → **"Initialize database"** to create tables and seed the default bill rate.

---

## Project structure

```
src/
  app/
    page.tsx                  Dashboard
    projects/                 List / new / edit / view
    templates/                List / new / edit / view
    settings/                 Global bill rate + FX table
    api/
      projects/               CRUD + duplicate
      templates/              CRUD + duplicate
      settings/               GET + PUT bill rate
      dashboard/              Aggregated stats query
      init-db/                POST — applies schema.sql
  components/
    Nav.tsx                   Sidebar navigation
    ProjectForm.tsx           Create/edit project with live cost summary
    TemplateForm.tsx          Create/edit template
    TaskEditor.tsx            Task + subtask editor (add/remove/reorder)
    TaskAccordion.tsx         Read-only task/subtask accordion
    ImportFromTemplate.tsx    Modal — import tasks from a template
    ui.tsx                    Button, Card, Input, Badge, PageHeader, days()
  lib/
    db.ts                     pg Pool + query/queryOne/withTransaction
    repo.ts                   All data access functions
    schema.sql                Idempotent DDL
    types.ts                  TypeScript interfaces + taskTotal/tasksTotal
    api.ts                    Client-side get/post/put/del helpers
scripts/
  db-init.mjs                 Local schema apply script
```

## Estimation & cost logic

```
task_total    = sum(subtask.estimate_days)
project_total = sum(task_total)
total_cost    = project_total × effective_hourly_rate × 8
effective_rate = project.bill_rate_override ?? settings.bill_rate
```

All rates are stored and calculated in **CAD per hour**. The ×8 converts days to hours.
