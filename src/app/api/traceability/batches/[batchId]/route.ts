import { NextRequest, NextResponse } from "next/server";
import {
  TRACEABILITY_COLLECTIONS,
  archiveBatch,
  getTraceabilityFirestore,
  requireTraceabilityAdmin,
  updateBatchOperationalFields,
  voidBatch,
  type BatchStatus,
} from "@/lib/traceability";
import { serializeDoc } from "@/lib/traceability/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  const auth = await requireTraceabilityAdmin(request, "read");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const db = getTraceabilityFirestore();
    const batchRef = db.collection(TRACEABILITY_COLLECTIONS.batches).doc(params.batchId);
    const batchSnap = await batchRef.get();
    if (!batchSnap.exists) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }
    const batch = batchSnap.data()!;
    const [rootSnap, packetCountSnap, recentEventsSnap] = await Promise.all([
      db.collection(TRACEABILITY_COLLECTIONS.roots).doc(batch.traceabilityRootId).get(),
      db
        .collection(TRACEABILITY_COLLECTIONS.packets)
        .where("batchId", "==", params.batchId)
        .count()
        .get(),
      db
        .collection(TRACEABILITY_COLLECTIONS.events)
        .where("entityId", "==", params.batchId)
        .orderBy("timestamp", "desc")
        .limit(10)
        .get(),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        batch: serializeDoc(batchSnap.id, batch),
        root: rootSnap.exists ? serializeDoc(rootSnap.id, rootSnap.data()!) : null,
        packetCount: packetCountSnap.data().count,
        recentEvents: recentEventsSnap.docs.map((doc) => serializeDoc(doc.id, doc.data())),
      },
    });
  } catch (error) {
    console.error("traceability batch detail", error);
    return NextResponse.json({ error: "Failed to load batch" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  const auth = await requireTraceabilityAdmin(request, "createBatch");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json()) as {
      facilityId?: string | null;
      productionLineId?: string | null;
      producedAt?: string;
      status?: BatchStatus;
    };
    await updateBatchOperationalFields(getTraceabilityFirestore(), {
      batchId: params.batchId,
      performedBy: auth.uid,
      facilityId: body.facilityId,
      productionLineId: body.productionLineId,
      producedAt: body.producedAt ? new Date(body.producedAt) : undefined,
      status: body.status,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("traceability batch update", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update batch" },
      { status: 400 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  const body = (await request.json().catch(() => ({}))) as { action?: string; reason?: string };
  const permission = body.action === "archive" ? "archiveBatch" : "repairIntegrity";
  const auth = await requireTraceabilityAdmin(request, permission);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    if (body.action === "archive") {
      await archiveBatch(getTraceabilityFirestore(), params.batchId, auth.uid, body.reason ?? "Archived");
    } else if (body.action === "void") {
      await voidBatch(getTraceabilityFirestore(), params.batchId, auth.uid, body.reason ?? "Voided");
    } else {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("traceability batch action", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Batch action failed" },
      { status: 400 }
    );
  }
}
