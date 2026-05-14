import { NextRequest, NextResponse } from "next/server";
import type { Query } from "firebase-admin/firestore";
import { TRACEABILITY_COLLECTIONS, getTraceabilityFirestore, requireTraceabilityAdmin } from "@/lib/traceability";
import { clampLimit, getCursor, serializeDoc } from "@/lib/traceability/api-utils";

export async function GET(request: NextRequest) {
  const auth = await requireTraceabilityAdmin(request, "read");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const limit = clampLimit(request.nextUrl.searchParams.get("limit"), 25, 100);
    const cursor = getCursor(request);
    let query: Query = getTraceabilityFirestore().collection(TRACEABILITY_COLLECTIONS.events);
    const entityId = request.nextUrl.searchParams.get("entityId");
    const entityType = request.nextUrl.searchParams.get("entityType");
    const type = request.nextUrl.searchParams.get("type");
    if (entityId) query = query.where("entityId", "==", entityId);
    if (entityType) query = query.where("entityType", "==", entityType);
    if (type) query = query.where("type", "==", type);
    query = query.orderBy("timestamp", "desc");
    if (cursor) query = query.startAfter(new Date(cursor));

    const snap = await query.limit(limit + 1).get();
    const docs = snap.docs.slice(0, limit);
    const last = docs[docs.length - 1]?.data()?.timestamp;
    const nextCursor =
      snap.docs.length > limit && last?.toDate ? last.toDate().toISOString() : null;
    return NextResponse.json({
      ok: true,
      items: docs.map((doc) => serializeDoc(doc.id, doc.data())),
      nextCursor,
    });
  } catch (error) {
    console.error("traceability events", error);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}
