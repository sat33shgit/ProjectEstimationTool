import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/init-db -> creates tables if they don't exist.
// Useful on Vercel where you can't easily run a shell script.
export async function POST() {
  try {
    const schemaPath = join(process.cwd(), "src", "lib", "schema.sql");
    const schema = readFileSync(schemaPath, "utf8");
    await pool.query(schema);
    return NextResponse.json({ ok: true, message: "Schema applied." });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
