import type { DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import { pad3 } from "@/lib/format";

export interface CustomerSerialDetails {
  serialNo: string;
  productName?: string;
  productDetails?: string;
  description?: string;
  productImage?: string;
  batchNo?: string;
  testReport?: string;
  refractometerReport?: string;
}

async function resolveSerialIndexDoc(
  db: Firestore,
  serialNo: string
): Promise<DocumentSnapshot | null> {
  const direct = await db.collection("serialNumbers").doc(serialNo).get();
  if (direct.exists) return direct;

  const categoriesSnap = await db.collection("productCategory").get();
  for (const categoryDoc of categoriesSnap.docs) {
    const categoryCode = pad3(categoryDoc.data().productCategoryId as string | undefined);
    if (!categoryCode || !serialNo.startsWith(categoryCode)) continue;

    const fallbackSerial = serialNo.replace(categoryCode, "undefined");
    const fallbackSnap = await db.collection("serialNumbers").doc(fallbackSerial).get();
    if (fallbackSnap.exists) return fallbackSnap;
  }

  return null;
}

/**
 * Resolve a bottle serial via serialNumbers index → nested productCategory/batches/packets.
 */
export async function resolveCustomerSerialDetails(
  db: Firestore,
  rawSerialNo: string
): Promise<CustomerSerialDetails | null> {
  const serialNo = rawSerialNo.trim();
  if (!serialNo) return null;

  const indexSnap = await resolveSerialIndexDoc(db, serialNo);
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
    serialNo,
    productName: product.productName as string | undefined,
    productDetails: product.productDetails as string | undefined,
    description: product.description as string | undefined,
    productImage: product.productImage as string | undefined,
    batchNo: batch.batchNo as string | undefined,
    testReport: batch.testReport as string | undefined,
    refractometerReport: packet.refractometerReport as string | undefined,
  };
}
