import { NextRequest, NextResponse } from "next/server";
import { addProduct, listProductCategories, requireAdminAuth, readFormFile } from "@/lib/admin-data";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  const products = await listProductCategories();
  return NextResponse.json({ ok: true, products });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  const formData = await request.formData();
  const productName = String(formData.get("productName") ?? "").trim();
  const productDetails = String(formData.get("productDetails") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const customProductCategoryId = String(formData.get("productCategoryId") ?? "").trim();
  const image = await readFormFile(formData, "productImage");

  if (!productName) {
    return NextResponse.json({ error: "productName is required" }, { status: 400 });
  }

  const result = await addProduct({
    productName,
    productDetails,
    description,
    customProductCategoryId: customProductCategoryId || undefined,
    productImage: image?.buffer ?? null,
    productImageName: image?.name ?? null,
    productImageType: image?.type ?? null,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, ...result.data, message: result.message });
}
