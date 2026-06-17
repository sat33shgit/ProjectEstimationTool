"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button, days } from "./ui";
import { Task, taskTotal } from "@/lib/types";

export default function ImportFromTemplate({
  onImport,
  onClose,
}: {
  onImport: (tasks: Task[]) => void;
  onClose: () => void;
}) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/api/templates")
      .then((t) => {
        setTemplates(t);
        if (t.length) setSelectedId(t[0].id);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (selectedId == null) return;
    setLoading(true);
    setDetail(null);
    api
      .get(`/api/templates/${selectedId}`)
      .then((d) => {
        setDetail(d);
        // default: all tasks checked
        const init: Record<number, boolean> = {};
        d.tasks.forEach((_: any, i: number) => (init[i] = true));
        setChecked(init);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedId]);

  function toClonedTasks(tasks: any[]): Task[] {
    // strip ids so they insert fresh into the project
    return tasks.map((t) => ({
      name: t.name,
      category: t.name,
      subtasks: t.subtasks.map((s: any) => ({
        name: s.name,
        estimate_days: Number(s.estimate_days) || 0,
      })),
    }));
  }

  function importSelected() {
    if (!detail) return;
    const picked = detail.tasks.filter((_: any, i: number) => checked[i]);
    if (picked.length === 0) {
      setError("Select at least one task to import.");
      return;
    }
    onImport(toClonedTasks(picked));
  }

  function importAll() {
    if (!detail) return;
    onImport(toClonedTasks(detail.tasks));
  }

  const allChecked =
    detail && detail.tasks.length > 0 && detail.tasks.every((_: any, i: number) => checked[i]);

  function toggleAll() {
    if (!detail) return;
    const next: Record<number, boolean> = {};
    detail.tasks.forEach((_: any, i: number) => (next[i] = !allChecked));
    setChecked(next);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Import from template
            </h3>
            <p className="text-sm text-gray-500">
              Import the whole template or pick tasks one by one.
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="p-5 overflow-y-auto">
          {error && (
            <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {templates.length === 0 ? (
            <div className="text-sm text-gray-400">
              No templates available. Create one first.
            </div>
          ) : (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template
              </label>
              <select
                value={selectedId ?? ""}
                onChange={(e) => setSelectedId(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-4"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({days(t.total_days)})
                  </option>
                ))}
              </select>

              {loading && (
                <div className="text-sm text-gray-400">Loading tasks…</div>
              )}

              {detail && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={toggleAll}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      {allChecked ? "Deselect all" : "Select all"}
                    </button>
                    <span className="text-xs text-gray-400">
                      {detail.tasks.length} tasks
                    </span>
                  </div>
                  <div className="space-y-2">
                    {detail.tasks.map((t: any, i: number) => (
                      <label
                        key={i}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={!!checked[i]}
                          onChange={(e) =>
                            setChecked((c) => ({ ...c, [i]: e.target.checked }))
                          }
                          className="h-4 w-4 accent-brand-600"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {t.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {t.subtasks.length} subtasks
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">
                          {days(taskTotal(t))}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 p-5">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={importAll} disabled={!detail}>
            Import entire template
          </Button>
          <Button onClick={importSelected} disabled={!detail}>
            Import selected tasks
          </Button>
        </div>
      </div>
    </div>
  );
}
