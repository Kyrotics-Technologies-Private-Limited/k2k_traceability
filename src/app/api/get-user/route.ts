import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";
import { isAdminRole, requireBearerAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireBearerAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ error: "No UID provided" }, { status: 400 });
  }

  if (uid !== auth.uid && !isAdminRole(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data()!;
    return NextResponse.json({
      success: true,
      user: {
        uid,
        name: userData.name || userData.displayName || "User",
        email: userData.email || null,
        phoneNumber: userData.phoneNumber || null,
        role: userData.role || "customer",
        createdAt: userData.createdAt || null,
        lastLoginAt: userData.lastLoginAt || null,
      },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch user details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
