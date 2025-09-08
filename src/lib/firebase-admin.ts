// lib/firebase-admin.ts
import * as firebaseAdmin from "firebase-admin";

let admin: typeof firebaseAdmin;

if (!firebaseAdmin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Firebase Admin SDK: Missing required environment variables.");
    console.error("Required variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
    throw new Error("Firebase Admin SDK: Missing required environment variables");
  }

  try {
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert({
        projectId,
        clientEmail,
        // Convert escaped newlines to actual newlines in the private key
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
    admin = firebaseAdmin;
    console.log("Firebase Admin initialized successfully with service account credentials");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    throw error;
  }
} else {
  admin = firebaseAdmin;
}


export { admin };

