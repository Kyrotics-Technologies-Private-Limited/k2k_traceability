import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth, updateRefractometerReportById } from "@/lib/admin-data";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { productId: string; batchId: string; packetId: string } }
) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { refractometerReport?: string };
  if (!body.refractometerReport?.trim()) {
    return NextResponse.json({ error: "refractometerReport is required" }, { status: 400 });
  }

  const result = await updateRefractometerReportById({
    productId: params.productId,
    batchId: params.batchId,
    packetId: params.packetId,
    refractometerReport: body.refractometerReport,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
