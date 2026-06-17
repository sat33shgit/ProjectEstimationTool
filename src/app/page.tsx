"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { api } from "@/lib/api";
import { Card, PageHeader, Button, Badge, days } from "@/components/ui";
import type { DashboardData } from "@/lib/types";

const COLORS = [
  "#2563eb", "#7c3aed", "#0891b2", "#16a34a", "#d97706",
  "#dc2626", "#db2777", "#0d9488", "#ca8a04", "#4f46e5",
  "#65a30d", "#e11d48",
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  async function load() {
    try {
      setError(null);
      const d = await api.get("/api/dashboard");
      setData(d);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function initDb() {
    setInitializing(true);
    try {
      await api.post("/api/init-db", {});
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setInitializing(false);
    }
  }

  const needsSetup =
    error &&
    (error.toLowerCase().includes("does not exist") ||
      error.toLowerCase().includes("relation"));

  const selectedProject = useMemo(
    () =>
      data?.projects.find((p) => p.id === selectedProjectId) ?? null,
    [data, selectedProjectId]
  );

  // Pie data: filtered to the selected project, else overall.
  const pieData = useMemo(() => {
    if (!data) return [];
    if (selectedProjectId != null) {
      return (data.by_project_task?.[selectedProjectId] ?? []).map((c) => ({
        name: c.task,
        value: Number(c.days) || 0,
      }));
    }
    return data.by_task.map((c) => ({
      name: c.task,
      value: Number(c.days) || 0,
    }));
  }, [data, selectedProjectId]);

  const barData = useMemo(
    () =>
      (data?.projects ?? []).map((p) => ({
        id: p.id,
        name: p.name.length > 14 ? p.name.slice(0, 14) + "..." : p.name,
        days: Number(p.total_days) || 0,
      })),
    [data]
  );

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of all projects and total estimation effort."
      />

      {needsSetup && (
        <Card className="mb-6 p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-amber-800">
              The database tables aren&apos;t set up yet. Click to create them.
            </div>
            <Button onClick={initDb} disabled={initializing}>
              {initializing ? "Setting up..." : "Initialize database"}
            </Button>
          </div>
        </Card>
      )}

      {error && !needsSetup && (
        <Card className="mb-6 p-4 bg-red-50 border-red-200 text-sm text-red-700">
          {error}
        </Card>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <Stat label="Projects" value={data.project_count} />
            <Stat label="Templates" value={data.template_count} />
            <Stat label="Total estimated" value={days(data.total_days)} />
            <Stat label="Avg / project" value={days(data.avg_days)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-gray-700">
                  Effort by project (days)
                </h3>
                {selectedProjectId != null && (
                  <button
                    onClick={() => setSelectedProjectId(null)}
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    Clear selection
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Click a bar to break that project down by task.
              </p>
              {barData.length === 0 ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ fill: "rgba(37,99,235,0.06)" }} />
                    <Bar
                      dataKey="days"
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                      onClick={(d: any) => {
                        const clicked = d?.id ?? d?.payload?.id;
                        setSelectedProjectId((prev) =>
                          prev === clicked ? null : clicked
                        );
                      }}
                    >
                      {barData.map((b, i) => (
                        <Cell
                          key={b.id}
                          fill={
                            selectedProjectId == null ||
                            selectedProjectId === b.id
                              ? COLORS[i % COLORS.length]
                              : "#cbd5e1"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Effort by task (days)
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                {selectedProject
                  ? `Filtered to: ${selectedProject.name}`
                  : "Across all projects"}
              </p>
              {pieData.length === 0 ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={(e: any) => `${e.name}`}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => `${v} days`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between p-5 pb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                All projects
              </h3>
              <Link href="/projects">
                <Button variant="secondary">View all</Button>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-gray-100 text-left text-gray-500">
                    <th className="px-5 py-2 font-medium">Project</th>
                    <th className="px-5 py-2 font-medium">Client</th>
                    <th className="px-5 py-2 font-medium">Status</th>
                    <th className="px-5 py-2 font-medium text-right">Tasks</th>
                    <th className="px-5 py-2 font-medium text-right">
                      Total days
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.projects.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                        No projects yet.{" "}
                        <Link href="/projects" className="text-brand-600 underline">
                          Create one
                        </Link>
                        .
                      </td>
                    </tr>
                  )}
                  {data.projects.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() =>
                        setSelectedProjectId((prev) =>
                          prev === p.id ? null : p.id
                        )
                      }
                      className={`border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${
                        selectedProjectId === p.id ? "bg-brand-50" : ""
                      }`}
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/projects/${p.id}/view`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-gray-900 hover:text-brand-600"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {p.client || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge>{p.status}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-600">
                        {p.task_count}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">
                        {days(p.total_days)}
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

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-wide text-gray-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
    </Card>
  );
}

function Empty() {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
      No data yet
    </div>
  );
}
