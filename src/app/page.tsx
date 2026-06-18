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
import { Card, PageHeader, Button, daysFromHours, hours, hoursAndDays } from "@/components/ui";
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

  useEffect(() => { load(); }, []);

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
    () => data?.projects.find((p) => p.id === selectedProjectId) ?? null,
    [data, selectedProjectId]
  );

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
        hours: Number(p.total_days) || 0,
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-sm text-amber-800">
              The database tables aren&apos;t set up yet. Click to create them.
            </div>
            <Button onClick={initDb} disabled={initializing} className="shrink-0">
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
          {/* Stats grid — 2 cols on mobile, 4 on sm+ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Stat label="Projects" value={data.project_count} />
            <Stat label="Templates" value={data.template_count} />
            <Stat label="Total estimated" value={hoursAndDays(data.total_days)} />
            <Stat label="Avg / project" value={hours(data.avg_days)} />
          </div>

          {/* Charts — stack on mobile, side-by-side on lg */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-gray-700">
                  Effort by project (hours)
                </h3>
                {selectedProjectId != null && (
                  <button
                    onClick={() => setSelectedProjectId(null)}
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Click a bar to break that project down by task.
              </p>
              {barData.length === 0 ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={40} label={{ value: "Hours", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 10, fill: "#9ca3af" } }} />
                    <Tooltip cursor={{ fill: "rgba(37,99,235,0.06)" }} />
                    <Legend
                      wrapperStyle={{ fontSize: 10 }}
                      payload={barData.map((b, i) => ({
                        value: b.name,
                        type: "square" as const,
                        color:
                          selectedProjectId == null || selectedProjectId === b.id
                            ? COLORS[i % COLORS.length]
                            : "#cbd5e1",
                      }))}
                    />
                    <Bar
                      dataKey="hours"
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
                            selectedProjectId == null || selectedProjectId === b.id
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

            <Card className="p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Effort by task (hours)
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                {selectedProject
                  ? `Filtered to: ${selectedProject.name}`
                  : "Across all projects"}
              </p>
              {pieData.length === 0 ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={75}
                      label={(e: any) => `${e.name} (${e.value}h)`}
                      labelLine={true}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`${v}h`, "Effort"]} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* Projects table — scrollable on mobile */}
          <Card>
            <div className="flex items-center justify-between p-4 sm:p-5 pb-3">
              <h3 className="text-sm font-semibold text-gray-700">All projects</h3>
              <Link href="/projects">
                <Button variant="secondary">View all</Button>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-y border-gray-100 text-left text-gray-500">
                    <th className="px-4 sm:px-5 py-2 font-medium">Project</th>
                    <th className="px-4 sm:px-5 py-2 font-medium">Client</th>
                    <th className="px-4 sm:px-5 py-2 font-medium text-right">Tasks</th>
                    <th className="px-4 sm:px-5 py-2 font-medium text-right">Total hours / days</th>
                  </tr>
                </thead>
                <tbody>
                  {data.projects.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                        No projects yet.{" "}
                        <Link href="/projects" className="text-brand-600 underline">
                          Create one
                        </Link>.
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
                      <td className="px-4 sm:px-5 py-3">
                        <Link
                          href={`/projects/${p.id}/view`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-gray-900 hover:text-brand-600"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-gray-500">{p.client || "—"}</td>
                      <td className="px-4 sm:px-5 py-3 text-right text-gray-600">{p.task_count}</td>
                      <td className="px-4 sm:px-5 py-3 text-right font-semibold text-gray-900">
                        {hours(p.total_days)}
                        <span className="text-gray-400 font-normal ml-1 text-xs">
                          ({daysFromHours(p.total_days)})
                        </span>
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
    <Card className="p-3 sm:p-4">
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      <div className="mt-1 text-lg sm:text-xl font-semibold text-gray-900">{value}</div>
    </Card>
  );
}

function Empty() {
  return (
    <div className="flex items-center justify-center h-40 text-sm text-gray-400">
      No data yet.
    </div>
  );
}
