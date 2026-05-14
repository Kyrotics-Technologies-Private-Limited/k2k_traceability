import { NextRequest, NextResponse } from "next/server";
import {
  TRACEABILITY_COLLECTIONS,
  getTraceabilityFirestore,
  liftRecallCase,
  requireTraceabilityAdmin,
} from "@/lib/traceability";
import { serializeDoc } from "@/lib/traceability/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { recallId: string } }
) {
  const auth = await requireTraceabilityAdmin(request, "read");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const db = getTraceabilityFirestore();
    const recallSnap = await db.collection(TRACEABILITY_COLLECTIONS.recalls).doc(params.recallId).get();
    if (!recallSnap.exists) {
      return NextResponse.json({ error: "Recall not found" }, { status: 404 });
    }
    const recall = recallSnap.data()!;
    const eventsSnap = await db
      .collection(TRACEABILITY_COLLECTIONS.events)
      .where("metadata.recallId", "==", params.recallId)
      .limit(25)
      .get();
    const directEventsSnap = await db
      .collection(TRACEABILITY_COLLECTIONS.events)
      .where("entityId", "==", params.recallId)
      .limit(25)
      .get();

    return NextResponse.json({
      ok: true,
      data: {
        recall: serializeDoc(recallSnap.id, recall),
        auditHistory: [...eventsSnap.docs, ...directEventsSnap.docs].map((doc) =>
          serializeDoc(doc.id, doc.data())
        ),
      },
    });
  } catch (error) {
    console.error("traceability recall detail", error);
    return NextResponse.json({ error: "Failed to load recall" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { recallId: string } }
) {
  const auth = await requireTraceabilityAdmin(request, "manageRecalls");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: "lift";
      reason?: string;
    };
    if (body.action !== "lift") {
      return NextResponse.json({ error: "Unsupported recall action" }, { status: 400 });
    }
    await liftRecallCase(getTraceabilityFirestore(), params.recallId, auth.uid, body.reason);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("traceability recall update", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Recall update failed" },
      { status: 400 }
    );
  }
}
