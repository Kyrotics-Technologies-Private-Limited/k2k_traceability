/** Zero-pad product IDs to 3 digits. */
export function padProduct(value: string | number | undefined): string {
  return String(value ?? "").trim().padStart(3, "0");
}

/** Zero-pad batch numbers to 4 digits. */
export function padBatch(value: string | number | undefined): string {
  return String(value ?? "").trim().padStart(4, "0");
}

/** Zero-pad bottle numbers to 5 digits. */
export function padBottle(value: string | number | undefined): string {
  return String(value ?? "").trim().padStart(5, "0");
}
