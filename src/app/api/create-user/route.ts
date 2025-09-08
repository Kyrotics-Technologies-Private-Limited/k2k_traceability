import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, name, email, phoneNumber, role = "customer" } = body;

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 });
    }

    // Check if admin is properly initialized
    if (!admin.apps.length) {
      return NextResponse.json({ 
        error: "Firebase Admin not initialized" 
      }, { status: 500 });
    }

    // Create user document in Firestore
    const db = admin.firestore();
    const userData = {
      name: name || "User",
      email: email || null,
      phoneNumber: phoneNumber || null,
      role: role,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('users').doc(uid).set(userData, { merge: true });

    return NextResponse.json({ 
      success: true,
      message: "User created successfully",
      user: {
        uid,
        ...userData
      }
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ 
      error: "Failed to create user", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
