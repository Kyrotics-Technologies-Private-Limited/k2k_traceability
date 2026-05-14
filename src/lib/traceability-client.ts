"use client";

import type { User } from "firebase/auth";

export interface TraceabilityPage<T> {
  ok: boolean;
  items: T[];
  nextCursor: string | null;
}

export interface TraceabilityApiError {
  error: string;
}

export async function traceabilityFetch<T>(
  user: User | null,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  if (!user) {
    throw new Error("Admin authentication required");
  }
  const token = await user.getIdToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  const data = (await response.json().catch(() => ({}))) as TraceabilityApiError | T;
  if (!response.ok) {
    const errorMessage =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as TraceabilityApiError).error)
        : "Traceability request failed";
    throw new Error(errorMessage);
  }
  return data as T;
}

export function buildQuery(params: Record<string, string | number | null | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `?${text}` : "";
}
