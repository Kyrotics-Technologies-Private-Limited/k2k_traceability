import { FieldValue, type Firestore, type Transaction } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";
import { TRACEABILITY_COLLECTIONS } from "./collections";
import { appendTraceabilityEvent } from "./events";
import {
  TRACEABILITY_SCHEMA_VERSION,
  type BatchDoc,
  type BatchStatus,
  type InventoryProductSnapshot,
  type PacketDoc,
  type PacketStatus,
  type RecallDoc,
  type RecallScope,
  type TraceabilityRootDoc,
  type TraceabilityRootStatus,
} from "./schema";

function newQrPublicToken(): string {
  return uuidv4().replace(/-/g, "");
}

export interface CreateTraceabilityRootInput {
  traceabilityRootId: string;
  productId: string;
  performedBy: string;
  status?: TraceabilityRootStatus;
  inventorySnapshot?: InventoryProductSnapshot;
}

/**
 * Idempotent upsert for rollout: merges `updatedAt` and preserves createdAt when present.
 */
export async function upsertTraceabilityRoot(
  db: Firestore,
  input: CreateTraceabilityRootInput
): Promise<void> {
  const ref = db.collection(TRACEABILITY_COLLECTIONS.roots).doc(input.traceabilityRootId);
  const snap = await ref.get();
  const now = FieldValue.serverTimestamp();
  const base: Partial<TraceabilityRootDoc> = {
    traceabilityRootId: input.traceabilityRootId,
    productId: input.productId,
    schemaVersion: TRACEABILITY_SCHEMA_VERSION,
    status: input.status ?? "active",
    updatedAt: now as unknown as TraceabilityRootDoc["updatedAt"],
    inventorySnapshot: input.inventorySnapshot,
  };
  if (!snap.exists) {
    await ref.set({
      ...base,
      createdAt: now,
    });
    await appendTraceabilityEvent(db, {
      type: "ROOT_CREATED",
      entityType: "TRACEABILITY_ROOT",
      entityId: input.traceabilityRootId,
      performedBy: input.performedBy,
      metadata: { productId: input.productId },
    });
  } else {
    await ref.set(
      {
        ...base,
      },
      { merge: true }
    );
    await appendTraceabilityEvent(db, {
      type: "ROOT_UPDATED",
      entityType: "TRACEABILITY_ROOT",
      entityId: input.traceabilityRootId,
      performedBy: input.performedBy,
      metadata: { productId: input.productId },
    });
  }
}

export interface CreateBatchInput {
  productId: string;
  traceabilityRootId: string;
  batchCode: string;
  producedAt: Date;
  status?: BatchStatus;
  facilityId?: string | null;
  productionLineId?: string | null;
  productionRunId?: string | null;
  performedBy: string;
}

export async function createBatchDocument(
  db: Firestore,
  input: CreateBatchInput
): Promise<string> {
  const rootRef = db.collection(TRACEABILITY_COLLECTIONS.roots).doc(input.traceabilityRootId);
  const rootSnap = await rootRef.get();
  if (!rootSnap.exists) {
    throw new Error(`traceabilityRoot ${input.traceabilityRootId} not found`);
  }
  const root = rootSnap.data() as TraceabilityRootDoc;
  if (root.productId !== input.productId) {
    throw new Error("productId does not match traceability root");
  }

  const dup = await db
    .collection(TRACEABILITY_COLLECTIONS.batches)
    .where("traceabilityRootId", "==", input.traceabilityRootId)
    .where("batchCode", "==", input.batchCode)
    .limit(25)
    .get();

  const activeDup = dup.docs.filter((d) => {
    const st = (d.data() as BatchDoc).status;
    return st !== "voided";
  });
  if (activeDup.length > 0) {
    throw new Error(
      `Duplicate batchCode "${input.batchCode}" for traceabilityRoot ${input.traceabilityRootId}`
    );
  }

  const batchRef = db.collection(TRACEABILITY_COLLECTIONS.batches).doc();
  const now = FieldValue.serverTimestamp();
  const payload: Omit<BatchDoc, "createdAt" | "updatedAt" | "producedAt"> & {
    createdAt: typeof now;
    updatedAt: typeof now;
    producedAt: Date;
  } = {
    batchId: batchRef.id,
    productId: input.productId,
    traceabilityRootId: input.traceabilityRootId,
    batchCode: input.batchCode,
    producedAt: input.producedAt,
    status: input.status ?? "planned",
    facilityId: input.facilityId ?? null,
    productionLineId: input.productionLineId ?? null,
    productionRunId: input.productionRunId ?? null,
    createdAt: now,
    updatedAt: now,
    activeRecallId: null,
  };

  await batchRef.set(payload);
  await appendTraceabilityEvent(db, {
    type: "BATCH_CREATED",
    entityType: "BATCH",
    entityId: batchRef.id,
    performedBy: input.performedBy,
    metadata: {
      productId: input.productId,
      traceabilityRootId: input.traceabilityRootId,
      batchCode: input.batchCode,
    },
  });
  return batchRef.id;
}

