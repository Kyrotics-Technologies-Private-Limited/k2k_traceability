import type { Firestore } from "firebase-admin/firestore";
import { admin } from "@/lib/firebase-admin";

export function getTraceabilityFirestore(): Firestore {
  return admin.firestore();
}
