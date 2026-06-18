"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button, Card, PageHeader, daysFromHours, hours } from "@/components/ui";
import type { Project, Task } from "@/lib/types";
import { tasksTotal, taskTotal } from "@/lib/types";

function fmt(amount: number) {
  return "CA$" + amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function ProjectViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [globalRate, setGlobalRate] = useState(100);
  const [fxRates, setFxRates] = useState({ USD: 0.74, INR: 61.5 });
  const [error, setError] = useState<string | null>(null);
  const [openTasks, setOpenTasks] = useState<Record<number, boolean>>({});

  function toggleTask(i: number) {
    setOpenTasks((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  useEffect(() => {
    api.get(`/api/projects/${id}`).then(setProject).catch((e) => setError(e.message));
    api.get("/api/settings").then((d) => setGlobalRate(Number(d.bill_rate) || 100));
    fetch("https://api.frankfurter.app/latest?base=CAD&symbols=USD,INR")
      .then((r) => r.json())
      .then((d) => { if (d?.rates) setFxRates({ USD: d.rates.USD, INR: d.rates.INR }); })
      .catch(() => {});
  }, [id]);

  async function handleDelete() {
    if (!confirm(`Delete project "${project?.name}"?`)) return;
    await api.del(`/api/projects/${id}`);
    router.push("/projects");
  }

  if (error) {
    return (
      <Card className="p-4 bg-red-50 border-red-200 text-sm text-red-700">{error}</Card>
    );
  }

  if (!project) {
    return <Card className="p-8 text-center text-sm text-gray-400">Loading…</Card>;
  }

  const effectiveRate = project.bill_rate_override ?? globalRate;
  const total = tasksTotal(project.tasks);
  const totalCost = total * effectiveRate;

  return (
    <div>
      <PageHeader
        title={project.name}
        subtitle={project.client ? `Client: ${project.client}` : "No client"}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/projects/${id}`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        }
      />

      {/* Summary stats — 2 cols on mobile, 5 on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <Card className="p-3 sm:p-4">
          <div className="text-xs uppercase tracking-wide text-gray-400">Tasks</div>
          <div className="mt-1 text-lg sm:text-xl font-semibold text-gray-900">{project.tasks.length}</div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="text-xs uppercase tracking-wide text-gray-400">Total hours</div>
          <div className="mt-1 text-lg sm:text-xl font-semibold text-gray-900">{hours(total)}</div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="text-xs uppercase tracking-wide text-gray-400">Total days</div>
          <div className="mt-1 text-lg sm:text-xl font-semibold text-gray-900">
            {daysFromHours(total)}
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="text-xs uppercase tracking-wide text-gray-400">Total weeks</div>
          <div className="mt-1 text-lg sm:text-xl font-semibold text-gray-900">{(total / 40).toFixed(1)}</div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="text-xs uppercase tracking-wide text-gray-400">Total cost</div>
          <div className="mt-1 text-lg sm:text-xl font-semibold text-green-700">{fmt(totalCost)}</div>
        </Card>
      </div>

      {/* Cost breakdown card */}
      <Card className="p-4 sm:p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Cost breakdown</h3>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded bg-brand-50 border border-brand-200 px-3 py-1.5 text-brand-700">
            {fmt(totalCost)} CAD
          </span>
          <span className="rounded bg-gray-50 border border-gray-200 px-3 py-1.5 text-gray-700">
            US${Math.round(totalCost * fxRates.USD).toLocaleString()}
          </span>
          <span className="rounded bg-gray-50 border border-gray-200 px-3 py-1.5 text-gray-700">
            ₹{Math.round(totalCost * fxRates.INR).toLocaleString()}
          </span>
          <span className="rounded bg-gray-50 border border-gray-200 px-3 py-1.5 text-gray-500 text-xs self-center">
            {fmt(effectiveRate)}/hr
            {project.bill_rate_override ? " (project rate)" : " (global rate)"}
          </span>
        </div>
      </Card>

      {/* Tasks */}
      <div className="space-y-3">
        {project.tasks.length === 0 && (
          <Card className="p-8 text-center text-sm text-gray-400">No tasks.</Card>
        )}
        {project.tasks.map((task: Task, i: number) => {
          const taskHours = taskTotal(task);
          const hasSubs = task.subtasks?.length > 0;
          const isOpen = !!openTasks[i];
          return (
            <Card key={i} className="overflow-hidden">
              <button
                type="button"
                onClick={() => hasSubs && toggleTask(i)}
                className={`w-full flex items-center justify-between px-4 sm:px-5 py-3 bg-gray-50 text-left ${
                  hasSubs ? "cursor-pointer hover:bg-gray-100" : "cursor-default"
                } ${hasSubs && isOpen ? "border-b border-gray-100" : ""}`}
              >
                <div className="flex items-center gap-2">
                  {hasSubs && (
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold leading-none ${
                      isOpen
                        ? "border-brand-200 bg-brand-50 text-brand-600"
                        : "border-gray-300 bg-white text-gray-500"
                    }`}>
                      {isOpen ? "−" : "+"}
                    </span>
                  )}
                  <h3 className="font-semibold text-gray-800 text-sm">{task.name}</h3>
                  {hasSubs && (
                    <span className="text-xs text-gray-400">({task.subtasks.length})</span>
                  )}
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span className="font-semibold text-gray-900 text-sm">{hours(taskHours)}</span>
                  <span className="text-xs text-gray-400 ml-1">({daysFromHours(taskHours)})</span>
                </div>
              </button>
              {hasSubs && isOpen && (
                <div className="divide-y divide-gray-50">
                  {task.subtasks.map((st, j) => (
                    <div key={j} className="flex items-center justify-between px-4 sm:px-5 py-2 text-sm">
                      <span className="text-gray-600">
                        <span className="text-gray-300 mr-2">↳</span>
                        {st.name}
                      </span>
                      <span className="font-medium text-gray-900 shrink-0 ml-3">
                        {hours(Number(st.estimate_days))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
