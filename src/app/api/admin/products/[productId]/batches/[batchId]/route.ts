import { NextRequest, NextResponse } from "next/server";
import { deleteBatch, getBatchDetails, requireAdminAuth } from "@/lib/admin-data";

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string; batchId: string } }
) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  const batch = await getBatchDetails(params.productId, params.batchId);
  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, batch });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string; batchId: string } }
) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  const result = await deleteBatch(params.productId, params.batchId);
  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: result.message });
}
