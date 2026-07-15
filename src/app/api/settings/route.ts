import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/repo";
import { validateBillRate, errorResponse } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const bill_rate = await getSetting("bill_rate");
    return NextResponse.json({ bill_rate: Number(bill_rate) || 100 });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (body?.bill_rate !== undefined) {
      const rate = validateBillRate(body.bill_rate);
      await setSetting("bill_rate", String(rate));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
