import { NextRequest, NextResponse } from "next/server";
import { generatePackets, requireAdminAuth } from "@/lib/admin-data";

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string; batchId: string } }
) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { quantity?: number };
  const quantity = Number(body.quantity);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return NextResponse.json({ error: "quantity must be a positive number" }, { status: 400 });
  }

  const result = await generatePackets({
    productId: params.productId,
    batchId: params.batchId,
    quantity,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, packetIds: result.data?.packetIds ?? [] });
}
