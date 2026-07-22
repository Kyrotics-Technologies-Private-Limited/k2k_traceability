import { NextRequest, NextResponse } from "next/server";
import { readFormFile, requireAdminAuth, updateBatchTestReport } from "@/lib/admin-data";

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string; batchId: string } }
) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  const formData = await request.formData();
  const testReport = await readFormFile(formData, "testReport");
  if (!testReport) {
    return NextResponse.json({ error: "testReport file is required" }, { status: 400 });
  }

  const result = await updateBatchTestReport({
    productId: params.productId,
    batchId: params.batchId,
    testReport: testReport.buffer,
    testReportName: testReport.name,
    testReportType: testReport.type,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, reportUrl: result.data?.reportUrl });
}
