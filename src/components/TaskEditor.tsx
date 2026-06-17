"use client";

import React from "react";
import { Button, Input, days } from "./ui";
import { Task, taskTotal } from "@/lib/types";

export default function TaskEditor({
  tasks,
  onChange,
}: {
  tasks: Task[];
  onChange: (tasks: Task[]) => void;
}) {
  function update(next: Task[]) {
    onChange(next);
  }

  function addTask() {
    update([
      ...tasks,
      { name: "New task", category: "General", subtasks: [] },
    ]);
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

      {tasks.map((task, ti) => (
        <div
          key={ti}
          className="rounded-xl border border-gray-200 bg-white"
        >
          <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
            <Input
              value={task.name}
              onChange={(e) => setTask(ti, { name: e.target.value })}
              className="flex-1 min-w-[200px] font-medium"
              placeholder="Task name"
            />
            <Input
              value={task.category}
              onChange={(e) => setTask(ti, { category: e.target.value })}
              className="w-40"
              placeholder="Category"
            />
            <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
              {days(taskTotal(task))}
            </span>
            <Button variant="danger" onClick={() => removeTask(ti)}>
              Remove
            </Button>
          </div>

          <div className="p-4 space-y-2">
            {task.subtasks.map((s, si) => (
              <div key={si} className="flex items-center gap-3">
                <span className="text-gray-300 text-xs w-4">↳</span>
                <Input
                  value={s.name}
                  onChange={(e) =>
                    setSubtask(ti, si, { name: e.target.value })
                  }
                  className="flex-1"
                  placeholder="Subtask name"
                />
                <div className="flex items-center gap-1">
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
                    className="w-24 text-right"
                  />
                  <span className="text-xs text-gray-400">days</span>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => removeSubtask(ti, si)}
                  className="text-red-400"
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button variant="secondary" onClick={() => addSubtask(ti)}>
              + Add subtask
            </Button>
          </div>
        </div>
      ))}

      <Button onClick={addTask}>+ Add task</Button>
    </div>
  );
}
