"use client";

import { useState } from "react";
import { Card, daysFromHours, hours } from "./ui";
import { Task, taskTotal } from "@/lib/types";

export default function TaskAccordion({ tasks }: { tasks: Task[] }) {
  // Collapsed by default.
  const [open, setOpen] = useState<Record<number, boolean>>({});

  function toggle(i: number) {
    setOpen((o) => ({ ...o, [i]: !o[i] }));
  }

  return (
    <div className="space-y-4">
      {tasks.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
          No tasks yet.
        </div>
      )}

      {tasks.map((task, ti) => {
        const hasSubs = task.subtasks.length > 0;
        const isOpen = !!open[ti];
        const total = taskTotal(task);
        return (
          <Card key={ti}>
            <button
              type="button"
              onClick={() => hasSubs && toggle(ti)}
              className={`flex w-full items-center justify-between p-4 text-left ${
                hasSubs ? "cursor-pointer hover:bg-gray-50" : "cursor-default"
              } ${hasSubs && isOpen ? "border-b border-gray-100" : ""}`}
            >
              <span className="flex items-center gap-3">
                {hasSubs ? (
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded border text-sm font-semibold leading-none ${
                      isOpen
                        ? "border-brand-200 bg-brand-50 text-brand-600"
                        : "border-gray-300 bg-white text-gray-500"
                    }`}
                    aria-label={isOpen ? "Collapse" : "Expand"}
                  >
                    {isOpen ? "−" : "+"}
                  </span>
                ) : (
                  <span className="h-5 w-5" />
                )}
                <span className="font-medium text-gray-900">{task.name}</span>
                {hasSubs && (
                  <span className="text-xs text-gray-400">
                    ({task.subtasks.length})
                  </span>
                )}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {hours(total)}
                <span className="text-xs text-gray-400 font-normal ml-1">({daysFromHours(total)})</span>
              </span>
            </button>

            {hasSubs && isOpen && (
              <div className="divide-y divide-gray-50">
                {task.subtasks.map((s, si) => (
                  <div
                    key={si}
                    className="flex items-center justify-between px-4 py-2.5 text-sm"
                  >
                    <span className="text-gray-600">
                      <span className="text-gray-300 mr-2">&#8627;</span>
                      {s.name}
                    </span>
                    <span className="text-gray-700">
                      {hours(s.estimate_days)}
                      <span className="text-xs text-gray-400 ml-1">({daysFromHours(s.estimate_days)})</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
