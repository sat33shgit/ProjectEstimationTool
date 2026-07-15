import { NextRequest, NextResponse } from "next/server";
import { getTemplate, updateTemplate, deleteTemplate } from "@/lib/repo";
import { parseId, validateTemplateInput, errorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tpl = await getTemplate(parseId(id));
    if (!tpl) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(tpl);
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
    const input = validateTemplateInput(body);
    await updateTemplate(parsedId, input);
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
    await deleteTemplate(parseId(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
