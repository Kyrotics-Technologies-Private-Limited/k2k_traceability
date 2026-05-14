import type { TraceabilityCollectionName } from "./collections";

/** Current document shape version for migrations / BigQuery. */
export const TRACEABILITY_SCHEMA_VERSION = 1 as const;

export type TraceabilityEntityType =
  | "TRACEABILITY_ROOT"
  | "BATCH"
  | "PACKET"
  | "RECALL"
  | "QR_ALIAS"
  | "RECONCILIATION_JOB"
  | "PRODUCTION_RUN";

export type TraceabilityEventType =
  | "BATCH_CREATED"
  | "BATCH_UPDATED"
  | "PACKET_CREATED"
  | "PACKET_STATUS_UPDATED"
  | "PACKET_SCANNED"
  | "BATCH_RECALLED"
  | "PRODUCT_ARCHIVED"
  | "QR_VERIFIED"
  | "ROOT_CREATED"
  | "ROOT_UPDATED"
  | "RECALL_OPENED"
  | "RECALL_LIFTED"
  | "RECONCILIATION_RUN"
  | "ENTITY_VOIDED"
  | "ENTITY_ARCHIVED";

export type TraceabilityRootStatus = "draft" | "active" | "archived";

export type BatchStatus =
  | "planned"
  | "in_production"
  | "sealed"
  | "recalled"
  | "archived"
  | "voided";

export type PacketStatus =
  | "created"
  | "sealed"
  | "recalled"
  | "voided"
  | "archived";

export type RecallScope = "PRODUCT" | "BATCH" | "PACKET";

export type RecallCaseStatus = "open" | "lifted" | "voided";

export type ReconciliationJobStatus = "queued" | "running" | "completed" | "failed";

export type ReconciliationJobType =
  | "INTEGRITY_SCAN"
  | "ORPHAN_BATCH"
  | "ORPHAN_PACKET"
  | "DUPLICATE_BATCH_CODE"
  | "LINEAGE_MISMATCH";

export type ViolationKind =
  | "ORPHAN_BATCH"
  | "ORPHAN_PACKET"
  | "DUPLICATE_BATCH_CODE"
  | "LINEAGE_PRODUCT_MISMATCH"
  | "LINEAGE_ROOT_MISMATCH"
  | "MISSING_QR_ALIAS"
  | "QR_ALIAS_TARGET_MISMATCH";

/** Inventory is source of truth; this is a denormalized snapshot for audit / offline ops. */
export interface InventoryProductSnapshot {
  productId: string;
  /** Optional display fields supplied by Inventory at link time — never infer from names alone. */
  displayName?: string;
  skuCode?: string;
  capturedAt: string;
}

export interface TraceabilityRootDoc {
  traceabilityRootId: string;
  productId: string;
  schemaVersion: typeof TRACEABILITY_SCHEMA_VERSION;
  status: TraceabilityRootStatus;
  createdAt: FirebaseFirestoreLikeTimestamp;
  updatedAt: FirebaseFirestoreLikeTimestamp;
  archivedAt?: FirebaseFirestoreLikeTimestamp | null;
  deletedAt?: FirebaseFirestoreLikeTimestamp | null;
  voidedAt?: FirebaseFirestoreLikeTimestamp | null;
  /** Denormalized operational pointer for product-scoped recalls (minimal reads on scan). */
  activeRecallId?: string | null;
  inventorySnapshot?: InventoryProductSnapshot;
}

export interface BatchDoc {
  batchId: string;
  productId: string;
  traceabilityRootId: string;
  batchCode: string;
  producedAt: FirebaseFirestoreLikeTimestamp;
  status: BatchStatus;
  facilityId?: string | null;
  productionLineId?: string | null;
  /** Optional link for shared runs (Phase 2). */
  productionRunId?: string | null;
  createdAt: FirebaseFirestoreLikeTimestamp;
  updatedAt: FirebaseFirestoreLikeTimestamp;
  archivedAt?: FirebaseFirestoreLikeTimestamp | null;
  deletedAt?: FirebaseFirestoreLikeTimestamp | null;
  voidedAt?: FirebaseFirestoreLikeTimestamp | null;
  activeRecallId?: string | null;
}

export interface PacketDoc {
  packetId: string;
  batchId: string;
  productId: string;
  traceabilityRootId: string;
  packetCode: string;
  /** Same as qr alias token when using opaque IDs; kept for exports / ERP. */
  qrCode: string;
  status: PacketStatus;
  sealedAt?: FirebaseFirestoreLikeTimestamp | null;
  createdAt: FirebaseFirestoreLikeTimestamp;
  updatedAt: FirebaseFirestoreLikeTimestamp;
  archivedAt?: FirebaseFirestoreLikeTimestamp | null;
  deletedAt?: FirebaseFirestoreLikeTimestamp | null;
  voidedAt?: FirebaseFirestoreLikeTimestamp | null;
  activeRecallId?: string | null;
  /** Optional legacy bridge: human serial shown on label. */
  legacySerialNo?: string | null;
}

export interface TraceabilityEventDoc {
  type: TraceabilityEventType;
  entityType: TraceabilityEntityType;
  entityId: string;
  performedBy: string;
  timestamp: FirebaseFirestoreLikeTimestamp;
  metadata: Record<string, unknown>;
  /** Idempotency / dedupe key from upstream systems. */
  correlationId?: string;
}

export interface QrAliasDoc {
  packetId: string;
  traceabilityRootId: string;
  productId: string;
  batchId: string;
  createdAt: FirebaseFirestoreLikeTimestamp;
  /** Optional HMAC version for Phase 2 signed payloads. */
  encodingVersion?: number;
}

export interface RecallDoc {
  recallId: string;
  scope: RecallScope;
  status: RecallCaseStatus;
  productId: string;
  traceabilityRootId: string;
  batchId?: string | null;
  packetId?: string | null;
  reason: string;
  openedBy: string;
  openedAt: FirebaseFirestoreLikeTimestamp;
  liftedAt?: FirebaseFirestoreLikeTimestamp | null;
  liftedBy?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ReconciliationJobDoc {
  jobId: string;
  type: ReconciliationJobType;
  status: ReconciliationJobStatus;
  createdBy: string;
  createdAt: FirebaseFirestoreLikeTimestamp;
  finishedAt?: FirebaseFirestoreLikeTimestamp | null;
  summary?: Record<string, unknown>;
  violationCounts?: Record<ViolationKind, number>;
}

/** Phase 2: one physical run feeding multiple batches / SKUs. */
export interface ProductionRunDoc {
  productionRunId: string;
  facilityId?: string | null;
  lineId?: string | null;
  startedAt: FirebaseFirestoreLikeTimestamp;
  endedAt?: FirebaseFirestoreLikeTimestamp | null;
  /** Inventory product ids participating in this run. */
  productIds: string[];
  traceabilityRootIds: string[];
  status: "planned" | "active" | "closed" | "voided";
  createdAt: FirebaseFirestoreLikeTimestamp;
  updatedAt: FirebaseFirestoreLikeTimestamp;
}

/** Minimal timestamp typing compatible with Admin SDK + JSON. */
export type FirebaseFirestoreLikeTimestamp =
  | { seconds: number; nanoseconds?: number }
  | { _seconds: number; _nanoseconds?: number }
  | null;

export interface IntegrityViolation {
  kind: ViolationKind;
  message: string;
  collection: TraceabilityCollectionName;
  documentId: string;
  details?: Record<string, unknown>;
}
