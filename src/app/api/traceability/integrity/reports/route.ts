import { NextRequest, NextResponse } from "next/server";
import { TRACEABILITY_COLLECTIONS, getTraceabilityFirestore, requireTraceabilityAdmin } from "@/lib/traceability";
import { clampLimit, getCursor, getDocumentIdPage, orderByDocumentId } from "@/lib/traceability/api-utils";

export const VIOLATION_SEVERITY: Record<string, "critical" | "high" | "medium" | "low"> = {
  ORPHAN_BATCH: "high",
  ORPHAN_PACKET: "high",
  DUPLICATE_BATCH_CODE: "critical",
  LINEAGE_PRODUCT_MISMATCH: "critical",
  LINEAGE_ROOT_MISMATCH: "critical",
  MISSING_QR_ALIAS: "medium",
  QR_ALIAS_TARGET_MISMATCH: "high",
};

export async function GET(request: NextRequest) {
  const auth = await requireTraceabilityAdmin(request, "read");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const page = await getDocumentIdPage(
      orderByDocumentId(getTraceabilityFirestore().collection(TRACEABILITY_COLLECTIONS.reconciliationJobs)),
      clampLimit(request.nextUrl.searchParams.get("limit")),
      getCursor(request)
    );
    return NextResponse.json({ ok: true, severity: VIOLATION_SEVERITY, ...page });
  } catch (error) {
    console.error("traceability integrity reports", error);
    return NextResponse.json({ error: "Failed to load integrity reports" }, { status: 500 });
  }
}
