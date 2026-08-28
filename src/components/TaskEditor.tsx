"use client";

import React, { useState } from "react";
import { Button, Input, hours } from "./ui";
import { Task, taskTotal } from "@/lib/types";

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export default function TaskEditor({
  tasks,
  onChange,
}: {
  tasks: Task[];
  onChange: (tasks: Task[]) => void;
}) {
  const [open, setOpen] = useState<Record<number, boolean>>({});

  // Drag state
  const [dragTask, setDragTask] = useState<number | null>(null);
  const [overTask, setOverTask] = useState<number | null>(null);
  const [dragSub, setDragSub] = useState<{ ti: number; si: number } | null>(null);
  const [overSub, setOverSub] = useState<{ ti: number; si: number } | null>(null);

  function toggleOpen(i: number) {
    setOpen((o) => ({ ...o, [i]: !o[i] }));
  }

  function update(next: Task[]) {
    onChange(next);
  }

  function addTask() {
    const newIndex = tasks.length;
    update([...tasks, { name: "", subtasks: [] }]);
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
      subtasks: [...t.subtasks, { name: "", estimate_days: 8 }],
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

  // Reorder tasks, keeping expand/collapse state aligned with each task.
  function reorderTasks(from: number, to: number) {
    if (from === to) return;
    update(moveItem(tasks, from, to));
    const flags = tasks.map((_, i) => !!open[i]);
    const movedFlags = moveItem(flags, from, to);
    const nextOpen: Record<number, boolean> = {};
    movedFlags.forEach((v, i) => (nextOpen[i] = v));
    setOpen(nextOpen);
  }

  function reorderSubtasks(ti: number, from: number, to: number) {
    if (from === to) return;
    setTask(ti, { subtasks: moveItem(tasks[ti].subtasks, from, to) });
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
        const isOver = overTask === ti && dragTask !== null && dragTask !== ti;
        return (
          <div
            key={ti}
            onDragOver={(e) => {
              if (dragTask === null) return;
              e.preventDefault();
              setOverTask(ti);
            }}
            onDrop={(e) => {
              if (dragTask === null) return;
              e.preventDefault();
              reorderTasks(dragTask, ti);
              setDragTask(null);
              setOverTask(null);
            }}
            className={`rounded-xl border bg-white transition-colors ${
              isOver ? "border-brand-400 ring-2 ring-brand-100" : "border-gray-200"
            }`}
          >
            {/* Task header row */}
            <div
              className={`flex flex-wrap items-center gap-2 p-3 sm:p-4 ${
                isOpen ? "border-b border-gray-100" : ""
              }`}
            >
              <span
                draggable
                onDragStart={(e) => {
                  setDragTask(ti);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => {
                  setDragTask(null);
                  setOverTask(null);
                }}
                title="Drag to reorder task"
                aria-label="Drag to reorder task"
                className="cursor-grab active:cursor-grabbing select-none text-gray-400 hover:text-gray-600 px-1 shrink-0"
              >
                &#8942;&#8942;
              </span>
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
                placeholder="New task"
              />
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-400 hidden sm:inline">
                  {task.subtasks.length} sub
                </span>
                <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                  {hours(taskTotal(task))}
                </span>
                <Button variant="danger" onClick={() => removeTask(ti)}>
                  Remove
                </Button>
              </div>
            </div>

            {isOpen && (
              <div className="p-3 sm:p-4 space-y-2">
                {task.subtasks.map((s, si) => {
                  const subOver =
                    overSub &&
                    overSub.ti === ti &&
                    overSub.si === si &&
                    dragSub &&
                    dragSub.ti === ti &&
                    !(dragSub.si === si);
                  return (
                    <div
                      key={si}
                      onDragOver={(e) => {
                        if (!dragSub || dragSub.ti !== ti) return;
                        e.preventDefault();
                        setOverSub({ ti, si });
                      }}
                      onDrop={(e) => {
                        if (!dragSub || dragSub.ti !== ti) return;
                        e.preventDefault();
                        reorderSubtasks(ti, dragSub.si, si);
                        setDragSub(null);
                        setOverSub(null);
                      }}
                      className={`flex flex-wrap items-center gap-2 rounded-lg ${
                        subOver ? "ring-2 ring-brand-200" : ""
                      }`}
                    >
                      <span
                        draggable
                        onDragStart={(e) => {
                          setDragSub({ ti, si });
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => {
                          setDragSub(null);
                          setOverSub(null);
                        }}
                        title="Drag to reorder subtask"
                        aria-label="Drag to reorder subtask"
                        className="cursor-grab active:cursor-grabbing select-none text-gray-300 hover:text-gray-500 text-xs shrink-0 px-0.5"
                      >
                        &#8942;&#8942;
                      </span>
                      <Input
                        value={s.name}
                        onChange={(e) =>
                          setSubtask(ti, si, { name: e.target.value })
                        }
                        className="flex-1 min-w-[120px]"
                        placeholder="New subtask"
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
                        <span className="text-xs text-gray-400">hrs</span>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => removeSubtask(ti, si)}
                        className="text-red-400 shrink-0"
                      >
                        &#10005;
                      </Button>
                    </div>
                  );
                })}
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
