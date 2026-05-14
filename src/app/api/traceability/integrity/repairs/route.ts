import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import {
  TRACEABILITY_COLLECTIONS,
  appendTraceabilityEvent,
  getTraceabilityFirestore,
  requireTraceabilityAdmin,
} from "@/lib/traceability";

export async function POST(request: NextRequest) {
  const auth = await requireTraceabilityAdmin(request, "repairIntegrity");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json()) as {
      kind?: string;
      collection?: string;
      documentId?: string;
      reason?: string;
      dryRun?: boolean;
    };
    if (!body.kind || !body.collection || !body.documentId) {
      return NextResponse.json({ error: "kind, collection, and documentId are required" }, { status: 400 });
    }

    const supported = new Set(["MISSING_QR_ALIAS", "QR_ALIAS_TARGET_MISMATCH"]);
    if (!supported.has(body.kind)) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        suggestion: "Manual review required before repair.",
      });
    }

    if (body.dryRun !== false) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        suggestion: "Repair will rewrite QR alias linkage from packet fields and append an audit event.",
      });
    }

    const db = getTraceabilityFirestore();
    const packetSnap = await db.collection(TRACEABILITY_COLLECTIONS.packets).doc(body.documentId).get();
    if (!packetSnap.exists) {
      return NextResponse.json({ error: "Packet not found for repair" }, { status: 404 });
    }
    const packet = packetSnap.data()!;
    await db.collection(TRACEABILITY_COLLECTIONS.qrAliases).doc(packet.qrCode).set(
      {
        packetId: packet.packetId,
        traceabilityRootId: packet.traceabilityRootId,
        productId: packet.productId,
        batchId: packet.batchId,
        repairedAt: FieldValue.serverTimestamp(),
        repairedBy: auth.uid,
        encodingVersion: 1,
      },
      { merge: true }
    );
    await appendTraceabilityEvent(db, {
      type: "RECONCILIATION_RUN",
      entityType: "QR_ALIAS",
      entityId: packet.qrCode,
      performedBy: auth.uid,
      metadata: {
        repairKind: body.kind,
        packetId: body.documentId,
        reason: body.reason ?? null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("traceability repair", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Repair failed" },
      { status: 400 }
    );
  }
}
