import { NextRequest, NextResponse } from "next/server";
import { getProject, updateProject, deleteProject } from "@/lib/repo";
import { parseId, validateProjectInput, errorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const p = await getProject(parseId(id));
    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(p);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsedId = parseId(id);
    const body = await req.json();
    const input = validateProjectInput(body);
    await updateProject(parsedId, input);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteProject(parseId(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
