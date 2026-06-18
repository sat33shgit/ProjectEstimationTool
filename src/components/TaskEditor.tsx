"use client";

import React, { useState } from "react";
import { Button, Input, days } from "./ui";
import { Task, taskTotal } from "@/lib/types";

export default function TaskEditor({
  tasks,
  onChange,
}: {
  tasks: Task[];
  onChange: (tasks: Task[]) => void;
}) {
  const [open, setOpen] = useState<Record<number, boolean>>({});

  function toggleOpen(i: number) {
    setOpen((o) => ({ ...o, [i]: !o[i] }));
  }

  function update(next: Task[]) {
    onChange(next);
  }

  function addTask() {
    const newIndex = tasks.length;
    update([...tasks, { name: "New task", subtasks: [] }]);
    setOpen((o) => ({ ...o, [newIndex]: true }));
  }

  function removeTask(i: number) {
    update(tasks.filter((_, idx) => idx !== i));
  }

  function setTask(i: number, patch: Partial<Task>) {
    update(tasks.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }

  function addSubtask(i: number) {
    const t = tasks[i];
    setTask(i, {
      subtasks: [...t.subtasks, { name: "New subtask", estimate_days: 1 }],
    });
    setOpen((o) => ({ ...o, [i]: true }));
  }

  function setSubtask(ti: number, si: number, patch: any) {
    const t = tasks[ti];
    setTask(ti, {
      subtasks: t.subtasks.map((s, idx) =>
        idx === si ? { ...s, ...patch } : s
      ),
    });
  }

  function removeSubtask(ti: number, si: number) {
    const t = tasks[ti];
    setTask(ti, { subtasks: t.subtasks.filter((_, idx) => idx !== si) });
  }

  return (
    <div className="space-y-4">
      {tasks.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
          No tasks yet. Add a task to start estimating.
        </div>
      )}

      {tasks.map((task, ti) => {
        const isOpen = !!open[ti];
        return (
          <div key={ti} className="rounded-xl border border-gray-200 bg-white">
            {/* Task header row */}
            <div
              className={`flex flex-wrap items-center gap-2 p-3 sm:p-4 ${
                isOpen ? "border-b border-gray-100" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => toggleOpen(ti)}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border text-base font-semibold leading-none ${
                  isOpen
                    ? "border-brand-200 bg-brand-50 text-brand-600"
                    : "border-gray-300 bg-white text-gray-500"
                }`}
                aria-label={isOpen ? "Collapse" : "Expand"}
              >
                {isOpen ? "−" : "+"}
              </button>
              <Input
                value={task.name}
                onChange={(e) => setTask(ti, { name: e.target.value })}
                className="flex-1 min-w-[140px] font-medium"
                placeholder="Task name"
              />
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-400 hidden sm:inline">
                  {task.subtasks.length} sub
                </span>
                <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                  {days(taskTotal(task))}
                </span>
                <Button variant="danger" onClick={() => removeTask(ti)}>
                  Remove
                </Button>
              </div>
            </div>

            {isOpen && (
              <div className="p-3 sm:p-4 space-y-2">
                {task.subtasks.map((s, si) => (
                  <div key={si} className="flex flex-wrap items-center gap-2">
                    <span className="text-gray-300 text-xs w-4 shrink-0">&#8627;</span>
                    <Input
                      value={s.name}
                      onChange={(e) =>
                        setSubtask(ti, si, { name: e.target.value })
                      }
                      className="flex-1 min-w-[120px]"
                      placeholder="Subtask name"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <Input
                        type="number"
                        step="0.25"
                        min="0"
                        value={s.estimate_days}
                        onChange={(e) =>
                          setSubtask(ti, si, {
                            estimate_days: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-20 sm:w-24 text-right"
                      />
                      <span className="text-xs text-gray-400">days</span>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => removeSubtask(ti, si)}
                      className="text-red-400 shrink-0"
                    >
                      &#10005;
                    </Button>
                  </div>
                ))}
                <Button variant="secondary" onClick={() => addSubtask(ti)}>
                  + Add subtask
                </Button>
              </div>
            )}
          </div>
        );
      })}

      <Button onClick={addTask}>+ Add task</Button>
    </div>
  );
}
