"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button, Card, PageHeader, hours } from "@/components/ui";

type Project = {
  id: number;
  name: string;
  client: string;
  status: string;
  task_count: number;
  total_days: number;
  created_at: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await api.get("/api/projects");
      setProjects(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete project "${name}"?`)) return;
    await api.del(`/api/projects/${id}`);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleDuplicate(id: number) {
    await api.post(`/api/projects/${id}/duplicate`, {});
    load();
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="All estimation projects."
        action={
          <Link href="/projects/new">
            <Button>New project</Button>
          </Link>
        }
      />

      {error && (
        <Card className="mb-4 p-4 bg-red-50 border-red-200 text-sm text-red-700">
          {error}
        </Card>
      )}

      {loading ? (
        <Card className="p-8 text-center text-sm text-gray-400">Loading…</Card>
      ) : projects.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-gray-400 mb-4">No projects yet.</div>
          <Link href="/projects/new">
            <Button>Create your first project</Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="flex flex-col gap-3 md:hidden">
            {projects.map((p) => (
              <Card key={p.id} className="p-4">
                <Link
                  href={`/projects/${p.id}/view`}
                  className="text-base font-semibold text-gray-900 hover:text-brand-600"
                >
                  {p.name}
                </Link>
                {p.client && (
                  <p className="text-sm text-gray-500 mt-0.5">{p.client}</p>
                )}
                <div className="mt-2 text-sm text-gray-500">
                  {p.task_count} tasks &middot;{" "}
                  <span className="font-semibold text-gray-900">{hours(p.total_days)}</span>
                  <span className="text-gray-400 text-xs ml-1">({(() => { const d = p.total_days / 8; return `${d % 1 === 0 ? d : d.toFixed(2)}d`; })()})</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/projects/${p.id}/view`}>
                    <Button variant="secondary">View</Button>
                  </Link>
                  <Link href={`/projects/${p.id}`}>
                    <Button variant="secondary">Edit</Button>
                  </Link>
                  <Button variant="secondary" onClick={() => handleDuplicate(p.id)}>
                    Copy
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(p.id, p.name)}>
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="px-5 py-3 font-medium">Project</th>
                    <th className="px-5 py-3 font-medium">Client</th>
                    <th className="px-5 py-3 font-medium text-right">Tasks</th>
                    <th className="px-5 py-3 font-medium text-right">Total hours</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
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
                      <td className="px-5 py-3 text-right text-gray-600">{p.task_count}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">
                        {hours(p.total_days)}
                        <span className="text-gray-400 font-normal ml-1 text-xs">({(() => { const d = p.total_days / 8; return `${d % 1 === 0 ? d : d.toFixed(2)}d`; })()})</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/projects/${p.id}/view`}>
                            <Button variant="secondary" className="px-2.5 py-1 text-xs">View</Button>
                          </Link>
                          <Link href={`/projects/${p.id}`}>
                            <Button variant="secondary" className="px-2.5 py-1 text-xs">Edit</Button>
                          </Link>
                          <Button
                            variant="secondary"
                            className="px-2.5 py-1 text-xs"
                            onClick={() => handleDuplicate(p.id)}
                          >
                            Copy
                          </Button>
                          <Button
                            variant="danger"
                            className="px-2.5 py-1 text-xs"
                            onClick={() => handleDelete(p.id, p.name)}
                          >
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
        </>
      )}
    </div>
  );
}
