import type { NextRequest } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { admin } from "@/lib/firebase-admin";

export type ApiAuthResult =
  | { ok: true; uid: string; role: string; decoded: DecodedIdToken }
  | { ok: false; error: string; status: number };

export async function requireBearerAuth(request: NextRequest): Promise<ApiAuthResult> {
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
    const role = await resolveUserRole(decoded);
    return { ok: true, uid: decoded.uid, role, decoded };
  } catch {
    return { ok: false, error: "Invalid or expired ID token", status: 401 };
  }
}

export async function resolveUserRole(decoded: DecodedIdToken): Promise<string> {
  const claimRole = decoded.role as string | undefined;
  if (claimRole) return claimRole;

  const userSnap = await admin.firestore().collection("users").doc(decoded.uid).get();
  return (userSnap.data()?.role as string | undefined) ?? "customer";
}

export function isAdminRole(role: string): boolean {
  return role === "admin";
}
