"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button, Card, Input, Textarea, PageHeader, days } from "./ui";
import TaskEditor from "./TaskEditor";
import { Task, tasksTotal } from "@/lib/types";

export default function TemplateForm({
  id,
  initial,
}: {
  id?: number;
  initial?: { name: string; description: string; tasks: Task[] };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tasks, setTasks] = useState<Task[]>(initial?.tasks ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) {
      setError("Template name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { name, description, tasks };
      if (id) await api.put(`/api/templates/${id}`, payload);
      else await api.post("/api/templates", payload);
      router.push("/templates");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={id ? "Edit template" : "New template"}
        subtitle="Define tasks and subtasks with default day estimates."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save template"}
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Template name
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Standard Website Build"
          className="mb-4"
        />
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Optional notes about when to use this template"
        />
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Tasks</h2>
        <div className="text-sm text-gray-500">
          Total:{" "}
          <span className="font-semibold text-gray-900">
            {days(tasksTotal(tasks))}
          </span>
        </div>
      </div>

      <TaskEditor tasks={tasks} onChange={setTasks} />
    </div>
  );
}
