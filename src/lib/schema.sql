-- Project Estimation Tool schema
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS templates (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS template_tasks (
  id           SERIAL PRIMARY KEY,
  template_id  INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  category     TEXT DEFAULT 'General',
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS template_subtasks (
  id               SERIAL PRIMARY KEY,
  template_task_id INTEGER NOT NULL REFERENCES template_tasks(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  estimate_days    NUMERIC(8,2) NOT NULL DEFAULT 0,
  sort_order       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS projects (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  client       TEXT DEFAULT '',
  description  TEXT DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'Draft',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_tasks (
  id          SERIAL PRIMARY KEY,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category    TEXT DEFAULT 'General',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS project_subtasks (
  id               SERIAL PRIMARY KEY,
  project_task_id  INTEGER NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  estimate_days    NUMERIC(8,2) NOT NULL DEFAULT 0,
  sort_order       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_template_tasks_template ON template_tasks(template_id);
CREATE INDEX IF NOT EXISTS idx_template_subtasks_task ON template_subtasks(template_task_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_subtasks_task ON project_subtasks(project_task_id);
