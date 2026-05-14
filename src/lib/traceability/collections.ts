/**
 * Top-level Firestore collections for the Traceability platform.
 * Operational entities (batches, packets) are NOT nested under products
 * to avoid deep-tree traversal, collectionGroup hotspots, and coupling.
 */
export const TRACEABILITY_COLLECTIONS = {
  roots: "traceabilityRoots",
  batches: "batches",
  packets: "packets",
  events: "traceabilityEvents",
  /** O(1) QR resolution: doc id = public token; points to packets/{packetId}. */
  qrAliases: "qrAliases",
  /** Recall case files; scope encoded on document + optional denormalized flags on entities. */
  recalls: "recalls",
  /** Append-only job log for reconciliation / repair (operational visibility). */
  reconciliationJobs: "reconciliationJobs",
  /** Phase 2: shared lines / multi-SKU runs (optional; keep collection empty until needed). */
  productionRuns: "productionRuns",
} as const;

export type TraceabilityCollectionName =
  (typeof TRACEABILITY_COLLECTIONS)[keyof typeof TRACEABILITY_COLLECTIONS];
