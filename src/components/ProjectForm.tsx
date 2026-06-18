"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button, Card, Input, PageHeader, days } from "./ui";
import TaskEditor from "./TaskEditor";
import ImportFromTemplate from "./ImportFromTemplate";
import { Task, tasksTotal, taskTotal } from "@/lib/types";

function fmt(amount: number) {
  return "CA$" + amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function ProjectForm({
  id,
  initial,
}: {
  id?: number;
  initial?: {
    name: string;
    client: string;
    bill_rate_override?: number | null;
    tasks: Task[];
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [client, setClient] = useState(initial?.client ?? "");
  const [tasks, setTasks] = useState<Task[]>(initial?.tasks ?? []);
  const [showImport, setShowImport] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Billing
  const [globalRate, setGlobalRate] = useState<number>(100);
  const [overrideRaw, setOverrideRaw] = useState<string>(
    initial?.bill_rate_override != null ? String(initial.bill_rate_override) : ""
  );
  const [fxRates, setFxRates] = useState<{ USD: number; INR: number }>({ USD: 0.74, INR: 61.5 });

  useEffect(() => {
    api.get("/api/settings").then((d) => setGlobalRate(Number(d.bill_rate) || 100));
    fetch("https://api.frankfurter.app/latest?base=CAD&symbols=USD,INR")
      .then((r) => r.json())
      .then((d) => { if (d?.rates) setFxRates({ USD: d.rates.USD, INR: d.rates.INR }); })
      .catch(() => {});
  }, []);

  // rates are stored per-hour; 1 day = 8 hours
  const effectiveHourlyRate =
    overrideRaw.trim() !== "" && !isNaN(Number(overrideRaw))
      ? Number(overrideRaw)
      : globalRate;

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
      const bill_rate_override =
        overrideRaw.trim() !== "" && !isNaN(Number(overrideRaw))
          ? Number(overrideRaw)
          : null;
      const payload = { name, client, bill_rate_override, tasks };
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
  const totalCost = total * effectiveHourlyRate * 8;

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              Bill rate (CA$ / hour)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">CA$</span>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={overrideRaw}
                onChange={(e) => setOverrideRaw(e.target.value)}
                placeholder={`Default: CA$${globalRate}`}
              />
              <span className="text-gray-400 text-sm whitespace-nowrap">/ hr</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Leave blank to use global default (CA${globalRate}/hr)
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Tasks</h2>
            <Button variant="secondary" onClick={() => setShowImport(true)}>
              Import from template
            </Button>
          </div>
          <TaskEditor tasks={tasks} onChange={setTasks} />
        </div>

        <div>
          <Card className="p-5 sticky top-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Estimation summary
            </h3>
            <div className="rounded-lg bg-brand-50 p-4 mb-3">
              <div className="text-xs uppercase tracking-wide text-brand-600">
                Total effort
              </div>
              <div className="mt-1 text-3xl font-bold text-brand-700">
                {days(total)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {(total / 5).toFixed(1)} weeks &middot; {tasks.length} tasks
              </div>
            </div>

            <div className="rounded-lg bg-green-50 p-4 mb-4">
              <div className="text-xs uppercase tracking-wide text-green-700">
                Total cost
              </div>
              <div className="mt-1 text-2xl font-bold text-green-800">
                {fmt(totalCost)}
              </div>
              <div className="mt-2 flex gap-2 text-xs">
                <span className="rounded bg-white border border-green-200 px-2 py-0.5 text-gray-600">
                  US${Math.round(totalCost * fxRates.USD).toLocaleString()}
                </span>
                <span className="rounded bg-white border border-green-200 px-2 py-0.5 text-gray-600">
                  ₹{Math.round(totalCost * fxRates.INR).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {fmt(effectiveHourlyRate)}/hr · {fmt(effectiveHourlyRate * 8)}/day
                {overrideRaw.trim() !== "" ? " (project rate)" : " (global rate)"}
              </div>
            </div>

            <div className="space-y-1.5">
              {tasks.length === 0 && (
                <div className="text-sm text-gray-400">
                  Add tasks to see the breakdown.
                </div>
              )}
              {tasks.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600 truncate pr-2">{t.name}</span>
                  <span className="font-medium text-gray-900">
                    {days(taskTotal(t))}
                    <span className="text-gray-400 font-normal ml-1">
                      ({fmt(taskTotal(t) * effectiveHourlyRate * 8)})
                    </span>
                  </span>
                </div>
              ))}
            </div>
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
