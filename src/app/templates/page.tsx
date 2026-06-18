"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, PageHeader, Button, hoursAndDays } from "@/components/ui";

export default function TemplatesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const router = useRouter();

  async function load() {
    try {
      setItems(await api.get("/api/templates"));
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: number) {
    if (!confirm("Delete this template?")) return;
    await api.del(`/api/templates/${id}`);
    load();
  }

  async function duplicate(id: number) {
    setBusyId(id);
    try {
      const { id: newId } = await api.post(`/api/templates/${id}/duplicate`, {});
      router.push(`/templates/${newId}`);
    } catch (e: any) {
      setError(e.message);
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Templates"
        subtitle="Reusable sets of tasks and subtasks with default estimates."
        action={
          <Button onClick={() => router.push("/templates/new")}>
            + New template
          </Button>
        }
      />

      {error && (
        <Card className="mb-4 p-4 bg-red-50 border-red-200 text-sm text-red-700">
          {error}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.length === 0 && !error && (
          <div className="text-sm text-gray-400">No templates yet.</div>
        )}
        {items.map((t) => (
          <Card key={t.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <Link
                  href={`/templates/${t.id}/view`}
                  className="text-base font-semibold text-gray-900 hover:text-brand-600"
                >
                  {t.name}
                </Link>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {t.description || "No description"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <div className="text-sm text-gray-500">
                {t.task_count} tasks &middot;{" "}
                <span className="font-semibold text-gray-900">
                    {hoursAndDays(t.total_days)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/templates/${t.id}/view`}>
                  <Button variant="secondary">View</Button>
                </Link>
                <Link href={`/templates/${t.id}`}>
                  <Button variant="secondary">Edit</Button>
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => duplicate(t.id)}
                  disabled={busyId === t.id}
                >
                  {busyId === t.id ? "Copying..." : "Duplicate"}
                </Button>
                <Button variant="danger" onClick={() => remove(t.id)}>
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
