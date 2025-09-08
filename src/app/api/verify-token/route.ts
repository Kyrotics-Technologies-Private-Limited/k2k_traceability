import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 400 });
  }

  try {
    const decodedToken = await verifyFirebaseToken(token);
    return NextResponse.json({ 
      valid: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified
      }
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json({ 
      error: "Invalid token", 
      details: error instanceof Error ? error.message : "Token verification failed" 
    }, { status: 401 });
  }
}

async function verifyFirebaseToken(token: string) {
  try {
    // Check if admin is properly initialized
    if (!admin.apps.length) {
      console.warn("Firebase Admin not initialized, skipping token verification");
      // For development, you might want to decode the token manually or skip verification
      throw new Error("Firebase Admin not initialized - token verification unavailable");
    }

    // Verify the Firebase ID token using the admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    
    // If Firebase Admin is not working, you could implement a fallback
    // For now, we'll throw an error to maintain security
    throw new Error("Invalid Firebase token");
  }
}