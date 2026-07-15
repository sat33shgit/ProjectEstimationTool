import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/repo";
import { errorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getDashboard();
    return NextResponse.json(data);
  } catch (e) {
    return errorResponse(e);
  }
}
