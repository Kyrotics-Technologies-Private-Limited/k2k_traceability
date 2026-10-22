import { NextRequest, NextResponse } from "next/server";
import { deleteBatch, getBatchDetails, requireAdminAuth, updateBatchDetails } from "@/lib/admin-data";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { productId: string; batchId: string } }
) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const result = await updateBatchDetails(params.productId, params.batchId, {
      manufacturingDate: body.manufacturingDate,
      expiryDate: body.expiryDate,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: result.message });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update batch" },
      { status: 400 }
    );
  }
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

