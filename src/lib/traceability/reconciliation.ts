import { FieldPath, type Firestore } from "firebase-admin/firestore";
import { TRACEABILITY_COLLECTIONS } from "./collections";
import type { BatchDoc, IntegrityViolation, PacketDoc, TraceabilityRootDoc } from "./schema";

export interface IntegrityScanOptions {
  maxBatchDocs?: number;
  maxPacketDocs?: number;
}

export interface IntegrityScanResult {
  violations: IntegrityViolation[];
  scanned: { batches: number; packets: number };
}

/**
 * Bounded operational scan (not a full data warehouse job). For millions of rows,
 * run exports to BigQuery / Dataflow and reconcile there; persist summaries via `reconciliationJobs`.
 */
export async function runIntegrityScan(
  db: Firestore,
  options: IntegrityScanOptions = {}
): Promise<IntegrityScanResult> {
  const maxBatchDocs = options.maxBatchDocs ?? 500;
  const maxPacketDocs = options.maxPacketDocs ?? 500;
  const violations: IntegrityViolation[] = [];

  const batchSnap = await db
    .collection(TRACEABILITY_COLLECTIONS.batches)
    .orderBy(FieldPath.documentId())
    .limit(maxBatchDocs)
    .get();

  const rootsCache = new Map<string, TraceabilityRootDoc | null>();
  async function loadRoot(id: string): Promise<TraceabilityRootDoc | null> {
    if (rootsCache.has(id)) {
      return rootsCache.get(id) ?? null;
    }
    const r = await db.collection(TRACEABILITY_COLLECTIONS.roots).doc(id).get();
    const data = r.exists ? (r.data() as TraceabilityRootDoc) : null;
    rootsCache.set(id, data);
    return data;
  }

  const batchKeyCounts = new Map<string, string[]>();

  for (const doc of batchSnap.docs) {
    const b = doc.data() as BatchDoc;
    const composite = `${b.traceabilityRootId}::${b.batchCode}`;
    const list = batchKeyCounts.get(composite) ?? [];
    list.push(doc.id);
    batchKeyCounts.set(composite, list);

    const root = await loadRoot(b.traceabilityRootId);
    if (!root) {
      violations.push({
        kind: "ORPHAN_BATCH",
        message: `Batch ${doc.id} references missing traceabilityRoot ${b.traceabilityRootId}`,
        collection: TRACEABILITY_COLLECTIONS.batches,
        documentId: doc.id,
        details: { traceabilityRootId: b.traceabilityRootId },
      });
    } else if (root.productId !== b.productId) {
      violations.push({
        kind: "LINEAGE_PRODUCT_MISMATCH",
        message: `Batch ${doc.id} productId does not match root`,
        collection: TRACEABILITY_COLLECTIONS.batches,
        documentId: doc.id,
        details: { batchProductId: b.productId, rootProductId: root.productId },
      });
    } else if (root.traceabilityRootId !== b.traceabilityRootId) {
      violations.push({
        kind: "LINEAGE_ROOT_MISMATCH",
        message: `Batch traceabilityRootId field mismatch vs loaded root document`,
        collection: TRACEABILITY_COLLECTIONS.batches,
        documentId: doc.id,
      });
    }
  }

  for (const [, ids] of Array.from(batchKeyCounts.entries())) {
    if (ids.length <= 1) continue;
    const nonVoidChecks = await Promise.all(
      ids.map(async (id: string) => {
        const d = await db.collection(TRACEABILITY_COLLECTIONS.batches).doc(id).get();
        const st = (d.data() as BatchDoc | undefined)?.status;
        return st !== "voided" ? id : null;
      })
    );
    const activeIds = nonVoidChecks.filter(Boolean) as string[];
    if (activeIds.length > 1) {
      for (const id of activeIds) {
        violations.push({
          kind: "DUPLICATE_BATCH_CODE",
          message: "Multiple non-voided batches share the same traceabilityRootId + batchCode",
          collection: TRACEABILITY_COLLECTIONS.batches,
          documentId: id,
          details: { siblings: activeIds },
        });
      }
    }
  }

  const packetSnap = await db
    .collection(TRACEABILITY_COLLECTIONS.packets)
    .orderBy(FieldPath.documentId())
    .limit(maxPacketDocs)
    .get();

  for (const doc of packetSnap.docs) {
    const p = doc.data() as PacketDoc;
    const batchRef = db.collection(TRACEABILITY_COLLECTIONS.batches).doc(p.batchId);
    const bSnap = await batchRef.get();
    if (!bSnap.exists) {
      violations.push({
        kind: "ORPHAN_PACKET",
        message: `Packet ${doc.id} references missing batch ${p.batchId}`,
        collection: TRACEABILITY_COLLECTIONS.packets,
        documentId: doc.id,
        details: { batchId: p.batchId },
      });
      continue;
    }
    const b = bSnap.data() as BatchDoc;
    if (b.productId !== p.productId || b.traceabilityRootId !== p.traceabilityRootId) {
      violations.push({
        kind: "LINEAGE_PRODUCT_MISMATCH",
        message: "Packet lineage fields do not match parent batch",
        collection: TRACEABILITY_COLLECTIONS.packets,
        documentId: doc.id,
        details: { packetId: doc.id, batchId: p.batchId },
      });
    }

    const qrSnap = await db.collection(TRACEABILITY_COLLECTIONS.qrAliases).doc(p.qrCode).get();
    if (!qrSnap.exists) {
      violations.push({
        kind: "MISSING_QR_ALIAS",
        message: "Packet qrCode has no matching qrAliases document",
        collection: TRACEABILITY_COLLECTIONS.packets,
        documentId: doc.id,
        details: { qrCode: p.qrCode },
      });
    } else {
      const alias = qrSnap.data() as { packetId?: string };
      if (alias.packetId !== doc.id) {
        violations.push({
          kind: "QR_ALIAS_TARGET_MISMATCH",
          message: "qrAliases document does not point back to this packet",
          collection: TRACEABILITY_COLLECTIONS.qrAliases,
          documentId: p.qrCode,
          details: { expectedPacketId: doc.id, aliasPacketId: alias.packetId },
        });
      }
    }
  }

  return {
    violations,
    scanned: { batches: batchSnap.size, packets: packetSnap.size },
  };
}
