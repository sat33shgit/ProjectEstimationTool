"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, PageHeader, Button, Badge, days } from "@/components/ui";

export default function ProjectsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
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
  }, []);

  async function remove(id: number) {
    if (!confirm("Delete this project?")) return;
    await api.del(`/api/projects/${id}`);
    load();
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

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Tasks</th>
                <th className="px-5 py-3 font-medium text-right">Total days</th>
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
                  <td className="px-5 py-3">
                    <Badge>{p.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600">
                    {p.task_count}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">
                    {days(p.total_days)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/projects/${p.id}/view`}>
                        <Button variant="secondary">View</Button>
                      </Link>
                      <Link href={`/projects/${p.id}`}>
                        <Button variant="secondary">Edit</Button>
                      </Link>
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
