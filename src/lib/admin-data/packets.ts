import { admin } from "@/lib/firebase-admin";
import { padBottle } from "@/lib/format";
import type { AdminPacket, ServiceResult } from "./types";

function db() {
  return admin.firestore();
}

async function getProductNo(productId: string): Promise<string> {
  const snap = await db().collection("productCategory").doc(productId).get();
  return String(snap.data()?.productCategoryId ?? "");
}

async function getBatchNo(productId: string, batchId: string): Promise<string> {
  const snap = await db()
    .collection("productCategory")
    .doc(productId)
    .collection("batches")
    .doc(batchId)
    .get();
  return String(snap.data()?.batchNo ?? "");
}

export async function listPackets(
  productId: string,
  batchId: string
): Promise<AdminPacket[]> {
  const productNo = await getProductNo(productId);
  const snap = await db()
    .collection("productCategory")
    .doc(productId)
    .collection("batches")
    .doc(batchId)
    .collection("packets")
    .get();

  return snap.docs.map((docSnap) => {
    const data = docSnap.data();
    let bottleNo = (data.bottleNo || data.serialNo) as string | undefined;
    if (bottleNo?.startsWith("undefined-")) {
      bottleNo = bottleNo.replace("undefined-", `${productNo}-`);
    } else if (bottleNo?.startsWith("undefined")) {
      bottleNo = bottleNo.replace("undefined", productNo);
    }
    return {
      id: docSnap.id,
      bottleNo,
      packetNo: data.packetNo as string | undefined,
      refractometerReport: data.refractometerReport as string | undefined,
    };
  });
}

export async function addPacketToBatch(input: {
  productId: string;
  batchId: string;
  refractometerReport: string;
}): Promise<ServiceResult<{ packetId: string }>> {
  try {
    const productNo = await getProductNo(input.productId);
    const batchNo = await getBatchNo(input.productId, input.batchId);
    if (!productNo || !batchNo) {
      throw new Error(`Missing product category ID (${productNo}) or batch number (${batchNo})`);
    }

    const batchRef = db()
      .collection("productCategory")
      .doc(input.productId)
      .collection("batches")
      .doc(input.batchId);

    const batchSnap = await batchRef.get();
    const batchData = batchSnap.data() ?? {};
    let currentQuantity = (batchData.quantity as number | undefined) ?? 0;

    const packetCollectionRef = batchRef.collection("packets");
    const latest = await packetCollectionRef.orderBy("packetNo", "desc").limit(1).get();
    let newPacketNo = "00001";
    if (!latest.empty) {
      const lastPacketNo = parseInt(String(latest.docs[0].data().packetNo), 10);
      newPacketNo = padBottle(lastPacketNo + 1);
    }

    const bottleNo = `${productNo}-${batchNo}-${newPacketNo}`;
    const packetRef = await packetCollectionRef.add({
      packetNo: newPacketNo,
      bottleNo,
      refractometerReport: input.refractometerReport,
    });

    await db().collection("bottleNumbers").doc(bottleNo).set({
      productCategoryId: input.productId,
      batchId: input.batchId,
      packetId: packetRef.id,
      bottleNo,
    });

    currentQuantity += 1;
    await batchRef.update({ quantity: currentQuantity });

    return { success: true, data: { packetId: packetRef.id } };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function generatePackets(input: {
  productId: string;
  batchId: string;
  quantity: number;
}): Promise<ServiceResult<{ packetIds: string[] }>> {
  try {
    const productNo = await getProductNo(input.productId);
    const batchNo = await getBatchNo(input.productId, input.batchId);
    if (!productNo || !batchNo) {
      throw new Error(`Missing product category ID (${productNo}) or batch number (${batchNo})`);
    }

    const batchRef = db()
      .collection("productCategory")
      .doc(input.productId)
      .collection("batches")
      .doc(input.batchId);

    const batchSnap = await batchRef.get();
    const batchData = batchSnap.data() ?? {};
    let currentQuantity = (batchData.quantity as number | undefined) ?? 0;

    const packetCollectionRef = batchRef.collection("packets");
    const latest = await packetCollectionRef.orderBy("packetNo", "desc").limit(1).get();
    let lastPacketNo = 0;
    if (!latest.empty) {
      lastPacketNo = parseInt(String(latest.docs[0].data().packetNo), 10);
    }

    const packetIds: string[] = [];
    for (let i = 1; i <= input.quantity; i++) {
      const newPacketNo = padBottle(lastPacketNo + i);
      const bottleNo = `${productNo}-${batchNo}-${newPacketNo}`;

      const packetRef = await packetCollectionRef.add({
        packetNo: newPacketNo,
        refractometerReport: "",
        bottleNo,
      });

      await db().collection("bottleNumbers").doc(bottleNo).set({
        productCategoryId: input.productId,
        batchId: input.batchId,
        packetId: packetRef.id,
        bottleNo,
      });

      packetIds.push(packetRef.id);
    }

    currentQuantity += input.quantity;
    await batchRef.update({ quantity: currentQuantity });

    return { success: true, data: { packetIds } };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function updateRefractometerReportById(input: {
  productId: string;
  batchId: string;
  packetId: string;
  refractometerReport: string;
}): Promise<ServiceResult> {
  try {
    const packetRef = db()
      .collection("productCategory")
      .doc(input.productId)
      .collection("batches")
      .doc(input.batchId)
      .collection("packets")
      .doc(input.packetId);

    const packetSnap = await packetRef.get();
    if (!packetSnap.exists) {
      return { success: false, message: "Packet not found" };
    }

    const packetData = packetSnap.data()!;
    const currentBottleNo = (packetData.bottleNo || packetData.serialNo) as string | undefined;
    let newBottleNo = currentBottleNo;

    if (!currentBottleNo || currentBottleNo.startsWith("undefined")) {
      const productNo = await getProductNo(input.productId);
      const batchNo = await getBatchNo(input.productId, input.batchId);
      const packetNo = packetData.packetNo as string | undefined;
      if (productNo && batchNo && packetNo) {
        if (packetNo.length > 3 || packetNo.includes("-")) {
          newBottleNo = `${productNo}-${batchNo}-${packetNo}`;
        } else {
          newBottleNo = `${productNo}${batchNo}${packetNo}`;
        }
      }
    }

    const updateData: Record<string, string> = {
      refractometerReport: input.refractometerReport,
    };
    if (newBottleNo && newBottleNo !== currentBottleNo) {
      updateData.bottleNo = newBottleNo;
    }

    await packetRef.update(updateData);

    if (newBottleNo) {
      const collectionName = newBottleNo.includes("-") ? "bottleNumbers" : "serialNumbers";
      await db().collection(collectionName).doc(newBottleNo).set({
        productCategoryId: input.productId,
        batchId: input.batchId,
        packetId: input.packetId,
        bottleNo: newBottleNo,
      });

      if (currentBottleNo && currentBottleNo !== newBottleNo) {
        try {
          const oldCollectionName = currentBottleNo.includes("-") ? "bottleNumbers" : "serialNumbers";
          await db().collection(oldCollectionName).doc(currentBottleNo).delete();
        } catch {
          // ignore missing legacy index
        }
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
