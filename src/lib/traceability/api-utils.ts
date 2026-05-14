import { FieldPath, Timestamp, type DocumentData, type Query } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
}

export function clampLimit(value: string | null, fallback = 25, max = 100): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}

export function getCursor(request: NextRequest): string | null {
  return request.nextUrl.searchParams.get("cursor");
}

export function serializeTraceabilityValue(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeTraceabilityValue);
  }
  if (value && typeof value === "object") {
    const maybeTimestamp = value as { toDate?: () => Date; _seconds?: number; seconds?: number };
    if (typeof maybeTimestamp.toDate === "function") {
      return maybeTimestamp.toDate().toISOString();
    }
    if (typeof maybeTimestamp.seconds === "number") {
      return new Date(maybeTimestamp.seconds * 1000).toISOString();
    }
    if (typeof maybeTimestamp._seconds === "number") {
      return new Date(maybeTimestamp._seconds * 1000).toISOString();
    }
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        serializeTraceabilityValue(nested),
      ])
    );
  }
  return value;
}

export function serializeDoc<T extends DocumentData>(id: string, data: T): T & { id: string } {
  return { id, ...(serializeTraceabilityValue(data) as T) };
}

export async function getDocumentIdPage<T extends DocumentData>(
  query: Query<T>,
  limit: number,
  cursor: string | null
): Promise<PaginatedResult<T & { id: string }>> {
  const paged = cursor ? query.startAfter(cursor).limit(limit + 1) : query.limit(limit + 1);
  const snap = await paged.get();
  const docs = snap.docs.slice(0, limit);
  return {
    items: docs.map((doc) => serializeDoc(doc.id, doc.data())),
    nextCursor: snap.docs.length > limit ? docs[docs.length - 1]?.id ?? null : null,
  };
}

export function orderByDocumentId<T extends DocumentData>(query: Query<T>): Query<T> {
  return query.orderBy(FieldPath.documentId());
}
