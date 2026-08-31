import * as XLSX from "xlsx";
import type {
  PacketDetails,
  PacketFilterType,
  SortDirection,
  SortKey,
} from "./types";

export function formatBottleNo(bottleNo: string | undefined, productCategoryId: string): string {
  if (!bottleNo) return "N/A";
  if (bottleNo.startsWith("undefined-")) {
    return bottleNo.replace("undefined-", `${productCategoryId}-`);
  }
  if (bottleNo.startsWith("undefined")) {
    return bottleNo.replace("undefined", productCategoryId);
  }
  return bottleNo;
}

export function hasRefractometerReport(value: string | undefined): boolean {
  return !!value && value !== "N/A" && value !== "";
}

export function filterAndSortPackets(
  packets: PacketDetails[],
  options: {
    filterType: PacketFilterType;
    searchQuery: string;
    productCategoryId: string;
    sortKey: SortKey;
    sortDirection: SortDirection;
  }
): PacketDetails[] {
  let result = [...packets];

  if (options.filterType === "missing") {
    result = result.filter((p) => !hasRefractometerReport(p.refractometerReport));
  } else if (options.filterType === "completed") {
    result = result.filter((p) => hasRefractometerReport(p.refractometerReport));
  }

  if (options.searchQuery.trim() !== "") {
    const q = options.searchQuery.toLowerCase().trim();
    result = result.filter((p) => {
      const bottle = (p.bottleNo || p.serialNo || "").toLowerCase();
      const packetNo = (p.packetNo || "").toLowerCase();
      const bottlePadded = bottle.startsWith("undefined-")
        ? bottle.replace("undefined-", `${options.productCategoryId.toLowerCase()}-`)
        : bottle.startsWith("undefined")
        ? bottle.replace("undefined", options.productCategoryId.toLowerCase())
        : bottle;
      return bottlePadded.includes(q) || packetNo.includes(q);
    });
  }

  return result.sort((a, b) => {
    if (!options.sortKey) {
      const aNum = parseInt(a.packetNo || "0", 10);
      const bNum = parseInt(b.packetNo || "0", 10);
      return aNum - bNum;
    }

    if (options.sortKey === "bottleNo") {
      const aValue = (a.bottleNo || a.serialNo || "").toLowerCase();
      const bValue = (b.bottleNo || b.serialNo || "").toLowerCase();
      if (aValue < bValue) return options.sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return options.sortDirection === "asc" ? 1 : -1;
    }

    return 0;
  });
}

export function exportPacketsToExcel(
  packets: PacketDetails[],
  productCategoryId: string,
  batchLabel: string
): void {
  const data = packets.map((pkg, index) => ({
    No: index + 1,
    "Batch No": batchLabel,
    "Bottle Number": formatBottleNo(pkg.bottleNo || pkg.serialNo, productCategoryId),
    "Refractometer Report": pkg.refractometerReport || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Batch Details");
  const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
  const url = window.URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Batch_${batchLabel}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}
