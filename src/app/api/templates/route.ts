import { NextRequest, NextResponse } from "next/server";
import { listTemplates, createTemplate } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await listTemplates();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const id = await createTemplate({
      name: body.name,
      description: body.description,
      tasks: body.tasks ?? [],
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
