// lib/firebase-admin.ts
import * as firebaseAdmin from "firebase-admin";

let initialized = false;

function serviceAccountProjectId(clientEmail: string | undefined): string | null {
  if (!clientEmail) return null;
  // firebase-adminsdk-...@PROJECT_ID.iam.gserviceaccount.com
  const match = clientEmail.match(/@([^.]+)\.iam\.gserviceaccount\.com$/);
  return match?.[1] ?? null;
}

function ensureAdmin(): typeof firebaseAdmin {
  if (initialized || firebaseAdmin.apps.length) {
    initialized = true;
    return firebaseAdmin;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const saProjectId = serviceAccountProjectId(clientEmail);
  const certMatchesProject =
    Boolean(projectId && clientEmail && privateKey && saProjectId === projectId);

  if (!projectId) {
    console.error("Firebase Admin SDK: Missing FIREBASE_PROJECT_ID");
    throw new Error("Firebase Admin SDK: Missing FIREBASE_PROJECT_ID");
  }

  try {
    if (certMatchesProject) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({
          projectId,
          clientEmail: clientEmail!,
          privateKey: privateKey!.replace(/\\n/g, "\n"),
        }),
        projectId,
      });
      console.log(
        `Firebase Admin initialized with service account for project ${projectId}`
      );
    } else {
      if (clientEmail || privateKey) {
        console.warn(
          `Firebase Admin: ignoring mismatched service account ` +
            `(email project=${saProjectId ?? "unknown"}, FIREBASE_PROJECT_ID=${projectId}). ` +
            `Falling back to Application Default Credentials.`
        );
      }
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.applicationDefault(),
        projectId,
      });
      console.log(
        `Firebase Admin initialized with ADC for project ${projectId}`
      );
    }
    initialized = true;
    return firebaseAdmin;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    throw error;
  }
}

/** Lazily initialized so `next build` can import API routes without credentials. */
export const admin = new Proxy({} as typeof firebaseAdmin, {
  get(_target, prop, receiver) {
    const instance = ensureAdmin();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
