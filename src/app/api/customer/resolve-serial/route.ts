import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";
import { resolveCustomerSerialDetails } from "@/lib/customer-serial-resolve";

/**
 * Public serial lookup via serialNumbers → nested productCategory/batches/packets.
 * GET /api/customer/resolve-serial?s=<serialNo>
 */
export async function GET(request: NextRequest) {
  if (!admin.apps.length) {
    return NextResponse.json({ error: "Firebase Admin is not initialized" }, { status: 503 });
  }

  const serial =
    request.nextUrl.searchParams.get("s") ??
    request.nextUrl.searchParams.get("serial") ??
    request.nextUrl.searchParams.get("serialNo");

  if (!serial?.trim()) {
    return NextResponse.json({ error: "Missing serial number" }, { status: 400 });
  }

  try {
    const data = await resolveCustomerSerialDetails(admin.firestore(), serial);
    if (!data) {
      return NextResponse.json({ error: "Serial number not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("[resolve-serial]", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
