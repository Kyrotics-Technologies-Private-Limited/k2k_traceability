import { NextRequest, NextResponse } from "next/server";
import {
  addBatchToProduct,
  listBatchesByProduct,
  readFormFile,
  requireAdminAuth,
} from "@/lib/admin-data";

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  const batches = await listBatchesByProduct(params.productId);
  return NextResponse.json({ ok: true, batches });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  const formData = await request.formData();
  const testReport = await readFormFile(formData, "testReport");

  const result = await addBatchToProduct({
    productId: params.productId,
    testReport: testReport?.buffer ?? null,
    testReportName: testReport?.name ?? null,
    testReportType: testReport?.type ?? null,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, ...result.data });
}
