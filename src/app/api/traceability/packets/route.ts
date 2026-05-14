import { NextRequest, NextResponse } from "next/server";
import type { Query } from "firebase-admin/firestore";
import { TRACEABILITY_COLLECTIONS, getTraceabilityFirestore, requireTraceabilityAdmin } from "@/lib/traceability";
import {
  clampLimit,
  getCursor,
  getDocumentIdPage,
  orderByDocumentId,
} from "@/lib/traceability/api-utils";

export async function GET(request: NextRequest) {
  const auth = await requireTraceabilityAdmin(request, "read");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    let query: Query = getTraceabilityFirestore().collection(TRACEABILITY_COLLECTIONS.packets);
    const batchId = request.nextUrl.searchParams.get("batchId");
    const productId = request.nextUrl.searchParams.get("productId");
    const status = request.nextUrl.searchParams.get("status");
    if (batchId) query = query.where("batchId", "==", batchId);
    if (productId) query = query.where("productId", "==", productId);
    if (status) query = query.where("status", "==", status);

    const page = await getDocumentIdPage(
      orderByDocumentId(query),
      clampLimit(request.nextUrl.searchParams.get("limit"), 50, 200),
      getCursor(request)
    );
    return NextResponse.json({ ok: true, ...page });
  } catch (error) {
    console.error("traceability packets list", error);
    return NextResponse.json({ error: "Failed to load packets" }, { status: 500 });
  }
}
