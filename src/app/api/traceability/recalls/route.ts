import { NextRequest, NextResponse } from "next/server";
import {
  TRACEABILITY_COLLECTIONS,
  getTraceabilityFirestore,
  openRecallCase,
  requireTraceabilityAdmin,
  type RecallScope,
} from "@/lib/traceability";
import type { Query } from "firebase-admin/firestore";
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
    let query: Query = getTraceabilityFirestore().collection(TRACEABILITY_COLLECTIONS.recalls);
    const status = request.nextUrl.searchParams.get("status");
    const scope = request.nextUrl.searchParams.get("scope");
    if (status) query = query.where("status", "==", status);
    if (scope) query = query.where("scope", "==", scope);
    const page = await getDocumentIdPage(
      orderByDocumentId(query),
      clampLimit(request.nextUrl.searchParams.get("limit")),
      getCursor(request)
    );
    return NextResponse.json({ ok: true, ...page });
  } catch (e) {
    console.error("recalls list", e);
    return NextResponse.json({ error: "Failed to load recalls" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireTraceabilityAdmin(request, "manageRecalls");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  let body: {
    scope: RecallScope;
    productId: string;
    traceabilityRootId: string;
    batchId?: string | null;
    packetId?: string | null;
    reason: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body?.scope || !body.productId || !body.traceabilityRootId || !body.reason) {
    return NextResponse.json(
      { error: "scope, productId, traceabilityRootId, and reason are required" },
      { status: 400 }
    );
  }
  try {
    const db = getTraceabilityFirestore();
    const recallId = await openRecallCase(db, {
      scope: body.scope,
      productId: body.productId,
      traceabilityRootId: body.traceabilityRootId,
      batchId: body.batchId ?? null,
      packetId: body.packetId ?? null,
      reason: body.reason,
      performedBy: auth.uid,
    });
    return NextResponse.json({ ok: true, recallId });
  } catch (e) {
    console.error("recalls", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Recall failed" },
      { status: 400 }
    );
  }
}