export interface CreatePacketInput {
  batchId: string;
  productId: string;
  traceabilityRootId: string;
  packetCode: string;
  performedBy: string;
  status?: PacketStatus;
  legacySerialNo?: string | null;
}

/**
 * Creates top-level packet + qr alias + append-only event in a single transaction.
 */
export async function createPacketWithQrAlias(
  db: Firestore,
  input: CreatePacketInput
): Promise<{ packetId: string; qrPublicToken: string }> {
  const qrPublicToken = newQrPublicToken();
  const batchRef = db.collection(TRACEABILITY_COLLECTIONS.batches).doc(input.batchId);
  const rootRef = db.collection(TRACEABILITY_COLLECTIONS.roots).doc(input.traceabilityRootId);

  const packetRef = db.collection(TRACEABILITY_COLLECTIONS.packets).doc();
  const qrRef = db.collection(TRACEABILITY_COLLECTIONS.qrAliases).doc(qrPublicToken);
  const eventRef = db.collection(TRACEABILITY_COLLECTIONS.events).doc();

  await db.runTransaction(async (tx: Transaction) => {
    const [batchSnap, rootSnap] = await Promise.all([tx.get(batchRef), tx.get(rootRef)]);
    if (!batchSnap.exists) {
      throw new Error(`batch ${input.batchId} not found`);
    }
    if (!rootSnap.exists) {
      throw new Error(`traceabilityRoot ${input.traceabilityRootId} not found`);
    }
    const batch = batchSnap.data() as BatchDoc;
    const root = rootSnap.data() as TraceabilityRootDoc;
    if (batch.productId !== input.productId || root.productId !== input.productId) {
      throw new Error("productId mismatch in lineage");
    }
    if (batch.traceabilityRootId !== input.traceabilityRootId) {
      throw new Error("traceabilityRootId mismatch between batch and packet");
    }

    const now = FieldValue.serverTimestamp();
    const packetPayload: Omit<PacketDoc, "createdAt" | "updatedAt" | "sealedAt"> & {
      createdAt: typeof now;
      updatedAt: typeof now;
      sealedAt: typeof now | null;
    } = {
      packetId: packetRef.id,
      batchId: input.batchId,
      productId: input.productId,
      traceabilityRootId: input.traceabilityRootId,
      packetCode: input.packetCode,
      qrCode: qrPublicToken,
      status: input.status ?? "created",
      sealedAt: input.status === "sealed" ? now : null,
      createdAt: now,
      updatedAt: now,
      activeRecallId: null,
      legacySerialNo: input.legacySerialNo ?? null,
    };

    tx.set(packetRef, packetPayload);
    tx.set(qrRef, {
      packetId: packetRef.id,
      traceabilityRootId: input.traceabilityRootId,
      productId: input.productId,
      batchId: input.batchId,
      createdAt: now,
      encodingVersion: 1,
    });
    tx.set(eventRef, {
      type: "PACKET_CREATED",
      entityType: "PACKET",
      entityId: packetRef.id,
      performedBy: input.performedBy,
      timestamp: now,
      metadata: {
        batchId: input.batchId,
        productId: input.productId,
        traceabilityRootId: input.traceabilityRootId,
        packetCode: input.packetCode,
        qrPublicToken,
      },
    });
  });

  return { packetId: packetRef.id, qrPublicToken };
}

export interface OpenRecallInput {
  scope: RecallScope;
  productId: string;
  traceabilityRootId: string;
  batchId?: string | null;
  packetId?: string | null;
  reason: string;
  performedBy: string;
}

