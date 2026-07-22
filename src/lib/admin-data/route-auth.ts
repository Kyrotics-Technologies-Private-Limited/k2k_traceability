import { NextRequest, NextResponse } from "next/server";
import { requireBearerAuth, isAdminRole } from "@/lib/api-auth";

export async function requireAdminAuth(request: NextRequest) {
  const auth = await requireBearerAuth(request);
  if (!auth.ok) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: auth.error }, { status: auth.status }),
    };
  }
  if (!isAdminRole(auth.role)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
    };
  }
  return { ok: true as const, uid: auth.uid, role: auth.role };
}

export async function readFormFile(
  formData: FormData,
  field: string
): Promise<{ buffer: Buffer; name: string; type: string } | null> {
  const value = formData.get(field);
  if (!(value instanceof File) || value.size === 0) return null;
  const arrayBuffer = await value.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    name: value.name,
    type: value.type || "application/octet-stream",
  };
}
