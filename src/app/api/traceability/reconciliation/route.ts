import { NextRequest, NextResponse } from "next/server";
import {
  getTraceabilityFirestore,
  persistReconciliationJob,
  requireTraceabilityAdmin,
  runIntegrityScan,
} from "@/lib/traceability";

export async function POST(request: NextRequest) {
  const auth = await requireTraceabilityAdmin(request, "runReconciliation");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  let body: { maxBatchDocs?: number; maxPacketDocs?: number; persistJob?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  try {
    const db = getTraceabilityFirestore();
    const result = await runIntegrityScan(db, {
      maxBatchDocs: body.maxBatchDocs,
      maxPacketDocs: body.maxPacketDocs,
    });
    let jobId: string | undefined;
    if (body.persistJob !== false) {
      jobId = await persistReconciliationJob(db, auth.uid, result);
    }
    return NextResponse.json({
      ok: true,
      scanned: result.scanned,
      violationCount: result.violations.length,
      violations: result.violations,
      jobId,
    });
  } catch (e) {
    console.error("reconciliation", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Reconciliation failed" },
      { status: 500 }
    );
  }
}
