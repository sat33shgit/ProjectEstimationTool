import { NextRequest, NextResponse } from "next/server";
import { listTemplates, createTemplate } from "@/lib/repo";
import { validateTemplateInput, errorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await listTemplates();
    return NextResponse.json(data);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = validateTemplateInput(body);
    const id = await createTemplate(input);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
