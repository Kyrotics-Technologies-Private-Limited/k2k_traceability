export interface PurityReportInfo {
  parameter: string;
  standardRange: string;
  rangeLabel: string;
  remarks: string;
}

export function getPurityReportDetails(productName?: string): PurityReportInfo {
  const name = productName?.toLowerCase() || "";
  if (name.includes("mustard")) {
    return {
      parameter: "Refractor meter test value",
      standardRange: "2.3 - 2.8",
      rangeLabel: "STANDARD RANGE (Pure Mustard Oil)",
      remarks: "Purity range: 2.3 - 2.8",
    };
  }
  if (name.includes("ghee")) {
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
