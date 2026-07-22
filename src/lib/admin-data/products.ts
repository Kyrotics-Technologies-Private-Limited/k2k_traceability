import { randomUUID } from "crypto";
import { admin } from "@/lib/firebase-admin";
import { pad3 } from "@/lib/format";
import { uploadAdminFile } from "./storage";
import type { ProductCategory, ServiceResult } from "./types";

function db() {
  return admin.firestore();
}

export async function listProductCategories(): Promise<ProductCategory[]> {
  const snap = await db().collection("productCategory").get();
  const products = snap.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      productCategoryId: String(data.productCategoryId ?? ""),
      productName: String(data.productName ?? ""),
      productDetails: String(data.productDetails ?? ""),
      description: String(data.description ?? ""),
      productImage: String(data.productImage ?? ""),
      batchCount: typeof data.batchCount === "number" ? data.batchCount : 0,
    } satisfies ProductCategory;
  });

  products.sort((a, b) =>
    a.productCategoryId.localeCompare(b.productCategoryId, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );
  return products;
}

export async function getProductById(productId: string): Promise<ProductCategory | null> {
  const snap = await db().collection("productCategory").doc(productId).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  return {
    id: snap.id,
    productCategoryId: String(data.productCategoryId ?? ""),
    productName: String(data.productName ?? ""),
    productDetails: String(data.productDetails ?? ""),
    description: String(data.description ?? ""),
    productImage: String(data.productImage ?? ""),
    batchCount: typeof data.batchCount === "number" ? data.batchCount : 0,
  };
}

export async function addProduct(input: {
  productName: string;
  productDetails: string;
  description: string;
  productImage?: Buffer | null;
  productImageName?: string | null;
  productImageType?: string | null;
  customProductCategoryId?: string;
}): Promise<ServiceResult<{ id: string; productCategoryId: string }>> {
  try {
    const productCategoryRef = db().collection("productCategory");
    let newProductCategoryId = "";

    if (input.customProductCategoryId?.trim()) {
      newProductCategoryId = pad3(input.customProductCategoryId);
      const duplicate = await productCategoryRef
        .where("productCategoryId", "==", newProductCategoryId)
        .limit(1)
        .get();
      if (!duplicate.empty) {
        return {
          success: false,
          message: `Product Category ID "${newProductCategoryId}" is already assigned to another product.`,
        };
      }
    } else {
      const latest = await productCategoryRef.orderBy("productCategoryId", "desc").limit(1).get();
      newProductCategoryId = "001";
      if (!latest.empty) {
        const lastId = parseInt(String(latest.docs[0].data().productCategoryId), 10);
        newProductCategoryId = pad3(lastId + 1);
      }
    }

    let imageUrl = "";
    if (input.productImage) {
      const fileName = input.productImageName ?? "product-image";
      imageUrl = await uploadAdminFile(
        input.productImage,
        `products/${randomUUID()}-${fileName}`,
        input.productImageType ?? "application/octet-stream"
      );
    }

    const productData = {
      productCategoryId: newProductCategoryId,
      productName: input.productName,
      productDetails: input.productDetails,
      description: input.description,
      productImage: imageUrl,
    };

    const productRef = await productCategoryRef.add(productData);
    await db()
      .collection("products")
      .doc(productRef.id)
      .set({ ...productData, id: productRef.id });

    return {
      success: true,
      message: "Product added successfully",
      data: { id: productRef.id, productCategoryId: newProductCategoryId },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function deleteProduct(productId: string): Promise<ServiceResult> {
  try {
    const batchesSnap = await db()
      .collection("productCategory")
      .doc(productId)
      .collection("batches")
      .limit(1)
      .get();

    if (!batchesSnap.empty) {
      return {
        success: false,
        message:
          "This product has active batches. Please delete all batches first before deleting the product.",
      };
    }

    await db().collection("productCategory").doc(productId).delete();
    await db().collection("products").doc(productId).delete();

    return { success: true, message: "Product deleted successfully" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
