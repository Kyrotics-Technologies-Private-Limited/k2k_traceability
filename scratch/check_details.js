const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const admin = require('firebase-admin');

if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
} else {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

// Import resolve logic directly
function padProduct(value) { return String(value ?? "").trim().padStart(3, "0"); }
function padBatch(value) { return String(value ?? "").trim().padStart(5, "0"); }
function padBottle(value) { return String(value ?? "").trim().padStart(5, "0"); }

async function checkDetails(serial) {
  const parts = serial.split("-").map(p => p.trim());
  console.log(`\nTesting serial: "${serial}" (parts: ${JSON.stringify(parts)})`);

  // Check bottleNumbers
  const bDoc = await db.collection("bottleNumbers").doc(serial).get();
  console.log(`bottleNumbers[${serial}] exists:`, bDoc.exists);

  // Check padded version
  const paddedSerial = `${padProduct(parts[0])}-${padBatch(parts[1])}-${padBottle(parts[2])}`;
  console.log(`Padded serial: "${paddedSerial}"`);
  const bPadded = await db.collection("bottleNumbers").doc(paddedSerial).get();
  console.log(`bottleNumbers[${paddedSerial}] exists:`, bPadded.exists);
  if (bPadded.exists) {
    console.log(`bPadded data:`, bPadded.data());
  }

  // Check if packet exists under 002
  const p002 = await db.collection("productCategory").doc("o4qnE4zsA5Mc8G1jSSCc").get();
  console.log("Product 002 data:", p002.data());

  const b002 = await db.collection("productCategory").doc("o4qnE4zsA5Mc8G1jSSCc").collection("batches").doc("EgNMfNP0WFWh8Llhnc5X").get();
  console.log("Batch 002 data:", b002.data());

  const pktDoc = await db.collection("productCategory").doc("o4qnE4zsA5Mc8G1jSSCc").collection("batches").doc("EgNMfNP0WFWh8Llhnc5X").collection("packets").doc("FKunduTVAkOBxNtFaNH0").get();
  console.log("Packet 00001 data:", pktDoc.data());
}

async function run() {
  await checkDetails("002-0001-0001");
  await checkDetails("003-0001-00001");
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
