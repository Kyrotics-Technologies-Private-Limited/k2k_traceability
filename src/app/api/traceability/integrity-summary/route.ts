import { NextRequest, NextResponse } from "next/server";
import {
  TRACEABILITY_COLLECTIONS,
  getTraceabilityFirestore,
  requireTraceabilityAdmin,
} from "@/lib/traceability";

/**
 * Latest persisted reconciliation job (dashboards). For live numbers, call `POST /reconciliation`.
 */
export async function GET(request: NextRequest) {
  const auth = await requireTraceabilityAdmin(request, "read");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const db = getTraceabilityFirestore();
    const snap = await db
      .collection(TRACEABILITY_COLLECTIONS.reconciliationJobs)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();
    if (snap.empty) {
      return NextResponse.json({ ok: true, lastJob: null });
    }
    const doc = snap.docs[0];
    return NextResponse.json({ ok: true, lastJob: { id: doc.id, ...doc.data() } });
  } catch (e) {
    console.error("integrity-summary", e);
    return NextResponse.json({ error: "Failed to load summary" }, { status: 500 });
  }
}
