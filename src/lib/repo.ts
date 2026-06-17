import { pool, query, queryOne, withTransaction } from "./db";
import type { Template, Project, Task, DashboardData } from "./types";

// ---------- Templates ----------

export async function listTemplates() {
  return query(
    `SELECT t.id, t.name, t.description, t.created_at, t.updated_at,
            COALESCE(tt.task_count,0)::int AS task_count,
            COALESCE(st.total_days,0)::float AS total_days
     FROM templates t
     LEFT JOIN (
       SELECT template_id, COUNT(*) AS task_count
       FROM template_tasks GROUP BY template_id
     ) tt ON tt.template_id = t.id
     LEFT JOIN (
       SELECT tk.template_id, SUM(s.estimate_days) AS total_days
       FROM template_tasks tk
       JOIN template_subtasks s ON s.template_task_id = tk.id
       GROUP BY tk.template_id
     ) st ON st.template_id = t.id
     ORDER BY t.created_at DESC`
  );
}

export async function getTemplate(id: number): Promise<Template | null> {
  const tpl = await queryOne<any>(
    "SELECT id, name, description, created_at, updated_at FROM templates WHERE id=$1",
    [id]
  );
  if (!tpl) return null;
  const tasks = await query<any>(
    "SELECT id, name, category, sort_order FROM template_tasks WHERE template_id=$1 ORDER BY sort_order, id",
    [id]
  );
  for (const task of tasks) {
    task.subtasks = await query(
      "SELECT id, name, estimate_days::float AS estimate_days, sort_order FROM template_subtasks WHERE template_task_id=$1 ORDER BY sort_order, id",
      [task.id]
    );
  }
  return { ...tpl, tasks } as Template;
}

export async function createTemplate(data: {
  name: string;
  description?: string;
  tasks: Task[];
}) {
  return withTransaction(async (c) => {
    const t = await c.query(
      "INSERT INTO templates (name, description) VALUES ($1,$2) RETURNING id",
      [data.name, data.description ?? ""]
    );
    const id = t.rows[0].id;
    await insertTemplateTasks(c, id, data.tasks);
    return id as number;
  });
}

export async function updateTemplate(
  id: number,
  data: { name: string; description?: string; tasks: Task[] }
) {
  return withTransaction(async (c) => {
    await c.query(
      "UPDATE templates SET name=$1, description=$2, updated_at=now() WHERE id=$3",
      [data.name, data.description ?? "", id]
    );
    await c.query("DELETE FROM template_tasks WHERE template_id=$1", [id]);
    await insertTemplateTasks(c, id, data.tasks);
    return id;
  });
}

async function insertTemplateTasks(c: any, templateId: number, tasks: Task[]) {
  for (let ti = 0; ti < tasks.length; ti++) {
    const task = tasks[ti];
    const tt = await c.query(
      "INSERT INTO template_tasks (template_id, name, category, sort_order) VALUES ($1,$2,$3,$4) RETURNING id",
      [templateId, task.name, task.name, ti]
    );
    const taskId = tt.rows[0].id;
    for (let si = 0; si < (task.subtasks || []).length; si++) {
      const s = task.subtasks[si];
      await c.query(
        "INSERT INTO template_subtasks (template_task_id, name, estimate_days, sort_order) VALUES ($1,$2,$3,$4)",
        [taskId, s.name, Number(s.estimate_days) || 0, si]
      );
    }
  }
}

export async function deleteTemplate(id: number) {
  await query("DELETE FROM templates WHERE id=$1", [id]);
}

// ---------- Projects ----------

export async function listProjects() {
  return query(
    `SELECT p.id, p.name, p.client, p.status, p.created_at,
            COALESCE(pt.task_count,0)::int AS task_count,
            COALESCE(ps.total_days,0)::float AS total_days
     FROM projects p
     LEFT JOIN (
       SELECT project_id, COUNT(*) AS task_count
       FROM project_tasks GROUP BY project_id
     ) pt ON pt.project_id = p.id
     LEFT JOIN (
       SELECT tk.project_id, SUM(s.estimate_days) AS total_days
       FROM project_tasks tk
       JOIN project_subtasks s ON s.project_task_id = tk.id
       GROUP BY tk.project_id
     ) ps ON ps.project_id = p.id
     ORDER BY p.created_at DESC`
  );
}

