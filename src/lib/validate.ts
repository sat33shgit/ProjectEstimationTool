import { NextResponse } from "next/server";
import type { Task, Subtask } from "./types";

// Input limits to prevent abuse (oversized payloads, DB bloat, DoS).
const MAX_NAME = 200;
const MAX_DESCRIPTION = 5000;
const MAX_STATUS = 50;
const MAX_TASKS = 200;
const MAX_SUBTASKS = 500;
const MAX_ESTIMATE_DAYS = 100000;
const MAX_RATE = 1000000;

export class ValidationError extends Error {}

/** Shorten a user-provided name so error messages stay readable. */
function quote(value: string): string {
  const v = value.trim();
  return v.length > 40 ? v.slice(0, 40) + "…" : v;
}

/** Parse a route param as a positive integer id, or throw. */
export function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError("Invalid id");
  }
  return id;
}

function str(value: unknown, field: string, max: number, required = false): string {
  if (value === undefined || value === null || value === "") {
    if (required) throw new ValidationError(`${field} is required`);
    return "";
  }
  if (typeof value !== "string") throw new ValidationError(`${field} must be a string`);
  const trimmed = value.trim();
  if (required && !trimmed) throw new ValidationError(`${field} is required`);
  if (trimmed.length > max) {
    throw new ValidationError(`${field} must be at most ${max} characters`);
  }
  return trimmed;
}

function num(value: unknown, field: string, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > max) {
    throw new ValidationError(`${field} must be a number between 0 and ${max}`);
  }
  return n;
}

export function validateTasks(raw: unknown): Task[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new ValidationError("The list of tasks is invalid");
  if (raw.length > MAX_TASKS) {
    throw new ValidationError(`You can add at most ${MAX_TASKS} tasks`);
  }
  return raw.map((t: any, ti: number): Task => {
    if (!t || typeof t !== "object") {
      throw new ValidationError(`Task ${ti + 1} is invalid`);
    }
    // Reference the task by its actual name when it has one; otherwise by position.
    const taskName = typeof t.name === "string" ? t.name.trim() : "";
    const taskRef = taskName ? `"${quote(taskName)}"` : `task ${ti + 1}`;

    if (!taskName) {
      throw new ValidationError(`Please enter a name for task ${ti + 1}.`);
    }
    if (taskName.length > MAX_NAME) {
      throw new ValidationError(
        `The name for ${taskRef} must be at most ${MAX_NAME} characters.`
      );
    }

    const rawSubs = t.subtasks ?? [];
    if (!Array.isArray(rawSubs)) {
      throw new ValidationError(`The subtasks for ${taskRef} are invalid.`);
    }
    if (rawSubs.length > MAX_SUBTASKS) {
      throw new ValidationError(
        `${taskRef} can have at most ${MAX_SUBTASKS} subtasks.`
      );
    }
    const subtasks = rawSubs.map((s: any, si: number): Subtask => {
      if (!s || typeof s !== "object") {
        throw new ValidationError(`Subtask ${si + 1} in ${taskRef} is invalid.`);
      }
      const subName = typeof s.name === "string" ? s.name.trim() : "";
      const subRef = subName ? `"${quote(subName)}"` : `subtask ${si + 1}`;

      if (!subName) {
        throw new ValidationError(
          `Please enter a name for subtask ${si + 1} in ${taskRef}.`
        );
      }
      if (subName.length > MAX_NAME) {
        throw new ValidationError(
          `The name for subtask ${subRef} in ${taskRef} must be at most ${MAX_NAME} characters.`
        );
      }
      return {
        name: subName,
        estimate_days: num(
          s.estimate_days ?? 0,
          `The estimate for subtask ${subRef} in ${taskRef}`,
          MAX_ESTIMATE_DAYS
        ),
      };
    });
    return { name: taskName, subtasks };
  });
}

export function validateTemplateInput(body: any) {
  if (!body || typeof body !== "object") throw new ValidationError("Invalid request body");
  return {
    name: str(body.name, "Name", MAX_NAME, true),
    description: str(body.description, "Description", MAX_DESCRIPTION),
    tasks: validateTasks(body.tasks),
  };
}

export function validateProjectInput(body: any) {
  if (!body || typeof body !== "object") throw new ValidationError("Invalid request body");
  let bill_rate_override: number | null = null;
  if (body.bill_rate_override !== undefined && body.bill_rate_override !== null && body.bill_rate_override !== "") {
    bill_rate_override = num(body.bill_rate_override, "Bill rate", MAX_RATE);
  }
  return {
    name: str(body.name, "Name", MAX_NAME, true),
    client: str(body.client, "Client", MAX_NAME),
    description: str(body.description, "Description", MAX_DESCRIPTION),
    status: str(body.status, "Status", MAX_STATUS) || "Draft",
    bill_rate_override,
    tasks: validateTasks(body.tasks),
  };
}

export function validateBillRate(value: unknown): number {
  return num(value, "Bill rate", MAX_RATE);
}

/**
 * Uniform API error response. Validation errors return 400 with a safe
 * message; anything else is logged server-side and returned as a generic
 * 500 so internal details (SQL, file paths, stack info) never leak.
 */
export function errorResponse(e: unknown): NextResponse {
  if (e instanceof ValidationError) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
  console.error("[api]", e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
