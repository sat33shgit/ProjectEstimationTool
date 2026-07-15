import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { timingSafeEqual } from "node:crypto";
import { pool } from "@/lib/db";
import { errorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.INIT_DB_SECRET;
  // In production this endpoint is disabled unless INIT_DB_SECRET is set
  // and the caller provides it. In development it stays open for convenience.
  if (process.env.NODE_ENV !== "production") return true;
  if (!secret) return false;
  const provided = req.headers.get("x-init-db-secret") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

// POST /api/init-db -> creates tables if they don't exist.
// Protected: in production, requires the X-Init-DB-Secret header to match
// the INIT_DB_SECRET environment variable.
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const schemaPath = join(process.cwd(), "src", "lib", "schema.sql");
    const schema = readFileSync(schemaPath, "utf8");
    await pool.query(schema);
    return NextResponse.json({ ok: true, message: "Schema applied." });
  } catch (e) {
    return errorResponse(e);
  }
}
