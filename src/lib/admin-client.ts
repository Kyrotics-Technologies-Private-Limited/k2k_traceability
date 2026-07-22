"use client";

import type { User } from "firebase/auth";
import type { AdminBatch, AdminPacket, ProductCategory } from "@/lib/admin-data/types";

interface ApiError {
  error: string;
}

async function getAuthHeaders(user: User | null, json = true): Promise<HeadersInit> {
  if (!user) throw new Error("Admin authentication required");
  const token = await user.getIdToken();
  const headers: HeadersInit = { Authorization: `Bearer ${token}` };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as ApiError | T;
  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as ApiError).error)
        : "Request failed";
    throw new Error(message);
  }
  return data as T;
}

export async function adminFetchProducts(user: User | null): Promise<ProductCategory[]> {
  const response = await fetch("/api/admin/products", {
    headers: await getAuthHeaders(user),
    cache: "no-store",
  });
  const data = await parseResponse<{ ok: true; products: ProductCategory[] }>(response);
  return data.products;
}

export async function adminAddProduct(
  user: User | null,
  input: {
    productName: string;
    productDetails: string;
    description: string;
    productCategoryId?: string;
    productImage?: File | null;
  }
): Promise<{ id: string; productCategoryId: string; message?: string }> {
  const formData = new FormData();
  formData.set("productName", input.productName);
  formData.set("productDetails", input.productDetails);
  formData.set("description", input.description);
  if (input.productCategoryId) formData.set("productCategoryId", input.productCategoryId);
  if (input.productImage) formData.set("productImage", input.productImage);

  const response = await fetch("/api/admin/products", {
    method: "POST",
    headers: await getAuthHeaders(user, false),
    body: formData,
  });
  return parseResponse(response);
}

export async function adminDeleteProduct(
  user: User | null,
  productId: string
): Promise<{ ok: true; message?: string }> {
  const response = await fetch(`/api/admin/products/${productId}`, {
    method: "DELETE",
    headers: await getAuthHeaders(user),
  });
  return parseResponse(response);
}

export async function adminFetchProduct(
  user: User | null,
  productId: string
): Promise<ProductCategory> {
  const response = await fetch(`/api/admin/products/${productId}`, {
    headers: await getAuthHeaders(user),
    cache: "no-store",
  });
  const data = await parseResponse<{ ok: true; product: ProductCategory }>(response);
  return data.product;
}

export async function adminFetchBatches(
  user: User | null,
  productId: string
): Promise<AdminBatch[]> {
  const response = await fetch(`/api/admin/products/${productId}/batches`, {
    headers: await getAuthHeaders(user),
    cache: "no-store",
  });
  const data = await parseResponse<{ ok: true; batches: AdminBatch[] }>(response);
  return data.batches;
}

export async function adminCreateBatch(
  user: User | null,
  productId: string,
  input: { limitQuantity: number; testReport?: File | null }
): Promise<{ batchId: string; batchNo: string }> {
  const formData = new FormData();
  formData.set("limitQuantity", String(input.limitQuantity));
  if (input.testReport) formData.set("testReport", input.testReport);

  const response = await fetch(`/api/admin/products/${productId}/batches`, {
    method: "POST",
    headers: await getAuthHeaders(user, false),
    body: formData,
  });
  return parseResponse(response);
}

export async function adminFetchBatch(
  user: User | null,
  productId: string,
  batchId: string
): Promise<AdminBatch> {
  const response = await fetch(`/api/admin/products/${productId}/batches/${batchId}`, {
    headers: await getAuthHeaders(user),
    cache: "no-store",
  });
  const data = await parseResponse<{ ok: true; batch: AdminBatch }>(response);
  return data.batch;
}

export async function adminDeleteBatch(
  user: User | null,
  productId: string,
  batchId: string
): Promise<{ ok: true; message?: string }> {
  const response = await fetch(`/api/admin/products/${productId}/batches/${batchId}`, {
    method: "DELETE",
    headers: await getAuthHeaders(user),
  });
  return parseResponse(response);
}

export async function adminUploadTestReport(
  user: User | null,
  productId: string,
  batchId: string,
  testReport: File
): Promise<{ reportUrl: string }> {
  const formData = new FormData();
  formData.set("testReport", testReport);

  const response = await fetch(
    `/api/admin/products/${productId}/batches/${batchId}/test-report`,
    {
      method: "POST",
      headers: await getAuthHeaders(user, false),
      body: formData,
    }
  );
  const data = await parseResponse<{ ok: true; reportUrl: string }>(response);
  return { reportUrl: data.reportUrl };
}

export async function adminFetchPackets(
  user: User | null,
  productId: string,
  batchId: string
): Promise<AdminPacket[]> {
  const response = await fetch(`/api/admin/products/${productId}/batches/${batchId}/packets`, {
    headers: await getAuthHeaders(user),
    cache: "no-store",
  });
  const data = await parseResponse<{ ok: true; packets: AdminPacket[] }>(response);
  return data.packets;
}

export async function adminAddPacket(
  user: User | null,
  productId: string,
  batchId: string,
  refractometerReport: string
): Promise<{ packetId: string }> {
  const response = await fetch(`/api/admin/products/${productId}/batches/${batchId}/packets`, {
    method: "POST",
    headers: await getAuthHeaders(user),
    body: JSON.stringify({ refractometerReport }),
  });
  const data = await parseResponse<{ ok: true; packetId: string }>(response);
  return { packetId: data.packetId };
}

export async function adminGeneratePackets(
  user: User | null,
  productId: string,
  batchId: string,
  quantity: number
): Promise<{ packetIds: string[] }> {
  const response = await fetch(
    `/api/admin/products/${productId}/batches/${batchId}/packets/generate`,
    {
      method: "POST",
      headers: await getAuthHeaders(user),
      body: JSON.stringify({ quantity }),
    }
  );
  const data = await parseResponse<{ ok: true; packetIds: string[] }>(response);
  return { packetIds: data.packetIds };
}

export async function adminUpdateRefractometer(
  user: User | null,
  productId: string,
  batchId: string,
  packetId: string,
  refractometerReport: string
): Promise<void> {
  const response = await fetch(
    `/api/admin/products/${productId}/batches/${batchId}/packets/${packetId}`,
    {
      method: "PATCH",
      headers: await getAuthHeaders(user),
      body: JSON.stringify({ refractometerReport }),
    }
  );
  await parseResponse(response);
}
