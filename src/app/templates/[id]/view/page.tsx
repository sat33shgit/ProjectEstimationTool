"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, PageHeader, Button, days } from "@/components/ui";
import TaskAccordion from "@/components/TaskAccordion";
import { tasksTotal, Task } from "@/lib/types";

export default function ViewTemplatePage() {
  const params = useParams();
  const id = Number(params.id);
  const [tpl, setTpl] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get(`/api/templates/${id}`)
      .then(setTpl)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="text-sm text-red-600">Error: {error}</div>;
  if (!tpl) return <div className="text-sm text-gray-400">Loading...</div>;

  const total = tasksTotal(tpl.tasks);

  return (
    <div>
      <PageHeader
        title={tpl.name}
        subtitle={tpl.description || "No description"}
        action={
          <div className="flex gap-2">
            <Link href="/templates">
              <Button variant="secondary">Back</Button>
            </Link>
            <Link href={`/templates/${id}`}>
              <Button>Edit template</Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Stat label="Tasks" value={tpl.tasks.length} />
        <Stat
          label="Subtasks"
          value={tpl.tasks.reduce(
            (n: number, t: Task) => n + t.subtasks.length,
            0
          )}
        />
        <Stat label="Total estimate" value={days(total)} />
      </div>

      <TaskAccordion tasks={tpl.tasks} />
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
