"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, PageHeader, Button, days } from "@/components/ui";

function fmt(amount: number) {
  return "CA$" + amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function ProjectsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [savingTemplate, setSavingTemplate] = useState<{ id: number; name: string } | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateBusy, setTemplateBusy] = useState(false);
  const [globalRate, setGlobalRate] = useState<number>(100);
  const router = useRouter();

  async function load() {
    try {
      setItems(await api.get("/api/projects"));
    } catch (e: any) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
    api.get("/api/settings").then((d) => setGlobalRate(Number(d.bill_rate) || 100));
  }, []);

  async function remove(id: number) {
    if (!confirm("Delete this project?")) return;
    await api.del(`/api/projects/${id}`);
    load();
  }

  async function duplicate(id: number) {
    setBusyId(id);
    try {
      const { id: newId } = await api.post(`/api/projects/${id}/duplicate`, {});
      router.push(`/projects/${newId}`);
    } catch (e: any) {
      setError(e.message);
      setBusyId(null);
    }
  }

  function openSaveAsTemplate(p: { id: number; name: string }) {
    setTemplateName(p.name);
    setSavingTemplate(p);
  }

  async function confirmSaveAsTemplate() {
    if (!savingTemplate || !templateName.trim()) return;
    setTemplateBusy(true);
    try {
      const proj = await api.get(`/api/projects/${savingTemplate.id}`);
      await api.post("/api/templates", {
        name: templateName.trim(),
        description: "",
        tasks: proj.tasks,
      });
      setSavingTemplate(null);
      router.push("/templates");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTemplateBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Each project has its own estimation built from tasks and subtasks."
        action={
          <Button onClick={() => router.push("/projects/new")}>
            + New project
          </Button>
        }
      />

      {error && (
        <Card className="mb-4 p-4 bg-red-50 border-red-200 text-sm text-red-700">
          {error}
        </Card>
      )}

      {savingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Save as Template</h2>
            <p className="text-sm text-gray-500 mb-4">
              This will create a new template from <strong>{savingTemplate.name}</strong>.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template name</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-4"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && confirmSaveAsTemplate()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSavingTemplate(null)} disabled={templateBusy}>
                Cancel
              </Button>
              <Button onClick={confirmSaveAsTemplate} disabled={templateBusy || !templateName.trim()}>
                {templateBusy ? "Saving..." : "Save Template"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium text-right">Tasks</th>
                <th className="px-5 py-3 font-medium text-right">Total days</th>
                <th className="px-5 py-3 font-medium text-right">Total cost</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && !error && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    No projects yet.
                  </td>
                </tr>
              )}
              {items.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link
                      href={`/projects/${p.id}/view`}
                      className="font-medium text-gray-900 hover:text-brand-600"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{p.client || "—"}</td>
                  <td className="px-5 py-3 text-right text-gray-600">
                    {p.task_count}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">
                    {days(p.total_days)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-green-700">
                    {fmt(p.total_days * (p.bill_rate_override != null ? Number(p.bill_rate_override) : globalRate) * 8)}
                    {p.bill_rate_override != null && (
                      <span className="text-xs font-normal text-gray-400 ml-1">(custom)</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/projects/${p.id}/view`}>
                        <Button variant="secondary">View</Button>
                      </Link>
                      <Link href={`/projects/${p.id}`}>
                        <Button variant="secondary">Edit</Button>
                      </Link>
                      <Button
                        variant="secondary"
                        onClick={() => duplicate(p.id)}
                        disabled={busyId === p.id}
                      >
                        {busyId === p.id ? "Copying..." : "Duplicate"}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => openSaveAsTemplate(p)}
                      >
                        Save as Template
                      </Button>
                      <Button variant="danger" onClick={() => remove(p.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
