const path = require('path');
const fs = require('fs');

// Load .env variables
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log('Loaded env configuration from:', envPath);
} else {
  console.error('Error: .env file not found at:', envPath);
  process.exit(1);
}

const admin = require('firebase-admin');

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.error('Error: Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY in .env');
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

async function runSync() {
  console.log('Starting product category ID and serial number synchronization...\n');

  try {
    // 1. Fetch all product categories (traceability roots)
    const categorySnapshot = await db.collection('productCategory').get();
    console.log(`Found ${categorySnapshot.size} product categories in 'productCategory'.`);

    let totalProductsSynced = 0;
    let totalPacketsUpdated = 0;
    let totalGlobalRefsCreated = 0;
    let totalGlobalRefsDeleted = 0;

    for (const categoryDoc of categorySnapshot.docs) {
      const productId = categoryDoc.id;
      const categoryData = categoryDoc.data();
      const productCategoryId = categoryData.productCategoryId;
      const productName = categoryData.productName || 'Unnamed Product';

      console.log(`\n--------------------------------------------------`);
      console.log(`Processing Product: "${productName}" (ID: ${productId})`);
      
      if (!productCategoryId) {
        console.warn(`[SKIP] No productCategoryId found for product: ${productName}`);
        continue;
      }
      
      const paddedCategoryId = productCategoryId.trim().padStart(3, '0');
      console.log(`Target Category ID: ${paddedCategoryId}`);

      // 2. Synchronize to the products collection
      const productDocRef = db.collection('products').doc(productId);
      const productDocSnap = await productDocRef.get();

      if (productDocSnap.exists) {
        const productData = productDocSnap.data();
        if (productData.productCategoryId !== paddedCategoryId) {
          console.log(`[UPDATE] Syncing productCategoryId in 'products/${productId}' from '${productData.productCategoryId}' -> '${paddedCategoryId}'`);
          await productDocRef.update({
            productCategoryId: paddedCategoryId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          totalProductsSynced++;
        } else {
          console.log(`[OK] productCategoryId in 'products/${productId}' is already synchronized.`);
        }
      } else {
        console.warn(`[WARN] Corresponding document in 'products' collection not found for ID: ${productId}`);
      }

      // 3. Scan Batches and Packets
      const batchesRef = db.collection('productCategory').doc(productId).collection('batches');
      const batchesSnapshot = await batchesRef.get();
      console.log(`Found ${batchesSnapshot.size} batches under this product category.`);

      for (const batchDoc of batchesSnapshot.docs) {
        const batchId = batchDoc.id;
        const batchData = batchDoc.data();
        const batchNo = batchData.batchNo;

        if (!batchNo) {
          console.warn(`[SKIP] Batch "${batchId}" is missing 'batchNo' field.`);
          continue;
        }

        const paddedBatchNo = batchNo.trim().padStart(3, '0');
        const packetsRef = db.collection('productCategory').doc(productId).collection('batches').doc(batchId).collection('packets');
        const packetsSnapshot = await packetsRef.get();

        console.log(` - Batch ${paddedBatchNo} (ID: ${batchId}): scanning ${packetsSnapshot.size} packets...`);

        let batchOperations = db.batch();
        let operationCount = 0;

        for (const packetDoc of packetsSnapshot.docs) {
          const packetId = packetDoc.id;
          const packetData = packetDoc.data();
          const packetNo = packetData.packetNo;
          const oldSerialNo = packetData.serialNo;

          if (!packetNo) {
            console.warn(`   [SKIP] Packet "${packetId}" is missing 'packetNo' field.`);
            continue;
          }

          const paddedPacketNo = packetNo.trim().padStart(3, '0');
          // Format expected: ProductCategoryId (3 digits) + BatchNo (3 digits) + PacketNo (3 digits)
          const newSerialNo = `${paddedCategoryId}${paddedBatchNo}${paddedPacketNo}`;

          if (oldSerialNo !== newSerialNo) {
            console.log(`   [MISMATCH] Packet ${packetId}: old serial: '${oldSerialNo}', new serial: '${newSerialNo}'`);

            // Update packet document serial number
            batchOperations.update(packetDoc.ref, {
              serialNo: newSerialNo,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            operationCount++;
            totalPacketsUpdated++;

            // Create/set new global mapping reference
            const newGlobalRef = db.collection('serialNumbers').doc(newSerialNo);
            batchOperations.set(newGlobalRef, {
              productCategoryId: productId,
              batchId,
              packetId,
              serialNo: newSerialNo,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            operationCount++;
            totalGlobalRefsCreated++;

            // Delete old global mapping reference
            if (oldSerialNo) {
              const oldGlobalRef = db.collection('serialNumbers').doc(oldSerialNo);
              batchOperations.delete(oldGlobalRef);
              operationCount++;
              totalGlobalRefsDeleted++;
            }

            // Flush batch if close to limit of 500
            if (operationCount >= 400) {
              console.log('   Committing batch of 400 operations...');
              await batchOperations.commit();
              batchOperations = db.batch();
              operationCount = 0;
            }
          }
        }

        if (operationCount > 0) {
          await batchOperations.commit();
        }
      }
    }

    console.log(`\n==================================================`);
    console.log(`Synchronization Summary:`);
    console.log(` - Total product docs synced in 'products': ${totalProductsSynced}`);
    console.log(` - Total packet documents updated in subcollections: ${totalPacketsUpdated}`);
    console.log(` - Total global serialNumber entries created: ${totalGlobalRefsCreated}`);
    console.log(` - Total global serialNumber entries deleted: ${totalGlobalRefsDeleted}`);
    console.log(`==================================================`);
    console.log(`Synchronization finished successfully!`);
  } catch (error) {
    console.error('Synchronization failed with error:', error);
  }
}

runSync();
