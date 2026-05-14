import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { TraceabilityEntityType, TraceabilityEventDoc, TraceabilityEventType } from "./schema";
import { TRACEABILITY_COLLECTIONS } from "./collections";

export interface AppendTraceabilityEventInput {
  type: TraceabilityEventType;
  entityType: TraceabilityEntityType;
  entityId: string;
  performedBy: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

/**
 * Append-only event log. Callers must never update existing `traceabilityEvents` docs.
 */
export async function appendTraceabilityEvent(
  db: Firestore,
  input: AppendTraceabilityEventInput
): Promise<string> {
  const payload: Omit<TraceabilityEventDoc, "timestamp"> & { timestamp: FieldValue } = {
    type: input.type,
    entityType: input.entityType,
    entityId: input.entityId,
    performedBy: input.performedBy,
    timestamp: FieldValue.serverTimestamp(),
    metadata: input.metadata ?? {},
    correlationId: input.correlationId,
  };
  const ref = await db.collection(TRACEABILITY_COLLECTIONS.events).add(payload);
  return ref.id;
}
