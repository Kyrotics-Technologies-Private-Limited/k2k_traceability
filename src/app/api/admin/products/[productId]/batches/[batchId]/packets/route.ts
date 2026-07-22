import { NextRequest, NextResponse } from "next/server";
import { addPacketToBatch, listPackets, requireAdminAuth } from "@/lib/admin-data";

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string; batchId: string } }
) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  const packets = await listPackets(params.productId, params.batchId);
  return NextResponse.json({ ok: true, packets });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string; batchId: string } }
) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { refractometerReport?: string };
  const refractometerReport = body.refractometerReport ?? "";

  const result = await addPacketToBatch({
    productId: params.productId,
    batchId: params.batchId,
    refractometerReport,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, packetId: result.data?.packetId });
}
