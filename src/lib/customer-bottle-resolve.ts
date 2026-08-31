import type { DocumentSnapshot, Firestore } from "firebase-admin/firestore";

export interface CustomerBottleDetails {
  bottleNo: string;
  productName?: string;
  productDetails?: string;
  description?: string;
  productImage?: string;
  batchNo?: string;
  testReport?: string;
  refractometerReport?: string;
}

async function resolveBottleIndexDoc(
  db: Firestore,
  bottleNo: string
): Promise<DocumentSnapshot | null> {
  const directNew = await db.collection("bottleNumbers").doc(bottleNo).get();
  if (directNew.exists) return directNew;

  const directOld = await db.collection("serialNumbers").doc(bottleNo).get();
  if (directOld.exists) return directOld;

  const categoriesSnap = await db.collection("productCategory").get();
  for (const categoryDoc of categoriesSnap.docs) {
    const categoryCode = String(categoryDoc.data().productCategoryId || "");
    if (!categoryCode) continue;

    if (bottleNo.includes("-")) {
      if (bottleNo.startsWith(`${categoryCode}-`)) {
        const fallbackBottle = bottleNo.replace(`${categoryCode}-`, "undefined-");
        const fallbackSnapNew = await db.collection("bottleNumbers").doc(fallbackBottle).get();
        if (fallbackSnapNew.exists) return fallbackSnapNew;
        const fallbackSnapOld = await db.collection("serialNumbers").doc(fallbackBottle).get();
        if (fallbackSnapOld.exists) return fallbackSnapOld;
      }
    } else {
      if (bottleNo.startsWith(categoryCode)) {
        const fallbackBottle = bottleNo.replace(categoryCode, "undefined");
        const fallbackSnapNew = await db.collection("bottleNumbers").doc(fallbackBottle).get();
        if (fallbackSnapNew.exists) return fallbackSnapNew;
        const fallbackSnapOld = await db.collection("serialNumbers").doc(fallbackBottle).get();
        if (fallbackSnapOld.exists) return fallbackSnapOld;
      }
    }
  }

  return null;
}

/**
 * Resolve a bottle serial via index → nested productCategory/batches/packets.
 */
export async function resolveCustomerBottleDetails(
  db: Firestore,
  rawBottleNo: string
): Promise<CustomerBottleDetails | null> {
  const bottleNo = rawBottleNo.trim();
  if (!bottleNo) return null;

  const indexSnap = await resolveBottleIndexDoc(db, bottleNo);
  if (!indexSnap?.exists) return null;

  const index = indexSnap.data() as {
    productCategoryId?: string;
    batchId?: string;
    packetId?: string;
  };

  if (!index.productCategoryId || !index.batchId || !index.packetId) return null;

  const [productSnap, batchSnap, packetSnap] = await Promise.all([
    db.collection("productCategory").doc(index.productCategoryId).get(),
    db
      .collection("productCategory")
      .doc(index.productCategoryId)
      .collection("batches")
      .doc(index.batchId)
      .get(),
    db
      .collection("productCategory")
      .doc(index.productCategoryId)
      .collection("batches")
      .doc(index.batchId)
      .collection("packets")
      .doc(index.packetId)
      .get(),
  ]);

  if (!productSnap.exists || !batchSnap.exists || !packetSnap.exists) return null;

  const product = productSnap.data()!;
  const batch = batchSnap.data()!;
  const packet = packetSnap.data()!;

  return {
    bottleNo,
    productName: product.productName as string | undefined,
    productDetails: product.productDetails as string | undefined,
    description: product.description as string | undefined,
    productImage: product.productImage as string | undefined,
    batchNo: batch.batchNo as string | undefined,
    testReport: batch.testReport as string | undefined,
    refractometerReport: packet.refractometerReport as string | undefined,
  };
}
