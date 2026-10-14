#!/usr/bin/env node

const { applicationDefault, cert, getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const projectId = process.env.FIREBASE_PROJECT_ID;

if (!email || !password || !projectId) {
  console.error(
    "Set ADMIN_EMAIL, ADMIN_PASSWORD, and FIREBASE_PROJECT_ID before running this script."
  );
  process.exit(1);
}

if (password.length < 6) {
  console.error("ADMIN_PASSWORD must be at least 6 characters.");
  process.exit(1);
}

function getCredential() {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    const serviceAccountProject = clientEmail.match(/@([^.]+)\.iam\.gserviceaccount\.com$/)?.[1];
    if (serviceAccountProject !== projectId) {
      throw new Error(
        `FIREBASE_CLIENT_EMAIL must belong to FIREBASE_PROJECT_ID (${projectId}).`
      );
    }

    return cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    });
  }

  if (clientEmail || privateKey) {
    throw new Error(
      "Set both FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY, or use Application Default Credentials."
    );
  }

  return applicationDefault();
}

async function main() {
  const app =
    getApps()[0] ??
    initializeApp({
      credential: getCredential(),
      projectId,
    });
  const auth = getAuth(app);
  const db = getFirestore(app);

  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      throw error;
    }
  }

  if (user) {
    user = await auth.updateUser(user.uid, { password, email });
    console.log(`Updated Firebase Authentication user ${email}.`);
  } else {
    user = await auth.createUser({ email, password });
    console.log(`Created Firebase Authentication user ${email}.`);
  }

  const userRef = db.collection("users").doc(user.uid);
  const profile = await userRef.get();
  const now = new Date().toISOString();

  await userRef.set(
    {
      email,
      name: profile.data()?.name || user.displayName || email.split("@")[0],
      role: "admin",
      updatedAt: now,
      ...(profile.exists ? {} : { createdAt: now }),
    },
    { merge: true }
  );

  await auth.setCustomUserClaims(user.uid, {
    ...user.customClaims,
    role: "admin",
  });

  console.log(`Granted admin role in Firestore and Firebase custom claims for ${email}.`);
}

main().catch((error) => {
  console.error("Failed to update the admin user:", error);
  process.exitCode = 1;
});