export async function getProject(id: number): Promise<Project | null> {
  const p = await queryOne<any>(
    "SELECT id, name, client, description, status, created_at, updated_at FROM projects WHERE id=$1",
    [id]
  );
  if (!p) return null;
  const tasks = await query<any>(
    "SELECT id, name, category, sort_order FROM project_tasks WHERE project_id=$1 ORDER BY sort_order, id",
    [id]
  );
  for (const task of tasks) {
    task.subtasks = await query(
      "SELECT id, name, estimate_days::float AS estimate_days, sort_order FROM project_subtasks WHERE project_task_id=$1 ORDER BY sort_order, id",
      [task.id]
    );
  }
  return { ...p, tasks } as Project;
}

export async function createProject(data: {
  name: string;
  client?: string;
  description?: string;
  status?: string;
  tasks?: Task[];
}) {
  return withTransaction(async (c) => {
    const p = await c.query(
      "INSERT INTO projects (name, client, description, status) VALUES ($1,$2,$3,$4) RETURNING id",
      [data.name, data.client ?? "", data.description ?? "", data.status ?? "Draft"]
    );
    const id = p.rows[0].id;
    if (data.tasks?.length) await insertProjectTasks(c, id, data.tasks);
    return id as number;
  });
}

export async function updateProject(
  id: number,
  data: {
    name: string;
    client?: string;
    description?: string;
    status?: string;
    tasks: Task[];
  }
) {
  return withTransaction(async (c) => {
    await c.query(
      "UPDATE projects SET name=$1, client=$2, description=$3, status=$4, updated_at=now() WHERE id=$5",
      [data.name, data.client ?? "", data.description ?? "", data.status ?? "Draft", id]
    );
    await c.query("DELETE FROM project_tasks WHERE project_id=$1", [id]);
    await insertProjectTasks(c, id, data.tasks);
    return id;
  });
}

async function insertProjectTasks(c: any, projectId: number, tasks: Task[]) {
  for (let ti = 0; ti < tasks.length; ti++) {
    const task = tasks[ti];
    const tt = await c.query(
      "INSERT INTO project_tasks (project_id, name, category, sort_order) VALUES ($1,$2,$3,$4) RETURNING id",
      [projectId, task.name, task.name, ti]
    );
    const taskId = tt.rows[0].id;
    for (let si = 0; si < (task.subtasks || []).length; si++) {
      const s = task.subtasks[si];
      await c.query(
        "INSERT INTO project_subtasks (project_task_id, name, estimate_days, sort_order) VALUES ($1,$2,$3,$4)",
        [taskId, s.name, Number(s.estimate_days) || 0, si]
      );
    }
  }
}

export async function deleteProject(id: number) {
  await query("DELETE FROM projects WHERE id=$1", [id]);
}

// ---------- Dashboard ----------

export async function getDashboard(): Promise<DashboardData> {
  const counts = await queryOne<any>(
    `SELECT
       (SELECT COUNT(*) FROM projects)::int AS project_count,
       (SELECT COUNT(*) FROM templates)::int AS template_count`
  );
  const projects = await listProjects();
  const total_days = projects.reduce(
    (s: number, p: any) => s + (Number(p.total_days) || 0),
    0
  );
  const avg_days = projects.length ? total_days / projects.length : 0;

  // Overall effort by task (across all projects)
  const by_task = await query<any>(
    `SELECT pt.name AS task, SUM(s.estimate_days)::float AS days
     FROM project_tasks pt
     JOIN project_subtasks s ON s.project_task_id = pt.id
     GROUP BY pt.name
     ORDER BY days DESC
     LIMIT 12`
  );

  // Effort by task per project (used to filter the pie chart when a bar is clicked)
  const perProjectRows = await query<any>(
    `SELECT pt.project_id AS project_id, pt.name AS task,
            SUM(s.estimate_days)::float AS days
     FROM project_tasks pt
     JOIN project_subtasks s ON s.project_task_id = pt.id
     GROUP BY pt.project_id, pt.name
     ORDER BY days DESC`
  );
  const by_project_task: Record<number, { task: string; days: number }[]> = {};
  for (const r of perProjectRows as any[]) {
    const pid = Number(r.project_id);
    (by_project_task[pid] ||= []).push({ task: r.task, days: Number(r.days) || 0 });
  }

  return {
    project_count: counts?.project_count ?? 0,
    template_count: counts?.template_count ?? 0,
    total_days,
    avg_days,
    projects: projects as any,
    by_task,
    by_project_task,
  };
}

export { pool };
