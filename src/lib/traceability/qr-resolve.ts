import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { TRACEABILITY_COLLECTIONS } from "./collections";
import type { BatchDoc, PacketDoc, TraceabilityRootDoc } from "./schema";
import { appendTraceabilityEvent } from "./events";

/** Minimal payload safe for anonymous QR verification (no Inventory PII). */
export interface PublicQrResolution {
  traceabilityRootId: string;
  productId: string;
  product?: {
    displayName?: string;
    skuCode?: string;
  };
  batchId: string;
  packetId: string;
  packetCode: string;
  batchCode: string;
  producedAt: BatchDoc["producedAt"];
  statuses: {
    packet: string;
    batch: string;
    root: string;
  };
  recall: {
    active: boolean;
    recallIds: string[];
  };
}

function uniqueIds(ids: Array<string | null | undefined>): string[] {
  return Array.from(new Set(ids.filter(Boolean) as string[]));
}

/**
 * O(1) alias read + parallel fetches (no deep tree walks, no collectionGroup).
 */
export async function resolveQrToken(
  db: Firestore,
  qrPublicToken: string
): Promise<PublicQrResolution | null> {
  const aliasSnap = await db
    .collection(TRACEABILITY_COLLECTIONS.qrAliases)
    .doc(qrPublicToken)
    .get();
  if (!aliasSnap.exists) {
    return null;
  }
  const alias = aliasSnap.data() as {
    packetId?: string;
    batchId?: string;
    productId?: string;
    traceabilityRootId?: string;
  };
  if (!alias.packetId) {
    return null;
  }

  const packetRef = db.collection(TRACEABILITY_COLLECTIONS.packets).doc(alias.packetId);
  const packetSnap = await packetRef.get();
  if (!packetSnap.exists) {
    return null;
  }
  const packet = packetSnap.data() as PacketDoc;

  const [batchSnap, rootSnap] = await Promise.all([
    db.collection(TRACEABILITY_COLLECTIONS.batches).doc(packet.batchId).get(),
    db.collection(TRACEABILITY_COLLECTIONS.roots).doc(packet.traceabilityRootId).get(),
  ]);

  if (!batchSnap.exists || !rootSnap.exists) {
    return null;
  }

  const batch = batchSnap.data() as BatchDoc;
  const root = rootSnap.data() as TraceabilityRootDoc;

  if (
    batch.productId !== packet.productId ||
    root.productId !== packet.productId ||
    batch.traceabilityRootId !== packet.traceabilityRootId
  ) {
    return null;
  }

  const recallIds = uniqueIds([
    packet.activeRecallId,
    batch.activeRecallId,
    root.activeRecallId,
  ]);

  return {
    traceabilityRootId: packet.traceabilityRootId,
    productId: packet.productId,
    product: {
      displayName: root.inventorySnapshot?.displayName,
      skuCode: root.inventorySnapshot?.skuCode,
    },
    batchId: packet.batchId,
    packetId: packet.packetId,
    packetCode: packet.packetCode,
    batchCode: batch.batchCode,
    producedAt: batch.producedAt,
    statuses: {
      packet: packet.status,
      batch: batch.status,
      root: root.status,
    },
    recall: {
      active: recallIds.length > 0,
      recallIds,
    },
  };
}

/**
 * Optional audit hook for authenticated scan logging. Avoid calling from anonymous
 * endpoints at high QPS (write hotspot on `traceabilityEvents`).
 */
export async function logQrVerifiedEvent(
  db: Firestore,
  packetId: string,
  performedBy: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await appendTraceabilityEvent(db, {
    type: "QR_VERIFIED",
    entityType: "PACKET",
    entityId: packetId,
    performedBy,
    metadata: metadata ?? {},
  });
}

export async function logPacketScannedEvent(
  db: Firestore,
  packetId: string,
  performedBy: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await appendTraceabilityEvent(db, {
    type: "PACKET_SCANNED",
    entityType: "PACKET",
    entityId: packetId,
    performedBy,
    metadata: metadata ?? {},
  });
}

export async function persistReconciliationJob(
  db: Firestore,
  createdBy: string,
  result: { violations: { kind: string }[]; scanned: { batches: number; packets: number } }
): Promise<string> {
  const ref = db.collection(TRACEABILITY_COLLECTIONS.reconciliationJobs).doc();
  const counts: Record<string, number> = {};
  for (const v of result.violations) {
    counts[v.kind] = (counts[v.kind] ?? 0) + 1;
  }
  const now = FieldValue.serverTimestamp();
  await ref.set({
    jobId: ref.id,
    type: "INTEGRITY_SCAN",
    status: "completed",
    createdBy,
    createdAt: now,
    finishedAt: now,
    summary: { scanned: result.scanned, violationTotal: result.violations.length },
    violationCounts: counts,
  });
  await appendTraceabilityEvent(db, {
    type: "RECONCILIATION_RUN",
    entityType: "RECONCILIATION_JOB",
    entityId: ref.id,
    performedBy: createdBy,
    metadata: { scanned: result.scanned, violationTotal: result.violations.length },
  });
  return ref.id;
}
