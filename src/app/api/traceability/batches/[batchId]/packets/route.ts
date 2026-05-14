import { NextRequest, NextResponse } from "next/server";
import type { Query } from "firebase-admin/firestore";
import {
  TRACEABILITY_COLLECTIONS,
  bulkCreatePacketsWithQrAliases,
  getTraceabilityFirestore,
  requireTraceabilityAdmin,
  type PacketStatus,
} from "@/lib/traceability";
import {
  clampLimit,
  getCursor,
  getDocumentIdPage,
  orderByDocumentId,
} from "@/lib/traceability/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  const auth = await requireTraceabilityAdmin(request, "read");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    let query: Query = getTraceabilityFirestore()
      .collection(TRACEABILITY_COLLECTIONS.packets)
      .where("batchId", "==", params.batchId);
    const status = request.nextUrl.searchParams.get("status");
    if (status) query = query.where("status", "==", status);

    const page = await getDocumentIdPage(
      orderByDocumentId(query),
      clampLimit(request.nextUrl.searchParams.get("limit"), 50, 200),
      getCursor(request)
    );
    return NextResponse.json({ ok: true, ...page });
  } catch (error) {
    console.error("traceability batch packets", error);
    return NextResponse.json({ error: "Failed to load packets" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  const auth = await requireTraceabilityAdmin(request, "generatePackets");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json()) as {
      productId?: string;
      traceabilityRootId?: string;
      packetCodePrefix?: string;
      quantity?: number;
      startNumber?: number;
      status?: PacketStatus;
      legacySerialPrefix?: string | null;
    };
    if (!body.productId || !body.traceabilityRootId || !body.packetCodePrefix || !body.quantity) {
      return NextResponse.json(
        { error: "productId, traceabilityRootId, packetCodePrefix, and quantity are required" },
        { status: 400 }
      );
    }

    const packets = await bulkCreatePacketsWithQrAliases(getTraceabilityFirestore(), {
      batchId: params.batchId,
      productId: body.productId,
      traceabilityRootId: body.traceabilityRootId,
      packetCodePrefix: body.packetCodePrefix,
      quantity: body.quantity,
      startNumber: body.startNumber,
      status: body.status ?? "created",
      legacySerialPrefix: body.legacySerialPrefix ?? null,
      performedBy: auth.uid,
    });

    return NextResponse.json({ ok: true, count: packets.length, packets });
  } catch (error) {
    console.error("traceability packet generation", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Packet generation failed" },
      { status: 400 }
    );
  }
}
