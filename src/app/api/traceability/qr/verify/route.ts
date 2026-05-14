import { NextRequest, NextResponse } from "next/server";
import {
  getTraceabilityFirestore,
  logPacketScannedEvent,
  logQrVerifiedEvent,
  requireTraceabilityAdmin,
  resolveQrToken,
} from "@/lib/traceability";

const TOKEN_RE = /^[0-9a-f]{32}$/i;

export async function POST(request: NextRequest) {
  const auth = await requireTraceabilityAdmin(request, "manageQr");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json()) as {
      token?: string;
      logScan?: boolean;
      source?: string;
    };
    const token = body.token?.trim().toLowerCase();
    if (!token || !TOKEN_RE.test(token)) {
      return NextResponse.json({ error: "valid token is required" }, { status: 400 });
    }
    const db = getTraceabilityFirestore();
    const resolved = await resolveQrToken(db, token);
    if (!resolved) {
      return NextResponse.json({ error: "QR token not found" }, { status: 404 });
    }
    await logQrVerifiedEvent(db, resolved.packetId, auth.uid, {
      token,
      source: body.source ?? "admin",
    });
    if (body.logScan) {
      await logPacketScannedEvent(db, resolved.packetId, auth.uid, {
        token,
        source: body.source ?? "admin",
      });
    }
    return NextResponse.json({ ok: true, data: resolved });
  } catch (error) {
    console.error("traceability qr verify", error);
    return NextResponse.json({ error: "QR verification failed" }, { status: 500 });
  }
}
