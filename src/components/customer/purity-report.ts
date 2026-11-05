export interface PurityReportInfo {
  parameter: string;
  standardRange: string;
  rangeLabel: string;
  remarks: string;
}

export function isRefractometerReportNA(value: string | undefined | null): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  const upper = trimmed.toUpperCase();
  return (
    upper === "N/A" ||
    upper === "NA" ||
    upper === "NONE" ||
    upper === "NULL" ||
    upper === "UNDEFINED" ||
    upper === "-"
  );
}

export function getCustomerRefractometerValue(options: {
  refractometerReport?: string | null;
  bottleNo?: string | null;
  productName?: string | null;
}): string {
  const { refractometerReport, bottleNo, productName } = options;

  if (!isRefractometerReportNA(refractometerReport)) {
    return refractometerReport!.trim();
  }

  const cleanBottle = (bottleNo || "").trim();
  const lowerName = (productName || "").toLowerCase();

  // For Ghee: bottle number starts with 001 (or product name includes ghee) -> 41.3
  if (
    cleanBottle.startsWith("001") ||
    cleanBottle.startsWith("1-") ||
    cleanBottle === "1" ||
    lowerName.includes("ghee")
  ) {
    return "41.3";
  }

  // For Mustard Oil: bottle number starts with 002 (or product name includes mustard) -> 59.2
  if (
    cleanBottle.startsWith("002") ||
    cleanBottle.startsWith("2-") ||
    cleanBottle === "2" ||
    lowerName.includes("mustard") ||
    lowerName.includes("musturd")
  ) {
    return "59.2";
  }

  if (lowerName.includes("honey")) {
    return "18.5";
  }

  return "2.8";
}

export function getPurityReportDetails(productName?: string, bottleNo?: string): PurityReportInfo {
  const name = productName?.toLowerCase() || "";
  const bottle = bottleNo?.trim() || "";

  if (
    bottle.startsWith("002") ||
    bottle.startsWith("2-") ||
    bottle === "2" ||
    name.includes("mustard") ||
    name.includes("musturd")
  ) {
    return {
      parameter: "Butyro-refractometer (BR) value at 40°C",
      standardRange: "58.0 - 60.5",
      rangeLabel: "STANDARD RANGE (Pure Mustard Oil)",
      remarks: "Purity range: 58.0 - 60.5",
    };
  }
  if (
    bottle.startsWith("001") ||
    bottle.startsWith("1-") ||
    bottle === "1" ||
    name.includes("ghee")
  ) {
    return {
      parameter: "Butyro-refractometer (BR) value at 40°C",
      standardRange: "40.0 - 45.0",
      rangeLabel: "STANDARD RANGE (Pure Cow Ghee)",
      remarks: "Purity range: 40.0 - 45.0",
    };
  }
  if (name.includes("honey")) {
    return {
      parameter: "Moisture content (%)",
      standardRange: "17.0 - 20.0",
      rangeLabel: "STANDARD RANGE (Pure Honey)",
      remarks: "Purity range: 17.0 - 20.0",
    };
  }
  return {
    parameter: "Refractor meter test value",
    standardRange: "2.3 - 2.8",
    rangeLabel: productName ? `STANDARD RANGE (Pure ${productName})` : "STANDARD RANGE",
    remarks: "Purity range: 2.3 - 2.8",
  };
}
