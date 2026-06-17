import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getDashboard();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
