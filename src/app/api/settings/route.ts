import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const bill_rate = await getSetting("bill_rate");
    return NextResponse.json({ bill_rate: Number(bill_rate) || 100 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.bill_rate !== undefined) {
      const rate = Number(body.bill_rate);
      if (isNaN(rate) || rate < 0)
        return NextResponse.json({ error: "Invalid bill rate" }, { status: 400 });
      await setSetting("bill_rate", String(rate));
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