export async function openRecallCase(db: Firestore, input: OpenRecallInput): Promise<string> {
  const recallRef = db.collection(TRACEABILITY_COLLECTIONS.recalls).doc();
  const now = FieldValue.serverTimestamp();

  if (input.scope === "PACKET" && !input.packetId) {
    throw new Error("packetId required for PACKET recall");
  }
  if (input.scope === "BATCH" && !input.batchId) {
    throw new Error("batchId required for BATCH recall");
  }

  await db.runTransaction(async (tx) => {
    const rootRef = db.collection(TRACEABILITY_COLLECTIONS.roots).doc(input.traceabilityRootId);
    const rootSnap = await tx.get(rootRef);
    if (!rootSnap.exists) {
      throw new Error("traceabilityRoot not found");
    }
    const root = rootSnap.data() as TraceabilityRootDoc;
    if (root.productId !== input.productId) {
      throw new Error("productId mismatch for recall");
    }

    const recallPayload: Omit<RecallDoc, "openedAt"> & { openedAt: typeof now } = {
      recallId: recallRef.id,
      scope: input.scope,
      status: "open",
      productId: input.productId,
      traceabilityRootId: input.traceabilityRootId,
      batchId: input.batchId ?? null,
      packetId: input.packetId ?? null,
      reason: input.reason,
      openedBy: input.performedBy,
      openedAt: now,
    };
    tx.set(recallRef, recallPayload);

    if (input.scope === "PRODUCT") {
      tx.update(rootRef, { activeRecallId: recallRef.id, updatedAt: now });
    } else if (input.scope === "BATCH" && input.batchId) {
      const batchRef = db.collection(TRACEABILITY_COLLECTIONS.batches).doc(input.batchId);
      const bSnap = await tx.get(batchRef);
      if (!bSnap.exists) {
        throw new Error("batch not found");
      }
      const b = bSnap.data() as BatchDoc;
      if (b.traceabilityRootId !== input.traceabilityRootId || b.productId !== input.productId) {
        throw new Error("batch lineage mismatch for recall");
      }
      tx.update(batchRef, {
        activeRecallId: recallRef.id,
        status: "recalled",
        updatedAt: now,
      });
    } else if (input.scope === "PACKET" && input.packetId) {
      const packetRef = db.collection(TRACEABILITY_COLLECTIONS.packets).doc(input.packetId);
      const pSnap = await tx.get(packetRef);
      if (!pSnap.exists) {
        throw new Error("packet not found");
      }
      const p = pSnap.data() as PacketDoc;
      if (p.traceabilityRootId !== input.traceabilityRootId || p.productId !== input.productId) {
        throw new Error("packet lineage mismatch for recall");
      }
      tx.update(packetRef, {
        activeRecallId: recallRef.id,
        status: "recalled",
        updatedAt: now,
      });
    }
  });

  await appendTraceabilityEvent(db, {
    type: "RECALL_OPENED",
    entityType: "RECALL",
    entityId: recallRef.id,
    performedBy: input.performedBy,
    metadata: {
      scope: input.scope,
      productId: input.productId,
      traceabilityRootId: input.traceabilityRootId,
      batchId: input.batchId ?? null,
      packetId: input.packetId ?? null,
    },
  });

  if (input.scope === "BATCH" && input.batchId) {
    await appendTraceabilityEvent(db, {
      type: "BATCH_RECALLED",
      entityType: "BATCH",
      entityId: input.batchId,
      performedBy: input.performedBy,
      metadata: { recallId: recallRef.id },
    });
  }

  return recallRef.id;
}

export async function softVoidPacket(
  db: Firestore,
  packetId: string,
  performedBy: string,
  reason: string
): Promise<void> {
  const ref = db.collection(TRACEABILITY_COLLECTIONS.packets).doc(packetId);
  const now = FieldValue.serverTimestamp();
  await ref.update({
    status: "voided",
    voidedAt: now,
    updatedAt: now,
  });
  await appendTraceabilityEvent(db, {
    type: "ENTITY_VOIDED",
    entityType: "PACKET",
    entityId: packetId,
    performedBy,
    metadata: { reason },
  });
}

export interface UpdateBatchOperationalInput {
  batchId: string;
  performedBy: string;
  facilityId?: string | null;
  productionLineId?: string | null;
  producedAt?: Date;
  status?: BatchStatus;
}

