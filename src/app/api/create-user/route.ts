import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";
import { requireBearerAuth } from "@/lib/api-auth";

/**
 * Upserts profile fields for the authenticated user.
 * Role is NEVER accepted from the client — it is set server-side on first create only.
 */
export async function POST(request: NextRequest) {
  const auth = await requireBearerAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const uid = body.uid as string | undefined;

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 });
    }

    if (uid !== auth.uid) {
      return NextResponse.json({ error: "Forbidden: cannot modify another user" }, { status: 403 });
    }

    const db = admin.firestore();
    const userRef = db.collection("users").doc(uid);
    const existing = await userRef.get();
    const now = new Date().toISOString();

    const profileUpdate: Record<string, unknown> = {
      name: body.name || body.displayName || "User",
      email: body.email ?? null,
      phoneNumber: body.phoneNumber ?? null,
      lastLoginAt: now,
      updatedAt: now,
    };

    if (!existing.exists) {
      profileUpdate.role = "customer";
      profileUpdate.createdAt = now;
      await userRef.set(profileUpdate);
    } else {
      // Never overwrite role from client requests
      await userRef.update(profileUpdate);
    }

    const saved = (await userRef.get()).data()!;

    return NextResponse.json({
      success: true,
      message: existing.exists ? "User profile updated" : "User created successfully",
      user: {
        uid,
        name: saved.name,
        email: saved.email ?? null,
        phoneNumber: saved.phoneNumber ?? null,
        role: saved.role ?? "customer",
        createdAt: saved.createdAt ?? null,
        lastLoginAt: saved.lastLoginAt ?? null,
        updatedAt: saved.updatedAt ?? null,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      {
        error: "Failed to create user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
