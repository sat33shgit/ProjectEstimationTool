"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import TemplateForm from "@/components/TemplateForm";

export default function EditTemplatePage() {
  const params = useParams();
  const id = Number(params.id);
  const [initial, setInitial] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get(`/api/templates/${id}`)
      .then(setInitial)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error)
    return <div className="text-sm text-red-600">Error: {error}</div>;
  if (!initial) return <div className="text-sm text-gray-400">Loading…</div>;

  return (
    <TemplateForm
      id={id}
      initial={{
        name: initial.name,
        description: initial.description,
        tasks: initial.tasks,
      }}
    />
  );
}