export async function updateBatchOperationalFields(
  db: Firestore,
  input: UpdateBatchOperationalInput
): Promise<void> {
  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if ("facilityId" in input) update.facilityId = input.facilityId ?? null;
  if ("productionLineId" in input) update.productionLineId = input.productionLineId ?? null;
  if (input.producedAt) update.producedAt = input.producedAt;
  if (input.status) update.status = input.status;

  await db.collection(TRACEABILITY_COLLECTIONS.batches).doc(input.batchId).update(update);
  await appendTraceabilityEvent(db, {
    type: "BATCH_UPDATED",
    entityType: "BATCH",
    entityId: input.batchId,
    performedBy: input.performedBy,
    metadata: {
      facilityId: input.facilityId,
      productionLineId: input.productionLineId,
      producedAt: input.producedAt?.toISOString(),
      status: input.status,
    },
  });
}

export async function archiveBatch(
  db: Firestore,
  batchId: string,
  performedBy: string,
  reason: string
): Promise<void> {
  const now = FieldValue.serverTimestamp();
  await db.collection(TRACEABILITY_COLLECTIONS.batches).doc(batchId).update({
    status: "archived",
    archivedAt: now,
    updatedAt: now,
  });
  await appendTraceabilityEvent(db, {
    type: "ENTITY_ARCHIVED",
    entityType: "BATCH",
    entityId: batchId,
    performedBy,
    metadata: { reason },
  });
}

export async function voidBatch(
  db: Firestore,
  batchId: string,
  performedBy: string,
  reason: string
): Promise<void> {
  const now = FieldValue.serverTimestamp();
  await db.collection(TRACEABILITY_COLLECTIONS.batches).doc(batchId).update({
    status: "voided",
    voidedAt: now,
    updatedAt: now,
  });
  await appendTraceabilityEvent(db, {
    type: "ENTITY_VOIDED",
    entityType: "BATCH",
    entityId: batchId,
    performedBy,
    metadata: { reason },
  });
}

export async function setPacketStatus(
  db: Firestore,
  packetId: string,
  status: PacketStatus,
  performedBy: string,
  reason?: string
): Promise<void> {
  const now = FieldValue.serverTimestamp();
  const update: Record<string, unknown> = { status, updatedAt: now };
  if (status === "sealed") update.sealedAt = now;
  if (status === "voided") update.voidedAt = now;
  if (status === "archived") update.archivedAt = now;

  await db.collection(TRACEABILITY_COLLECTIONS.packets).doc(packetId).update(update);
  await appendTraceabilityEvent(db, {
    type:
      status === "voided"
        ? "ENTITY_VOIDED"
        : status === "archived"
          ? "ENTITY_ARCHIVED"
          : "PACKET_STATUS_UPDATED",
    entityType: "PACKET",
    entityId: packetId,
    performedBy,
    metadata: { status, reason: reason ?? null },
  });
}

export interface BulkCreatePacketsInput {
  batchId: string;
  productId: string;
  traceabilityRootId: string;
  packetCodePrefix: string;
  quantity: number;
  performedBy: string;
  startNumber?: number;
  status?: PacketStatus;
  legacySerialPrefix?: string | null;
}

export interface BulkCreatePacketResult {
  packetId: string;
  packetCode: string;
  qrPublicToken: string;
  legacySerialNo: string | null;
}

