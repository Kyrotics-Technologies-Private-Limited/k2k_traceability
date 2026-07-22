export interface ProductCategory {
  id: string;
  productCategoryId: string;
  productName: string;
  productDetails: string;
  description: string;
  productImage: string;
  batchCount?: number;
}

export interface AdminBatch {
  id: string;
  batchNo?: string;
  quantity?: number;
  limitQuantity?: number;
  testReport?: string;
}

export interface AdminPacket {
  id: string;
  serialNo?: string;
  packetNo?: string;
  refractometerReport?: string;
}

export type ServiceResult<T = void> =
  | { success: true; message?: string; data?: T }
  | { success: false; message: string };
