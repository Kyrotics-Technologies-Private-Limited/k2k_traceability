import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "crypto";
import { admin } from "@/lib/firebase-admin";
import { pad3 } from "@/lib/format";
import { uploadAdminFile } from "./storage";
import type { AdminBatch, ServiceResult } from "./types";

function db() {
  return admin.firestore();
}

export async function listBatchesByProduct(productId: string): Promise<AdminBatch[]> {
  const snap = await db()
    .collection("productCategory")
    .doc(productId)
    .collection("batches")
    .get();

  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<AdminBatch, "id">),
  }));
}

export async function getBatchDetails(
  productId: string,
  batchId: string
): Promise<AdminBatch | null> {
  const snap = await db()
    .collection("productCategory")
    .doc(productId)
    .collection("batches")
    .doc(batchId)
    .get();

  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as Omit<AdminBatch, "id">) };
}

export async function addBatchToProduct(input: {
  productId: string;
  limitQuantity: number;
  testReport?: Buffer | null;
  testReportName?: string | null;
  testReportType?: string | null;
}): Promise<ServiceResult<{ batchId: string; batchNo: string }>> {
  try {
    const batchCollectionRef = db()
      .collection("productCategory")
      .doc(input.productId)
      .collection("batches");

    const latest = await batchCollectionRef.orderBy("batchNo", "desc").limit(1).get();
    let newBatchNo = "001";
    if (!latest.empty) {
      const lastBatchNo = parseInt(String(latest.docs[0].data().batchNo), 10);
      newBatchNo = pad3(lastBatchNo + 1);
    }

    let reportUrl = "";
    if (input.testReport) {
      const fileName = input.testReportName ?? "test-report";
      reportUrl = await uploadAdminFile(
        input.testReport,
        `testReport/${randomUUID()}-${fileName}`,
        input.testReportType ?? "application/octet-stream"
      );
    }

    const batchRef = await batchCollectionRef.add({
      batchNo: newBatchNo,
      limitQuantity: input.limitQuantity,
      testReport: reportUrl,
    });

    await db()
      .collection("productCategory")
      .doc(input.productId)
      .update({ batchCount: FieldValue.increment(1) });

    return {
      success: true,
      data: { batchId: batchRef.id, batchNo: newBatchNo },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function updateBatchTestReport(input: {
  productId: string;
  batchId: string;
  testReport: Buffer;
  testReportName?: string | null;
  testReportType?: string | null;
}): Promise<ServiceResult<{ reportUrl: string }>> {
  try {
    const fileName = input.testReportName ?? "test-report";
    const reportUrl = await uploadAdminFile(
      input.testReport,
      `testReport/${randomUUID()}-${fileName}`,
      input.testReportType ?? "application/octet-stream"
    );

    await db()
      .collection("productCategory")
      .doc(input.productId)
      .collection("batches")
      .doc(input.batchId)
      .update({ testReport: reportUrl });

    return { success: true, data: { reportUrl } };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function deleteBatch(
  productId: string,
  batchId: string
): Promise<ServiceResult> {
  try {
    const packetsSnap = await db()
      .collection("productCategory")
      .doc(productId)
      .collection("batches")
      .doc(batchId)
      .collection("packets")
      .get();

    const writeBatch = db().batch();

    for (const packetDoc of packetsSnap.docs) {
      const serialNo = packetDoc.data().serialNo as string | undefined;
      writeBatch.delete(packetDoc.ref);
      if (serialNo) {
        writeBatch.delete(db().collection("serialNumbers").doc(serialNo));
      }
    }

    writeBatch.delete(
      db().collection("productCategory").doc(productId).collection("batches").doc(batchId)
    );
    await writeBatch.commit();

    await db()
      .collection("productCategory")
      .doc(productId)
      .update({ batchCount: FieldValue.increment(-1) });

    return { success: true, message: "Batch deleted successfully" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
