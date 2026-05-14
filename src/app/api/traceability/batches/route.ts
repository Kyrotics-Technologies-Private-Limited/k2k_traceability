import { NextRequest, NextResponse } from "next/server";
import type { Query } from "firebase-admin/firestore";
import {
  TRACEABILITY_COLLECTIONS,
  createBatchDocument,
  getTraceabilityFirestore,
  requireTraceabilityAdmin,
  type BatchStatus,
} from "@/lib/traceability";
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
    const db = getTraceabilityFirestore();
    let query: Query = db.collection(TRACEABILITY_COLLECTIONS.batches);
    const status = request.nextUrl.searchParams.get("status");
    const traceabilityRootId = request.nextUrl.searchParams.get("traceabilityRootId");
    const productId = request.nextUrl.searchParams.get("productId");
    if (status) query = query.where("status", "==", status);
    if (traceabilityRootId) query = query.where("traceabilityRootId", "==", traceabilityRootId);
    if (productId) query = query.where("productId", "==", productId);

    const page = await getDocumentIdPage(
      orderByDocumentId(query),
      clampLimit(request.nextUrl.searchParams.get("limit")),
      getCursor(request)
    );
    return NextResponse.json({ ok: true, ...page });
  } catch (error) {
    console.error("traceability batches list", error);
    return NextResponse.json({ error: "Failed to load batches" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireTraceabilityAdmin(request, "createBatch");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json()) as {
      productId?: string;
      traceabilityRootId?: string;
      batchCode?: string;
      facilityId?: string | null;
      productionLineId?: string | null;
      producedAt?: string;
      status?: BatchStatus;
    };
    if (!body.productId || !body.traceabilityRootId || !body.batchCode || !body.producedAt) {
      return NextResponse.json(
        { error: "productId, traceabilityRootId, batchCode, and producedAt are required" },
        { status: 400 }
      );
    }

    const batchId = await createBatchDocument(getTraceabilityFirestore(), {
      productId: body.productId,
      traceabilityRootId: body.traceabilityRootId,
      batchCode: body.batchCode,
      facilityId: body.facilityId ?? null,
      productionLineId: body.productionLineId ?? null,
      producedAt: new Date(body.producedAt),
      status: body.status ?? "planned",
      performedBy: auth.uid,
    });

    return NextResponse.json({ ok: true, batchId });
  } catch (error) {
    console.error("traceability batch create", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create batch" },
      { status: 400 }
    );
  }
}
