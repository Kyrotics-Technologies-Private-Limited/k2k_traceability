import { NextRequest, NextResponse } from "next/server";
import { getTraceabilityFirestore, resolveQrToken } from "@/lib/traceability";

const TOKEN_RE = /^[0-9a-f]{32}$/i;

/**
 * Public QR resolution: `GET /api/traceability/resolve-qr?t=<opaqueToken>`
 * Two Firestore reads in the hot path (alias + packet) plus parallel batch/root (bounded).
 * Do not log high-volume scan events here (write hotspot); use an authenticated endpoint if needed.
 */
export async function GET(request: NextRequest) {
  const t = request.nextUrl.searchParams.get("t") ?? request.nextUrl.searchParams.get("token");
  if (!t || !TOKEN_RE.test(t)) {
    return NextResponse.json({ error: "Invalid or missing token" }, { status: 400 });
  }
  try {
    const db = getTraceabilityFirestore();
    const resolved = await resolveQrToken(db, t.toLowerCase());
    if (!resolved) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: resolved });
  } catch (e) {
    console.error("resolve-qr", e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
