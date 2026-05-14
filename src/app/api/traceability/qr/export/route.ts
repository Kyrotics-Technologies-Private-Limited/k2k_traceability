import { NextRequest, NextResponse } from "next/server";
import type { Query } from "firebase-admin/firestore";
import { TRACEABILITY_COLLECTIONS, getTraceabilityFirestore, requireTraceabilityAdmin } from "@/lib/traceability";
import { clampLimit, serializeDoc } from "@/lib/traceability/api-utils";

export async function GET(request: NextRequest) {
  const auth = await requireTraceabilityAdmin(request, "read");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const db = getTraceabilityFirestore();
    const batchId = request.nextUrl.searchParams.get("batchId");
    const limit = clampLimit(request.nextUrl.searchParams.get("limit"), 200, 1000);
    let query: Query = db.collection(TRACEABILITY_COLLECTIONS.packets);
    if (batchId) query = query.where("batchId", "==", batchId);
    const snap = await query.orderBy("packetCode", "asc").limit(limit).get();
    const origin = request.nextUrl.origin;
    const items = snap.docs.map((doc) => {
      const packet = serializeDoc(doc.id, doc.data());
      const token = String(packet.qrCode ?? "");
      return {
        packetId: packet.packetId,
        packetCode: packet.packetCode,
        batchId: packet.batchId,
        status: packet.status,
        qrToken: token,
        qrUrl: `${origin}/scan/${token}`,
      };
    });
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("traceability qr export", error);
    return NextResponse.json({ error: "QR export failed" }, { status: 500 });
  }
}
