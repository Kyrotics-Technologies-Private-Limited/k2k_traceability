import type { NextRequest } from "next/server";
import { admin } from "@/lib/firebase-admin";

export type TraceabilityRole =
  | "admin"
  | "inventory_admin"
  | "traceability_admin"
  | "quality_admin"
  | "viewer";

export type AdminAuthResult =
  | { ok: true; uid: string; role: TraceabilityRole }
  | { ok: false; error: string; status: number };

const TRACEABILITY_ROLES: TraceabilityRole[] = [
  "admin",
  "inventory_admin",
  "traceability_admin",
  "quality_admin",
  "viewer",
];

export const TRACEABILITY_PERMISSIONS = {
  read: TRACEABILITY_ROLES,
  createBatch: ["admin", "inventory_admin", "traceability_admin"],
  generatePackets: ["admin", "inventory_admin", "traceability_admin"],
  manageQr: ["admin", "traceability_admin"],
  voidPacket: ["admin", "traceability_admin"],
  archiveBatch: ["admin", "inventory_admin", "traceability_admin"],
  manageRecalls: ["admin", "quality_admin", "traceability_admin"],
  runReconciliation: ["admin", "quality_admin", "traceability_admin"],
  repairIntegrity: ["admin", "traceability_admin"],
} as const satisfies Record<string, readonly TraceabilityRole[]>;

export type TraceabilityPermission = keyof typeof TRACEABILITY_PERMISSIONS;

function isTraceabilityRole(role: string | undefined): role is TraceabilityRole {
  return Boolean(role && TRACEABILITY_ROLES.includes(role as TraceabilityRole));
}

function roleCan(role: TraceabilityRole, permission: TraceabilityPermission): boolean {
  return (TRACEABILITY_PERMISSIONS[permission] as readonly TraceabilityRole[]).includes(role);
}

/**
 * Verifies Firebase ID token and ensures Firestore `users/{uid}.role` is allowed.
 */
export async function requireTraceabilityAdmin(
  request: NextRequest,
  permission: TraceabilityPermission = "read"
): Promise<AdminAuthResult> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, error: "Missing Authorization bearer token", status: 401 };
  }
  const idToken = authHeader.slice("Bearer ".length).trim();
  if (!idToken) {
    return { ok: false, error: "Empty bearer token", status: 401 };
  }
  if (!admin.apps.length) {
    return { ok: false, error: "Firebase Admin is not initialized", status: 503 };
  }
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;
    const userSnap = await admin.firestore().collection("users").doc(uid).get();
    const role = userSnap.data()?.role as string | undefined;
    if (!isTraceabilityRole(role) || !roleCan(role, permission)) {
      return { ok: false, error: "Traceability permission required", status: 403 };
    }
    return { ok: true, uid, role };
  } catch {
    return { ok: false, error: "Invalid or expired ID token", status: 401 };
  }
}
