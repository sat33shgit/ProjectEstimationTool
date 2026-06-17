export interface Subtask {
  id?: number;
  name: string;
  estimate_days: number;
  sort_order?: number;
}

export interface Task {
  id?: number;
  name: string;
  category?: string; // kept for backward-compat; mirrors task name on save
  sort_order?: number;
  subtasks: Subtask[];
}

export interface Template {
  id: number;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
  tasks: Task[];
}

export interface Project {
  id: number;
  name: string;
  client: string;
  description: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  tasks: Task[];
}

export interface ProjectSummary {
  id: number;
  name: string;
  client: string;
  status: string;
  created_at: string;
  task_count: number;
  total_days: number;
}

export interface DashboardData {
  project_count: number;
  template_count: number;
  total_days: number;
  avg_days: number;
  projects: ProjectSummary[];
  by_task: { task: string; days: number }[];
  by_project_task: Record<number, { task: string; days: number }[]>;
}

export function taskTotal(task: Task): number {
  return task.subtasks.reduce(
    (sum, s) => sum + (Number(s.estimate_days) || 0),
    0
  );
}

export function tasksTotal(tasks: Task[]): number {
  return tasks.reduce((sum, t) => sum + taskTotal(t), 0);
}
