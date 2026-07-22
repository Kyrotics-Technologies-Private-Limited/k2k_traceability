import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";
import type { DecodedIdToken } from "firebase-admin/auth";

/**
 * POST /api/auth/set-claims
 *
 * Reads the user's `role` field from Firestore `/users/{uid}` and writes it
 * as a Firebase custom token claim so that every subsequent `verifyIdToken`
 * call can read `decoded.role` directly — no extra Firestore read required.
 *
 * Call this endpoint:
 *  - Once after an admin sets or changes a user's role in Firestore.
 *  - On login (client calls it, then does `user.getIdToken(true)` to force refresh).
 *
 * Security: The caller must supply a valid Bearer token. Only admins (claim or
 * Firestore role) may set claims for OTHER users; a user may only refresh their
 * own claims.
 */
export async function POST(request: NextRequest) {
  // --- Auth ---
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing Authorization bearer token" }, { status: 401 });
  }
  const idToken = authHeader.slice("Bearer ".length).trim();

  if (!admin.apps.length) {
    return NextResponse.json({ error: "Firebase Admin is not initialized" }, { status: 503 });
  }

  let decoded: DecodedIdToken;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid or expired ID token" }, { status: 401 });
  }

  const callerUid = decoded.uid;

  // --- Parse body ---
  let targetUid: string = callerUid; // default: refresh own claims
  try {
    const body = (await request.json()) as { uid?: string };
    if (body.uid && body.uid !== callerUid) {
      // Caller is trying to set claims for a different user — must be admin
      const callerRole: string | undefined =
        (decoded.role as string | undefined) ?? // already has a claim
        (await admin.firestore().collection("users").doc(callerUid).get()).data()?.role;

      if (callerRole !== "admin") {
        return NextResponse.json({ error: "Forbidden: only admins may set claims for other users" }, { status: 403 });
      }
      targetUid = body.uid;
    }
  } catch {
    // No body or malformed JSON — default to refreshing caller's own claims
  }

  // --- Read role from Firestore ---
  const userSnap = await admin.firestore().collection("users").doc(targetUid).get();
  const role: string = userSnap.data()?.role ?? "customer";

  // --- Write custom claim ---
  await admin.auth().setCustomUserClaims(targetUid, { role });

  return NextResponse.json({ ok: true, uid: targetUid, role });
}
