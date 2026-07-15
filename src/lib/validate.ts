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
  if (!Array.isArray(raw)) throw new ValidationError("tasks must be an array");
  if (raw.length > MAX_TASKS) {
    throw new ValidationError(`tasks must contain at most ${MAX_TASKS} items`);
  }
  return raw.map((t: any, ti: number): Task => {
    if (!t || typeof t !== "object") {
      throw new ValidationError(`tasks[${ti}] must be an object`);
    }
    const name = str(t.name, `tasks[${ti}].name`, MAX_NAME, true);
    const rawSubs = t.subtasks ?? [];
    if (!Array.isArray(rawSubs)) {
      throw new ValidationError(`tasks[${ti}].subtasks must be an array`);
    }
    if (rawSubs.length > MAX_SUBTASKS) {
      throw new ValidationError(
        `tasks[${ti}].subtasks must contain at most ${MAX_SUBTASKS} items`
      );
    }
    const subtasks = rawSubs.map((s: any, si: number): Subtask => {
      if (!s || typeof s !== "object") {
        throw new ValidationError(`tasks[${ti}].subtasks[${si}] must be an object`);
      }
      return {
        name: str(s.name, `tasks[${ti}].subtasks[${si}].name`, MAX_NAME, true),
        estimate_days: num(
          s.estimate_days ?? 0,
          `tasks[${ti}].subtasks[${si}].estimate_days`,
          MAX_ESTIMATE_DAYS
        ),
      };
    });
    return { name, subtasks };
  });
}

export function validateTemplateInput(body: any) {
  if (!body || typeof body !== "object") throw new ValidationError("Invalid request body");
  return {
    name: str(body.name, "name", MAX_NAME, true),
    description: str(body.description, "description", MAX_DESCRIPTION),
    tasks: validateTasks(body.tasks),
  };
}

export function validateProjectInput(body: any) {
  if (!body || typeof body !== "object") throw new ValidationError("Invalid request body");
  let bill_rate_override: number | null = null;
  if (body.bill_rate_override !== undefined && body.bill_rate_override !== null && body.bill_rate_override !== "") {
    bill_rate_override = num(body.bill_rate_override, "bill_rate_override", MAX_RATE);
  }
  return {
    name: str(body.name, "name", MAX_NAME, true),
    client: str(body.client, "client", MAX_NAME),
    description: str(body.description, "description", MAX_DESCRIPTION),
    status: str(body.status, "status", MAX_STATUS) || "Draft",
    bill_rate_override,
    tasks: validateTasks(body.tasks),
  };
}

export function validateBillRate(value: unknown): number {
  return num(value, "bill_rate", MAX_RATE);
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
