import type { DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import { padBatch, padBottle, padProduct } from "@/lib/format";

export interface CustomerBottleDetails {
  bottleNo: string;
  productName?: string;
  productDetails?: string;
  description?: string;
  productImage?: string;
  batchNo?: string;
  testReport?: string;
  refractometerReport?: string;
  manufacturingDate?: string;
  expiryDate?: string;
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
 * Resolve a bottle serial or product code via index or nested productCategory/batches/packets.
 */
export async function resolveCustomerBottleDetails(
  db: Firestore,
  rawBottleNo: string
): Promise<CustomerBottleDetails | null> {
  // Clean raw serial (remove leading/trailing dashes and whitespace)
  const cleanBottleNo = rawBottleNo.trim().replace(/^-+|-+$/g, "");
  if (!cleanBottleNo) return null;

  // 1. Try direct index in bottleNumbers / serialNumbers
  const indexSnap = await resolveBottleIndexDoc(db, cleanBottleNo);
  if (indexSnap?.exists) {
    const index = indexSnap.data() as {
      productCategoryId?: string;
      batchId?: string;
      packetId?: string;
    };

    if (index.productCategoryId) {
      const productSnap = await db.collection("productCategory").doc(index.productCategoryId).get();
      if (productSnap.exists) {
        const product = productSnap.data()!;
        let batchData: Record<string, unknown> = {};
        let packetData: Record<string, unknown> = {};

        if (index.batchId) {
          const batchSnap = await db
            .collection("productCategory")
            .doc(index.productCategoryId)
            .collection("batches")
            .doc(index.batchId)
            .get();
          if (batchSnap.exists) {
            batchData = batchSnap.data() ?? {};
          }
        }

        if (index.batchId && index.packetId) {
          const packetSnap = await db
            .collection("productCategory")
            .doc(index.productCategoryId)
            .collection("batches")
            .doc(index.batchId)
            .collection("packets")
            .doc(index.packetId)
            .get();
          if (packetSnap.exists) {
            packetData = packetSnap.data() ?? {};
          }
        }

        return {
          bottleNo: cleanBottleNo,
          productName: (product.productName as string) || undefined,
          productDetails: (product.productDetails as string) || undefined,
          description: (product.description as string) || undefined,
          productImage: (product.productImage as string) || undefined,
          batchNo: (batchData.batchNo as string) || undefined,
          testReport: (batchData.testReport as string) || undefined,
          refractometerReport: (packetData.refractometerReport as string) || undefined,
          manufacturingDate: (batchData.manufacturingDate as string) || (batchData.createdAt as string) || undefined,
          expiryDate: (batchData.expiryDate as string) || undefined,
        };
      }
    }
  }

  // 2. Direct lookup by parsing parts: ProductCode - BatchCode - BottleCode
  const parts = cleanBottleNo.split("-").map((p) => p.trim()).filter(Boolean);
  const productPart = parts[0] || "";
  const batchPart = parts[1] || "";
  const packetPart = parts[2] || "";

  if (!productPart) return null;

  // Search productCategory by productCategoryId (padded or unpadded) or document ID
  let targetProductDoc: DocumentSnapshot | null = null;

  // Try direct doc ID
  const directProductSnap = await db.collection("productCategory").doc(productPart).get();
  if (directProductSnap.exists) {
    targetProductDoc = directProductSnap;
  } else {
    // Try where productCategoryId == productPart or padded
    const paddedProduct = padProduct(productPart);
    const queryPadded = await db
      .collection("productCategory")
      .where("productCategoryId", "in", [productPart, paddedProduct])
      .limit(1)
      .get();

    if (!queryPadded.empty) {
      targetProductDoc = queryPadded.docs[0];
    } else {
      // Fallback: list all and check if ID or name matches
      const allProducts = await db.collection("productCategory").get();
      for (const pDoc of allProducts.docs) {
        const pData = pDoc.data();
        const pCatId = String(pData.productCategoryId ?? "");
        if (
          pCatId === productPart ||
          pCatId === paddedProduct ||
          pDoc.id === productPart ||
          (pData.productName &&
            String(pData.productName).toLowerCase() === productPart.toLowerCase())
        ) {
          targetProductDoc = pDoc;
          break;
        }
      }
    }
  }

  if (!targetProductDoc || !targetProductDoc.exists) {
    return null;
  }

  const product = targetProductDoc.data()!;
  const productId = targetProductDoc.id;

  // Now resolve Batch
  let targetBatchDoc: DocumentSnapshot | null = null;
  const batchesCollection = db.collection("productCategory").doc(productId).collection("batches");

  if (batchPart) {
    // Direct batch ID
    const directBatchSnap = await batchesCollection.doc(batchPart).get();
    if (directBatchSnap.exists) {
      targetBatchDoc = directBatchSnap;
    } else {
      const paddedBatch = padBatch(batchPart);
      const queryBatch = await batchesCollection
        .where("batchNo", "in", [batchPart, paddedBatch])
        .limit(1)
        .get();
      if (!queryBatch.empty) {
        targetBatchDoc = queryBatch.docs[0];
      }
    }
  }

  // If batch not found by specific code or not specified, fetch latest/first batch
  if (!targetBatchDoc) {
    const latestBatches = await batchesCollection.orderBy("batchNo", "desc").limit(1).get();
    if (!latestBatches.empty) {
      targetBatchDoc = latestBatches.docs[0];
    } else {
      const anyBatch = await batchesCollection.limit(1).get();
      if (!anyBatch.empty) {
        targetBatchDoc = anyBatch.docs[0];
      }
    }
  }

  const batchData = targetBatchDoc?.data() ?? {};
  const batchId = targetBatchDoc?.id;

  // Now resolve Packet
  let targetPacketDoc: DocumentSnapshot | null = null;
  if (batchId) {
    const packetsCollection = batchesCollection.doc(batchId).collection("packets");

    if (packetPart) {
      const directPacketSnap = await packetsCollection.doc(packetPart).get();
      if (directPacketSnap.exists) {
        targetPacketDoc = directPacketSnap;
      } else {
        const paddedPacket = padBottle(packetPart);
        const queryPacket = await packetsCollection
          .where("packetNo", "in", [packetPart, paddedPacket])
          .limit(1)
          .get();
        if (!queryPacket.empty) {
          targetPacketDoc = queryPacket.docs[0];
        }
      }
    }

    if (!targetPacketDoc) {
      const firstPacket = await packetsCollection.limit(1).get();
      if (!firstPacket.empty) {
        targetPacketDoc = firstPacket.docs[0];
      }
    }
  }

  const packetData = targetPacketDoc?.data() ?? {};
  const resolvedBatchNo = (batchData.batchNo as string) || (batchPart ? padBatch(batchPart) : "00001");
  const resolvedProductCode = (product.productCategoryId as string) || padProduct(productPart);
  const resolvedPacketNo = (packetData.packetNo as string) || (packetPart ? padBottle(packetPart) : "00001");
  const displayBottleNo = cleanBottleNo.includes("-")
    ? cleanBottleNo
    : `${resolvedProductCode}-${resolvedBatchNo}-${resolvedPacketNo}`;

  return {
    bottleNo: displayBottleNo,
    productName: (product.productName as string) || undefined,
    productDetails: (product.productDetails as string) || undefined,
    description: (product.description as string) || undefined,
    productImage: (product.productImage as string) || undefined,
    batchNo: resolvedBatchNo,
    testReport: (batchData.testReport as string) || undefined,
    refractometerReport: (packetData.refractometerReport as string) || undefined,
    manufacturingDate: (batchData.manufacturingDate as string) || (batchData.createdAt as string) || undefined,
    expiryDate: (batchData.expiryDate as string) || undefined,
  };
}
