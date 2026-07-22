export interface BatchData {
  id: string;
  limitQuantity?: number;
  quantity?: number;
  batchNo?: string;
  testReport?: string;
}

export interface PacketDetails {
  id: string;
  serialNo?: string;
  packetNo?: string;
  refractometerReport?: string;
}

export type SortKey = "no" | "serialNo" | null;
export type SortDirection = "asc" | "desc";
export type PacketFilterType = "all" | "missing" | "completed";
