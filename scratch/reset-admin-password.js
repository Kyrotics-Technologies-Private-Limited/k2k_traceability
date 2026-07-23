/**
 * One-off: reset Email/Password for an Auth user in the configured Firebase project.
 *
 * Usage:
 *   node scratch/reset-admin-password.js
 *   node scratch/reset-admin-password.js admin@gmail.com 123456
 *
 * Requires FIREBASE_PROJECT_ID in .env.
 * Prefer Application Default Credentials (gcloud auth application-default login),
 * or set FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY for the NEW project only.
 */
const path = require("path");
const fs = require("fs");

const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
  console.log("Loaded env from:", envPath);
} else {
  console.error("Error: .env not found at:", envPath);
  process.exit(1);
}

const admin = require("firebase-admin");

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId) {
  console.error("Error: Missing FIREBASE_PROJECT_ID in .env");
  process.exit(1);
}

function serviceAccountProjectId(email) {
  if (!email) return null;
  const match = email.match(/@([^.]+)\.iam\.gserviceaccount\.com$/);
  return match?.[1] ?? null;
}

const saProjectId = serviceAccountProjectId(clientEmail);
const useCert =
  Boolean(clientEmail && privateKey && saProjectId === projectId);

if (useCert) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
    projectId,
  });
  console.log(`Admin SDK: service account for project ${projectId}`);
} else {
  if (clientEmail || privateKey) {
    console.warn(
      `Ignoring mismatched service account (email project=${saProjectId ?? "unknown"}, FIREBASE_PROJECT_ID=${projectId}). Using ADC.`
    );
  }
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId,
  });
  console.log(`Admin SDK: ADC for project ${projectId}`);
}

const email = process.argv[2] || "admin@gmail.com";
const newPassword = process.argv[3] || "123456";

async function main() {
  console.log(`\nLooking up Auth user: ${email}`);
  const user = await admin.auth().getUserByEmail(email);
  console.log(`Found uid=${user.uid}`);
  console.log(`emailVerified=${user.emailVerified} disabled=${user.disabled}`);
  console.log(`providerData=${JSON.stringify(user.providerData.map((p) => p.providerId))}`);

  await admin.auth().updateUser(user.uid, {
    password: newPassword,
    disabled: false,
  });

  console.log(`\nPassword updated for ${email} (uid=${user.uid}) in project ${projectId}.`);
  console.log("Try login again with that email and the new password.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\nFailed:", err.message || err);
    if (String(err.message || "").includes("Could not load the default credentials")) {
      console.error(
        "\nTip: run  gcloud auth application-default login\n" +
          "     then  gcloud config set project univillage-503009\n" +
          "Or set FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY for univillage-503009 in .env"
      );
    }
    process.exit(1);
  });
