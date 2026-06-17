# Project Estimation Tool

A simple web app to estimate projects (especially websites) using reusable
**templates** of tasks and subtasks, then build a per-project estimate by
importing tasks (whole template or task-by-task), adding subtasks, and getting a
consolidated effort total in **days**.

Built with **Next.js (React + API routes)** and **PostgreSQL**. Deploys cleanly
to **Vercel** with **Vercel Postgres**.

## Features

- **Templates** — create reusable templates with many tasks, each task with one
  or more subtasks. Each subtask has a day estimate; the task total is the sum of
  its subtasks.
- **Projects** — create a project and import the **entire template** or pick
  **tasks one by one**. Customize freely: add/remove tasks, add subtasks, change
  estimates.
- **Live estimation** — a summary panel shows total days, weeks, and a breakdown
  by category as you edit.
- **Dashboard** — project count, template count, total & average estimated days,
  a bar chart of effort per project, a pie chart of effort by category, and a
  table of all projects.

Estimation logic: **task total = sum of its subtasks; project total = sum of all
tasks.** (As chosen during setup.)

## Tech stack

- Next.js 14 (App Router) — React UI + API routes in one app
- PostgreSQL via `pg`
- Tailwind CSS (clean white UI)
- Recharts for the dashboard charts

---

## Run locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start Postgres** and create a database, e.g. `estimation`.

3. **Configure the connection.** Copy `.env.example` to `.env` and set:

   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/estimation
   ```

4. **Create tables + seed a sample template**

   ```bash
   npm run db:init
   ```

5. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000

---

## Deploy to Vercel (with Vercel Postgres)

1. Push this folder to a Git repo (GitHub/GitLab/Bitbucket).
2. In Vercel, **New Project** → import the repo. Framework auto-detects as
   Next.js. Deploy.
3. In the project, go to **Storage → Create Database → Postgres** (Neon-backed).
   Vercel automatically adds env vars including **`POSTGRES_URL`** to the project.
   The app reads `POSTGRES_URL` first, then `DATABASE_URL`.
4. **Redeploy** so the function picks up the new env vars.
5. **Create the tables.** Two options:
   - Open the deployed app — the Dashboard shows an **"Initialize database"**
     button when tables are missing. Click it. *(This creates tables but does not
     seed the sample template.)*
   - Or seed locally against the cloud DB: copy the `POSTGRES_URL` value from
     Vercel into a local `.env` as `DATABASE_URL`, then run `npm run db:init`
     (this also adds the sample "Standard Website Build" template).

That's it — you'll have a live URL.

> Note: with serverless Postgres, consider Vercel's connection pooling
> (`POSTGRES_URL` from Vercel already points to the pooled endpoint).

---

## Project structure

```
src/
  app/
    page.tsx                 Dashboard (charts + totals + table)
    templates/               Template list / new / edit
    projects/                Project list / new / edit (estimation editor)
    api/                     REST API routes
      templates/ ...         CRUD for templates
      projects/  ...         CRUD for projects
      dashboard/             Aggregated dashboard data
      init-db/               POST to create tables (for Vercel)
  components/                Nav, UI primitives, TaskEditor, forms, import modal
  lib/
    db.ts                    pg pool + query helpers
    repo.ts                  Data access (templates, projects, dashboard)
    schema.sql               Database schema
    types.ts                 Shared types + estimation math
scripts/
  db-init.mjs                Applies schema + seeds sample template
```

## How the estimation flows

1. Create a **template** (e.g. "Standard Website Build") with tasks like
   Research, UI/UX Design, Frontend, Backend, QA, Deployment — each broken into
   subtasks with day estimates.
2. Create a **project**, click **Import from template**, and either import the
   whole template or check specific tasks to bring in.
3. Adjust estimates, add subtasks, add more tasks. The **Estimation summary**
   panel updates live with the total in days/weeks and a per-category breakdown.
4. Save. The **Dashboard** aggregates all projects with charts and a table.
