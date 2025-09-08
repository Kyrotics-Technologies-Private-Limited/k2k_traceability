import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ error: "No UID provided" }, { status: 400 });
  }

  try {
    // Check if admin is properly initialized
    if (!admin.apps.length) {
      console.warn("Firebase Admin not initialized, returning fallback user data");
      return NextResponse.json({ 
        success: true,
        user: {
          uid: uid,
          name: "User",
          email: null,
          phoneNumber: null,
          role: "customer",
          createdAt: null,
          lastLoginAt: null
        }
      });
    }

    // Get user details from Firestore users collection
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      console.warn(`User document not found for UID: ${uid}`);
      return NextResponse.json({ 
        success: true,
        user: {
          uid: uid,
          name: "User",
          email: null,
          phoneNumber: null,
          role: "customer",
          createdAt: null,
          lastLoginAt: null
        }
      });
    }

    const userData = userDoc.data();    
    return NextResponse.json({ 
      success: true,
      user: {
        uid: uid,
        name: userData?.name || userData?.displayName || "User",
        email: userData?.email || null,
        phoneNumber: userData?.phoneNumber || null,
        role: userData?.role || "customer",
        createdAt: userData?.createdAt || null,
        lastLoginAt: userData?.lastLoginAt || null,
        // Include any other fields from your users collection
        ...userData
      }
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    
    // If Firebase Admin is not working, return fallback data
    if (error instanceof Error && error.message.includes("Firebase Admin not properly initialized")) {
      return NextResponse.json({ 
        success: true,
        user: {
          uid: uid,
          name: "User",
          email: null,
          phoneNumber: null,
          role: "customer",
          createdAt: null,
          lastLoginAt: null
        }
      });
    }
    
    return NextResponse.json({ 
      error: "Failed to fetch user details", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
