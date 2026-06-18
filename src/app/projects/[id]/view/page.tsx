"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, PageHeader, Button, days } from "@/components/ui";
import TaskAccordion from "@/components/TaskAccordion";
import { tasksTotal, Task } from "@/lib/types";

function fmt(amount: number) {
  return "CA$" + amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function ViewProjectPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const [proj, setProj] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateBusy, setTemplateBusy] = useState(false);
  const [globalRate, setGlobalRate] = useState<number>(100);
  const [fxRates, setFxRates] = useState<{ USD: number; INR: number }>({ USD: 0.74, INR: 61.5 });

  useEffect(() => {
    api
      .get(`/api/projects/${id}`)
      .then((p) => { setProj(p); setTemplateName(p.name); })
      .catch((e) => setError(e.message));
    api.get("/api/settings").then((d) => setGlobalRate(Number(d.bill_rate) || 100));
    fetch("https://api.frankfurter.app/latest?base=CAD&symbols=USD,INR")
      .then((r) => r.json())
      .then((d) => { if (d?.rates) setFxRates({ USD: d.rates.USD, INR: d.rates.INR }); })
      .catch(() => {});
  }, [id]);

  async function saveAsTemplate() {
    if (!templateName.trim() || !proj) return;
    setTemplateBusy(true);
    try {
      await api.post("/api/templates", {
        name: templateName.trim(),
        description: "",
        tasks: proj.tasks,
      });
      setShowTemplateModal(false);
      router.push("/templates");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTemplateBusy(false);
    }
  }

  if (error) return <div className="text-sm text-red-600">Error: {error}</div>;
  if (!proj) return <div className="text-sm text-gray-400">Loading...</div>;

  const total = tasksTotal(proj.tasks);
  // rates are per-hour; 1 day = 8 hours
  const effectiveHourlyRate = proj.bill_rate_override != null ? Number(proj.bill_rate_override) : globalRate;
  const totalCost = total * effectiveHourlyRate * 8;

  return (
    <div>
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Save as Template</h2>
            <p className="text-sm text-gray-500 mb-4">
              This will create a new template from <strong>{proj.name}</strong>.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template name</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-4"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && saveAsTemplate()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowTemplateModal(false)} disabled={templateBusy}>
                Cancel
              </Button>
              <Button onClick={saveAsTemplate} disabled={templateBusy || !templateName.trim()}>
                {templateBusy ? "Saving..." : "Save Template"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title={proj.name}
        subtitle={proj.client || ""}
        action={
          <div className="flex gap-2">
            <Link href="/projects">
              <Button variant="secondary">Back</Button>
            </Link>
            <Button variant="secondary" onClick={() => setShowTemplateModal(true)}>
              Save as Template
            </Button>
            <Link href={`/projects/${id}`}>
              <Button>Edit project</Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Stat label="Tasks" value={proj.tasks.length} />
        <Stat
          label="Subtasks"
          value={proj.tasks.reduce(
            (n: number, t: Task) => n + t.subtasks.length,
            0
          )}
        />
        <Stat label="Total estimate" value={days(total)} />
        <Stat
          label={`Total cost (${fmt(effectiveHourlyRate)}/hr · ${fmt(effectiveHourlyRate * 8)}/day${proj.bill_rate_override != null ? " – project rate" : " – global rate"})`}
          value={
            <div>
              <div className="text-xl font-semibold text-green-700">{fmt(totalCost)}</div>
              <div className="flex gap-2 mt-1">
                <span className="text-xs rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-500">
                  US${Math.round(totalCost * fxRates.USD).toLocaleString()}
                </span>
                <span className="text-xs rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-500">
                  ₹{Math.round(totalCost * fxRates.INR).toLocaleString()}
                </span>
              </div>
            </div>
          }
        />
      </div>

      <TaskAccordion tasks={proj.tasks} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-gray-400">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-gray-900">{value}</div>
    </Card>
  );
}
