import { NextRequest, NextResponse } from "next/server";
import { getProject, updateProject, deleteProject } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const p = await getProject(Number(params.id));
    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(p);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    await updateProject(Number(params.id), {
      name: body.name,
      client: body.client,
      description: body.description,
      status: body.status,
      bill_rate_override: body.bill_rate_override ?? null,
      tasks: body.tasks ?? [],
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteProject(Number(params.id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
