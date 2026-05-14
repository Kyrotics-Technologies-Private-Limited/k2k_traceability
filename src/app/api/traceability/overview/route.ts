import { NextRequest, NextResponse } from "next/server";
import {
  TRACEABILITY_COLLECTIONS,
  getTraceabilityFirestore,
  requireTraceabilityAdmin,
} from "@/lib/traceability";
import { serializeDoc } from "@/lib/traceability/api-utils";

async function safeCount(query: FirebaseFirestore.Query): Promise<number> {
  try {
    const snap = await query.count().get();
    return snap.data().count;
  } catch {
    const snap = await query.limit(200).get();
    return snap.size;
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireTraceabilityAdmin(request, "read");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const db = getTraceabilityFirestore();
    const batches = db.collection(TRACEABILITY_COLLECTIONS.batches);
    const packets = db.collection(TRACEABILITY_COLLECTIONS.packets);
    const recalls = db.collection(TRACEABILITY_COLLECTIONS.recalls);
    const aliases = db.collection(TRACEABILITY_COLLECTIONS.qrAliases);
    const events = db.collection(TRACEABILITY_COLLECTIONS.events);
    const jobs = db.collection(TRACEABILITY_COLLECTIONS.reconciliationJobs);

    const [
      activeBatches,
      packetCount,
      qrCount,
      activeRecalls,
      resolvedRecalls,
      recentEventsSnap,
      latestJobSnap,
    ] = await Promise.all([
      safeCount(batches.where("status", "in", ["planned", "in_production", "sealed", "recalled"])),
      safeCount(packets),
      safeCount(aliases),
      safeCount(recalls.where("status", "==", "open")),
      safeCount(recalls.where("status", "==", "lifted")),
      events.orderBy("timestamp", "desc").limit(12).get(),
      jobs.orderBy("createdAt", "desc").limit(1).get(),
    ]);

    const recentEvents = recentEventsSnap.docs.map((doc) => serializeDoc(doc.id, doc.data()));
    const recentScans = recentEvents.filter(
      (event) => event.type === "PACKET_SCANNED" || event.type === "QR_VERIFIED"
    );
    const latestJob = latestJobSnap.empty
      ? null
      : serializeDoc(latestJobSnap.docs[0].id, latestJobSnap.docs[0].data());
    const violationCounts = (latestJob?.violationCounts ?? {}) as Record<string, number>;

    return NextResponse.json({
      ok: true,
      data: {
        stats: {
          activeBatches,
          packetCount,
          qrCount,
          activeRecalls,
          resolvedRecalls,
          orphanAlerts: (violationCounts.ORPHAN_BATCH ?? 0) + (violationCounts.ORPHAN_PACKET ?? 0),
          duplicateAlerts: violationCounts.DUPLICATE_BATCH_CODE ?? 0,
          staleQrMappings:
            (violationCounts.MISSING_QR_ALIAS ?? 0) +
            (violationCounts.QR_ALIAS_TARGET_MISMATCH ?? 0),
          lineageMismatches:
            (violationCounts.LINEAGE_PRODUCT_MISMATCH ?? 0) +
            (violationCounts.LINEAGE_ROOT_MISMATCH ?? 0),
        },
        latestReconciliationJob: latestJob,
        recentEvents,
        recentScans,
      },
    });
  } catch (error) {
    console.error("traceability overview", error);
    return NextResponse.json({ error: "Failed to load overview" }, { status: 500 });
  }
}
