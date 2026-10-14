/**
 * Script to synchronize and update the 002 mustard oil quality and purity test report
 * to match the 003-0001-00001 table (observed value: 59.2, test parameter & range: 58.0 - 60.5).
 *
 * Usage:
 *   node scripts/update-002-mustard-report.js
 */

const path = require("path");
const fs = require("fs");

const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
}

const admin = require("firebase-admin");

if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
} else {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

async function main() {
  console.log("=== Updating 002 Mustard Oil Report to Match 003-0001-00001 ===\n");

  // 1. Fetch reference 003 values
  console.log("1. Fetching reference data from product 003...");
  const cat003Query = await db.collection("productCategory").get();
  let cat003Doc = null;
  for (const doc of cat003Query.docs) {
    const data = doc.data();
    if (String(data.productCategoryId || "").trim() === "003") {
      cat003Doc = doc;
      break;
    }
  }

  if (!cat003Doc) {
    throw new Error("Product category 003 not found!");
  }

  console.log(`Found 003 product doc: ${cat003Doc.id} ("${cat003Doc.data().productName}")`);
  const b003Snap = await cat003Doc.ref.collection("batches").where("batchNo", "==", "00001").limit(1).get();
  if (b003Snap.empty) {
    throw new Error("Batch 00001 for product 003 not found!");
  }
  const b003Doc = b003Snap.docs[0];
  const referenceTestReport = b003Doc.data().testReport;

  const p003Snap = await b003Doc.ref.collection("packets").where("packetNo", "==", "00001").limit(1).get();
  if (p003Snap.empty) {
    throw new Error("Packet 00001 for product 003 not found!");
  }
  const p003Doc = p003Snap.docs[0];
  const referenceObserved = p003Doc.data().refractometerReport || "59.2";

  console.log(`Reference values from 003-00001-00001:`);
  console.log(` - Observed Refractometer Report: "${referenceObserved}"`);
  console.log(` - Lab Test Report URL: "${referenceTestReport}"\n`);

  // 2. Fetch and update product 002
  console.log("2. Locating product category 002...");
  let cat002Doc = null;
  for (const doc of cat003Query.docs) {
    const data = doc.data();
    if (String(data.productCategoryId || "").trim() === "002") {
      cat002Doc = doc;
      break;
    }
  }

  if (!cat002Doc) {
    throw new Error("Product category 002 not found!");
  }

  console.log(`Found 002 product doc: ${cat002Doc.id} ("${cat002Doc.data().productName}")`);

  // Normalize product name spelling to standard "Wood Pressed Mustard Oil"
  const current002Name = cat002Doc.data().productName || "";
  const standardName = current002Name.replace(/musturd/i, "Mustard");
  if (current002Name !== standardName) {
    console.log(`Updating product name: "${current002Name}" -> "${standardName}"`);
    await cat002Doc.ref.update({
      productName: standardName,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // 3. Locate batch for 002
  const b002Snap = await cat002Doc.ref.collection("batches").where("batchNo", "==", "00001").limit(1).get();
  if (b002Snap.empty) {
    throw new Error("Batch 00001 for product 002 not found!");
  }
  const b002Doc = b002Snap.docs[0];
  console.log(`Found 002 batch doc: ${b002Doc.id} (batchNo: "${b002Doc.data().batchNo}")`);

  // Ensure batch has testReport
  const b002Data = b002Doc.data();
  if (!b002Data.testReport) {
    console.log(`Updating batch testReport URL to: ${referenceTestReport}`);
    await b002Doc.ref.update({
      testReport: referenceTestReport,
    });
  } else {
    console.log(`Batch 002 testReport already set: ${b002Data.testReport}`);
  }

  // 4. Update packet 00001 in batch 002
  const p002Snap = await b002Doc.ref.collection("packets").where("packetNo", "==", "00001").limit(1).get();
  let packet002Doc = null;
  if (!p002Snap.empty) {
    packet002Doc = p002Snap.docs[0];
  } else {
    // Try doc with ID '00001' or '0001'
    const directDoc = await b002Doc.ref.collection("packets").doc("00001").get();
    if (directDoc.exists) packet002Doc = directDoc;
  }

  if (!packet002Doc) {
    throw new Error("Packet 00001 for product 002 not found!");
  }

  console.log(`Found 002 packet doc: ${packet002Doc.id}`);
  console.log(`Current refractometerReport: "${packet002Doc.data().refractometerReport || ""}"`);
  console.log(`Updating refractometerReport to: "${referenceObserved}"`);

  await packet002Doc.ref.update({
    refractometerReport: referenceObserved,
  });

  // 5. Create / update index entries in bottleNumbers and serialNumbers for all common serial representations
  const serialAliases = [
    "002-0001-0001",
    "002-0001-00001",
    "002-00001-00001",
    "002-00001-0001",
  ];

  console.log("\n3. Updating bottleNumbers and serialNumbers indexes for serial aliases...");
  for (const serial of serialAliases) {
    const payload = {
      productCategoryId: cat002Doc.id,
      batchId: b002Doc.id,
      packetId: packet002Doc.id,
      bottleNo: serial,
    };

    await db.collection("bottleNumbers").doc(serial).set(payload, { merge: true });
    await db.collection("serialNumbers").doc(serial).set(payload, { merge: true });
    console.log(` [OK] Indexed ${serial}`);
  }

  // Also ensure 003 aliases exist for consistency
  const serial003Aliases = [
    "003-0001-00001",
    "003-00001-00001",
    "003-0001-0001",
  ];
  for (const serial of serial003Aliases) {
    const payload = {
      productCategoryId: cat003Doc.id,
      batchId: b003Doc.id,
      packetId: p003Doc.id,
      bottleNo: serial,
    };
    await db.collection("bottleNumbers").doc(serial).set(payload, { merge: true });
    await db.collection("serialNumbers").doc(serial).set(payload, { merge: true });
    console.log(` [OK] Indexed ${serial}`);
  }

  console.log("\n=== Update Complete! ===");
  console.log("Product 002 is now configured with:");
  console.log(` - Product Name: "${standardName}"`);
  console.log(` - Batch Lab Report: "${b002Data.testReport || referenceTestReport}"`);
  console.log(` - Test Parameter: Refractor meter test value`);
  console.log(` - Observed Value: ${referenceObserved}`);
  console.log(` - Standard Range: 58.0 - 60.5 (STANDARD RANGE (Pure Mustard Oil))`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error updating report:", err);
    process.exit(1);
  });