export async function bulkCreatePacketsWithQrAliases(
  db: Firestore,
  input: BulkCreatePacketsInput
): Promise<BulkCreatePacketResult[]> {
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 5000) {
    throw new Error("quantity must be between 1 and 5000");
  }

  const [batchSnap, rootSnap] = await Promise.all([
    db.collection(TRACEABILITY_COLLECTIONS.batches).doc(input.batchId).get(),
    db.collection(TRACEABILITY_COLLECTIONS.roots).doc(input.traceabilityRootId).get(),
  ]);
  if (!batchSnap.exists) throw new Error(`batch ${input.batchId} not found`);
  if (!rootSnap.exists) throw new Error(`traceabilityRoot ${input.traceabilityRootId} not found`);

  const batchDoc = batchSnap.data() as BatchDoc;
  const rootDoc = rootSnap.data() as TraceabilityRootDoc;
  if (
    batchDoc.productId !== input.productId ||
    rootDoc.productId !== input.productId ||
    batchDoc.traceabilityRootId !== input.traceabilityRootId
  ) {
    throw new Error("lineage mismatch for bulk packet generation");
  }

  const results: BulkCreatePacketResult[] = [];
  const startNumber = input.startNumber ?? 1;
  const chunkSize = 125;

  for (let offset = 0; offset < input.quantity; offset += chunkSize) {
    const batch = db.batch();
    const count = Math.min(chunkSize, input.quantity - offset);
    for (let i = 0; i < count; i += 1) {
      const sequence = startNumber + offset + i;
      const packetCode = `${input.packetCodePrefix}${String(sequence).padStart(5, "0")}`;
      const qrPublicToken = newQrPublicToken();
      const packetRef = db.collection(TRACEABILITY_COLLECTIONS.packets).doc();
      const qrRef = db.collection(TRACEABILITY_COLLECTIONS.qrAliases).doc(qrPublicToken);
      const eventRef = db.collection(TRACEABILITY_COLLECTIONS.events).doc();
      const now = FieldValue.serverTimestamp();
      const legacySerialNo = input.legacySerialPrefix
        ? `${input.legacySerialPrefix}${String(sequence).padStart(5, "0")}`
        : null;

      batch.set(packetRef, {
        packetId: packetRef.id,
        batchId: input.batchId,
        productId: input.productId,
        traceabilityRootId: input.traceabilityRootId,
        packetCode,
        qrCode: qrPublicToken,
        status: input.status ?? "created",
        sealedAt: input.status === "sealed" ? now : null,
        createdAt: now,
        updatedAt: now,
        activeRecallId: null,
        legacySerialNo,
      });
      batch.set(qrRef, {
        packetId: packetRef.id,
        traceabilityRootId: input.traceabilityRootId,
        productId: input.productId,
        batchId: input.batchId,
        createdAt: now,
        encodingVersion: 1,
      });
      batch.set(eventRef, {
        type: "PACKET_CREATED",
        entityType: "PACKET",
        entityId: packetRef.id,
        performedBy: input.performedBy,
        timestamp: now,
        metadata: {
          batchId: input.batchId,
          productId: input.productId,
          traceabilityRootId: input.traceabilityRootId,
          packetCode,
          qrPublicToken,
          bulkGenerated: true,
        },
      });

      results.push({ packetId: packetRef.id, packetCode, qrPublicToken, legacySerialNo });
    }
    await batch.commit();
  }

  return results;
}

export async function liftRecallCase(
  db: Firestore,
  recallId: string,
  performedBy: string,
  reason?: string
): Promise<void> {
  const recallRef = db.collection(TRACEABILITY_COLLECTIONS.recalls).doc(recallId);
  const now = FieldValue.serverTimestamp();

  await db.runTransaction(async (tx) => {
    const recallSnap = await tx.get(recallRef);
    if (!recallSnap.exists) throw new Error("recall not found");
    const recall = recallSnap.data() as RecallDoc;
    if (recall.status !== "open") throw new Error("only open recalls can be lifted");

    tx.update(recallRef, {
      status: "lifted",
      liftedAt: now,
      liftedBy: performedBy,
      metadata: { ...(recall.metadata ?? {}), liftReason: reason ?? null },
    });

    if (recall.scope === "PRODUCT") {
      tx.update(db.collection(TRACEABILITY_COLLECTIONS.roots).doc(recall.traceabilityRootId), {
        activeRecallId: null,
        updatedAt: now,
      });
    }
    if (recall.scope === "BATCH" && recall.batchId) {
      tx.update(db.collection(TRACEABILITY_COLLECTIONS.batches).doc(recall.batchId), {
        activeRecallId: null,
        status: "sealed",
        updatedAt: now,
      });
    }
    if (recall.scope === "PACKET" && recall.packetId) {
      tx.update(db.collection(TRACEABILITY_COLLECTIONS.packets).doc(recall.packetId), {
        activeRecallId: null,
        status: "sealed",
        updatedAt: now,
      });
    }
  });

  await appendTraceabilityEvent(db, {
    type: "RECALL_LIFTED",
    entityType: "RECALL",
    entityId: recallId,
    performedBy,
    metadata: { reason: reason ?? null },
  });
}
