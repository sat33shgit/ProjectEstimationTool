import { NextRequest, NextResponse } from "next/server";
import { duplicateProject } from "@/lib/repo";
import { parseId, errorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const duplicateId = await duplicateProject(parseId(id));
    return NextResponse.json({ id: duplicateId }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "Project not found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return errorResponse(e);
  }
}
