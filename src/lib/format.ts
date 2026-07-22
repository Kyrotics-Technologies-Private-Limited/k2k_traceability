/** Zero-pad numeric IDs to 3 digits (e.g. product/batch/packet numbers). */
export function pad3(value: string | number | undefined): string {
  return String(value ?? "").trim().padStart(3, "0");
}
