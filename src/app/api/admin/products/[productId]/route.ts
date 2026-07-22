import { NextRequest, NextResponse } from "next/server";
import { deleteProduct, getProductById, requireAdminAuth } from "@/lib/admin-data";

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  const product = await getProductById(params.productId);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, product });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  const result = await deleteProduct(params.productId);
  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: result.message });
}
