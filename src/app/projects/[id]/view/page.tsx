"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, PageHeader, Button, Badge, days } from "@/components/ui";
import TaskAccordion from "@/components/TaskAccordion";
import { tasksTotal, Task } from "@/lib/types";

export default function ViewProjectPage() {
  const params = useParams();
  const id = Number(params.id);
  const [proj, setProj] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get(`/api/projects/${id}`)
      .then(setProj)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="text-sm text-red-600">Error: {error}</div>;
  if (!proj) return <div className="text-sm text-gray-400">Loading...</div>;

  const total = tasksTotal(proj.tasks);

  return (
    <div>
      <PageHeader
        title={proj.name}
        subtitle={
          (proj.client ? proj.client + " - " : "") +
          (proj.description || "No description")
        }
        action={
          <div className="flex gap-2">
            <Link href="/projects">
              <Button variant="secondary">Back</Button>
            </Link>
            <Link href={`/projects/${id}`}>
              <Button>Edit project</Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Stat label="Status" value={<Badge>{proj.status}</Badge>} />
        <Stat label="Tasks" value={proj.tasks.length} />
        <Stat
          label="Subtasks"
          value={proj.tasks.reduce(
            (n: number, t: Task) => n + t.subtasks.length,
            0
          )}
        />
        <Stat label="Total estimate" value={days(total)} />
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
