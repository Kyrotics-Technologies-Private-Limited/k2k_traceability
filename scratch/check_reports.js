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

async function inspectTargeted() {
  const cats = await db.collection('productCategory').get();
  for (const doc of cats.docs) {
    const data = doc.data();
    console.log(`\nProduct [${doc.id}]: name="${data.productName}", productCategoryId="${data.productCategoryId}"`);

    const batches = await doc.ref.collection('batches').get();
    for (const b of batches.docs) {
      const bData = b.data();
      console.log(`  Batch [${b.id}]: batchNo="${bData.batchNo}"`);
      console.log(`    Batch data:`, JSON.stringify(bData, null, 2));

      // Show sample packets (first 5)
      const packets = await b.ref.collection('packets').limit(5).get();
      for (const p of packets.docs) {
        console.log(`    Packet [${p.id}]:`, JSON.stringify(p.data(), null, 2));
      }

      // Check packet 0001 or 00001 specifically
      const p1 = await b.ref.collection('packets').doc('0001').get();
      if (p1.exists) console.log(`    Direct packet '0001':`, p1.data());
      const p2 = await b.ref.collection('packets').doc('00001').get();
      if (p2.exists) console.log(`    Direct packet '00001':`, p2.data());

      const queryP1 = await b.ref.collection('packets').where('packetNo', 'in', ['0001', '00001', '1']).get();
      queryP1.docs.forEach(qp => console.log(`    Query packetNo match [${qp.id}]:`, qp.data()));
    }
  }

  console.log("\n=== Checking bottleNumbers index ===");
  for (const code of ['002-0001-0001', '002-0001-00001', '003-0001-0001', '003-0001-00001', '002-00001-00001', '003-00001-00001']) {
    const doc1 = await db.collection('bottleNumbers').doc(code).get();
    if (doc1.exists) console.log(`bottleNumbers[${code}]:`, doc1.data());
    const doc2 = await db.collection('serialNumbers').doc(code).get();
    if (doc2.exists) console.log(`serialNumbers[${code}]:`, doc2.data());
  }
}

inspectTargeted().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
