"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button, Card, Input, Textarea, PageHeader, days } from "./ui";
import TaskEditor from "./TaskEditor";
import ImportFromTemplate from "./ImportFromTemplate";
import { Task, tasksTotal, taskTotal } from "@/lib/types";

const STATUSES = ["Draft", "Estimating", "Sent", "Approved", "Archived"];

export default function ProjectForm({
  id,
  initial,
}: {
  id?: number;
  initial?: {
    name: string;
    client: string;
    description: string;
    status: string;
    tasks: Task[];
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [client, setClient] = useState(initial?.client ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState(initial?.status ?? "Draft");
  const [tasks, setTasks] = useState<Task[]>(initial?.tasks ?? []);
  const [showImport, setShowImport] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleImport(imported: Task[]) {
    setTasks((prev) => [...prev, ...imported]);
    setShowImport(false);
  }

  async function save() {
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { name, client, description, status, tasks };
      if (id) await api.put(`/api/projects/${id}`, payload);
      else await api.post("/api/projects", payload);
      router.push("/projects");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const total = tasksTotal(tasks);

  // Category rollup for the summary panel
  const byCategory: Record<string, number> = {};
  tasks.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + taskTotal(t);
  });

  return (
    <div>
      <PageHeader
        title={id ? "Edit project" : "New project"}
        subtitle="Build the estimate from scratch or import tasks from a template."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save project"}
            </Button>
          </div>
        }
      />

      {error && (
        <Card className="mb-4 p-4 bg-red-50 border-red-200 text-sm text-red-700">
          {error}
        </Card>
      )}

      <Card className="p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp Website"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <Input
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Client name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={1}
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Tasks</h2>
            <Button variant="secondary" onClick={() => setShowImport(true)}>
              ↧ Import from template
            </Button>
          </div>
          <TaskEditor tasks={tasks} onChange={setTasks} />
        </div>

        {/* Estimation summary */}
        <div>
          <Card className="p-5 sticky top-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Estimation summary
            </h3>
            <div className="rounded-lg bg-brand-50 p-4 mb-4">
              <div className="text-xs uppercase tracking-wide text-brand-600">
                Total effort
              </div>
              <div className="mt-1 text-3xl font-bold text-brand-700">
                {days(total)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {(total / 5).toFixed(1)} weeks · {tasks.length} tasks
              </div>
            </div>

            <div className="space-y-2">
              {Object.entries(byCategory).length === 0 && (
                <div className="text-sm text-gray-400">
                  Add tasks to see the breakdown.
                </div>
              )}
              {Object.entries(byCategory).map(([cat, d]) => (
                <div
                  key={cat}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600">{cat}</span>
                  <span className="font-medium text-gray-900">{days(d)}</span>
                </div>
              ))}
            </div>

            {tasks.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4 space-y-1.5">
                {tasks.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-gray-500 truncate pr-2">
                      {t.name}
                    </span>
                    <span className="text-gray-700">{days(taskTotal(t))}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {showImport && (
        <ImportFromTemplate
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
