import { NextRequest, NextResponse } from "next/server";
import { listProjects, createProject } from "@/lib/repo";
import { validateProjectInput, errorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await listProjects();
    return NextResponse.json(data);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = validateProjectInput(body);
    const id = await createProject(input);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
