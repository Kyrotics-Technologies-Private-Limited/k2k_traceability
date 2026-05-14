import { NextRequest, NextResponse } from "next/server";
import {
  TRACEABILITY_COLLECTIONS,
  getTraceabilityFirestore,
  requireTraceabilityAdmin,
  setPacketStatus,
  softVoidPacket,
  type PacketStatus,
} from "@/lib/traceability";
import { serializeDoc } from "@/lib/traceability/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { packetId: string } }
) {
  const auth = await requireTraceabilityAdmin(request, "read");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const db = getTraceabilityFirestore();
    const packetSnap = await db.collection(TRACEABILITY_COLLECTIONS.packets).doc(params.packetId).get();
    if (!packetSnap.exists) {
      return NextResponse.json({ error: "Packet not found" }, { status: 404 });
    }
    const [eventsSnap] = await Promise.all([
      db
        .collection(TRACEABILITY_COLLECTIONS.events)
        .where("entityId", "==", params.packetId)
        .orderBy("timestamp", "desc")
        .limit(20)
        .get(),
    ]);
    return NextResponse.json({
      ok: true,
      data: {
        packet: serializeDoc(packetSnap.id, packetSnap.data()!),
        events: eventsSnap.docs.map((doc) => serializeDoc(doc.id, doc.data())),
      },
    });
  } catch (error) {
    console.error("traceability packet detail", error);
    return NextResponse.json({ error: "Failed to load packet" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { packetId: string } }
) {
  const body = (await request.json().catch(() => ({}))) as {
    status?: PacketStatus;
    reason?: string;
  };
  const auth = await requireTraceabilityAdmin(
    request,
    body.status === "voided" ? "voidPacket" : "generatePackets"
  );
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    if (!body.status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }
    if (body.status === "voided") {
      await softVoidPacket(getTraceabilityFirestore(), params.packetId, auth.uid, body.reason ?? "Voided");
    } else {
      await setPacketStatus(
        getTraceabilityFirestore(),
        params.packetId,
        body.status,
        auth.uid,
        body.reason
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("traceability packet update", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update packet" },
      { status: 400 }
    );
  }
}
