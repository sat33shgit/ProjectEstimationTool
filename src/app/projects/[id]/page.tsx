"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import ProjectForm from "@/components/ProjectForm";

export default function EditProjectPage() {
  const params = useParams();
  const id = Number(params.id);
  const [initial, setInitial] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get(`/api/projects/${id}`)
      .then(setInitial)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="text-sm text-red-600">Error: {error}</div>;
  if (!initial) return <div className="text-sm text-gray-400">Loading…</div>;

  return (
    <ProjectForm
      id={id}
      initial={{
        name: initial.name,
        client: initial.client,
        bill_rate_override: initial.bill_rate_override ?? null,
        tasks: initial.tasks,
      }}
    />
  );
}
