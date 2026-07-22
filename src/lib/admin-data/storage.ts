import { randomUUID } from "crypto";
import { admin } from "@/lib/firebase-admin";

function getBucketName(): string {
  const bucket =
    process.env.FIREBASE_STORAGE_BUCKET ??
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucket) {
    throw new Error("Firebase Storage bucket is not configured");
  }
  return bucket;
}

export async function uploadAdminFile(
  buffer: Buffer,
  objectPath: string,
  contentType: string
): Promise<string> {
  const bucket = admin.storage().bucket(getBucketName());
  const file = bucket.file(objectPath);
  const downloadToken = randomUUID();

  await file.save(buffer, {
    metadata: {
      contentType,
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
  });

  const encoded = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media&token=${downloadToken}`;
}
