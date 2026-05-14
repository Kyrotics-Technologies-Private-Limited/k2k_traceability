// firebaseUtil.tsx
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  setDoc,
  doc,
  getDoc,
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";
import { v4 as uuidv4 } from "uuid";
import { app, db, storage } from "./firebaseConfig";

interface Packet {
  id: string;
  serialNo: string;
  refractometerReport: string;
  packetNo: string;
}

interface Batch {
  id: string;
  quantity: number;
  batchNo: string;
}

export interface ProductCategory {
  id: string;
  productCategoryId: string;
  productName: string;
  productDetails: string;
  description: string;
  productImage: string;
}

// Function to add a new product
export const addProduct = async (
  productName: string,
  productDetails: string,
  description: string,
  productImage: File | null
) => {
  try {
    console.log("add product called");
    // Step 1: Generate the next productCategoryId
    const productCategoryRef = collection(db, "productCategory");
    const productQuery = query(
      productCategoryRef,
      orderBy("productCategoryId", "desc")
    );
    const productSnapshot = await getDocs(productQuery);

    let newProductCategoryId = "001"; // Default for the first product

    if (!productSnapshot.empty) {
      const lastProduct = productSnapshot.docs[0].data();
      const lastProductCategoryId = parseInt(lastProduct.productCategoryId);
      newProductCategoryId = (lastProductCategoryId + 1)
        .toString()
        .padStart(3, "0");
    }

    // Step 2: Upload image to Firebase Storage
    let imageUrl = "";
    if (productImage) {
      const storageRef = ref(
        storage,
        `products/${uuidv4()}-${productImage.name}`
      );
      const snapshot = await uploadBytes(storageRef, productImage);
      imageUrl = await getDownloadURL(snapshot.ref); // Get the uploaded image's URL
    }

    // Step 3: Add product details to Firestore
    const productData = {
      productCategoryId: newProductCategoryId,
      productName,
      productDetails,
      description,
      productImage: imageUrl,
    };

    const product = await addDoc(productCategoryRef, productData);
    
    // Also store in the 'products' collection as requested
    await setDoc(doc(db, "products", product.id), {
      ...productData,
      id: product.id
    });

    console.log(product);

    return { 
      success: true, 
      message: "Product added successfully", 
      id: product.id, 
      productCategoryId: newProductCategoryId 
    };
  } catch (error) {
    console.error("Error adding product: ", error);
    if (error instanceof Error) {
      return { success: false, message: error.message }; // Handle error with a message
    }
    return { success: false, message: "An unknown error occurred" }; // Fallback for unknown errors
  }
};

// Function to update an existing product
export const updateProduct = async (
  productId: string,
  productName: string,
  productDetails: string,
  description: string,
  productImage: File | string | null
) => {
  try {
    let imageUrl = typeof productImage === 'string' ? productImage : "";

    // If a new image file is provided, upload it
    if (productImage instanceof File) {
      const storageRef = ref(
        storage,
        `products/${uuidv4()}-${productImage.name}`
      );
      const snapshot = await uploadBytes(storageRef, productImage);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    const updateData: any = {
      productName,
      productDetails,
      description,
      productImage: imageUrl,
    };

    // Update in productCategory collection
    const productRef = doc(db, "productCategory", productId);
    await updateDoc(productRef, updateData);

    // Also update in the 'products' collection for synchronization
    const globalProductRef = doc(db, "products", productId);
    await setDoc(globalProductRef, {
      ...updateData,
      id: productId
    }, { merge: true });

    return { success: true, message: "Product updated successfully" };
  } catch (error) {
    console.error("Error updating product: ", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "An unknown error occurred" 
    };
  }
};

// Function to fetch product categories
export const fetchProductCategories = async (): Promise<ProductCategory[]> => {
  try {
    const productCategoryRef = collection(db, "productCategory");
    const productSnapshot = await getDocs(productCategoryRef);

    const productCategories = productSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as ProductCategory));

    return productCategories;
  } catch (error) {
    console.error("Error fetching product categories: ", error);
    return [];
  }
};

export const fetchProductByProductId = async (productId: string): Promise<ProductCategory | null> => {
  try {
    // Reference to the specific product document by productId
    const productDocRef = doc(db, "productCategory", productId);

    // Fetch the product document
    const productSnapshot = await getDoc(productDocRef);

    if (!productSnapshot.exists()) {
      throw new Error("Product not found");
    }

    // Return the product data along with the document id
    return {
      id: productSnapshot.id,
      ...productSnapshot.data(),
    } as ProductCategory;
  } catch (error) {
    console.error("Error fetching product by product ID: ", error);
    return null;
  }
};

export const fetchBatchesByProductId = async (productId: string) => {
  try {
    // Reference to the batches subcollection for a specific product
    const batchesRef = collection(db, `productCategory/${productId}/batches`);

    // Fetch all documents from the batches subcollection
    const batchSnapshot = await getDocs(batchesRef);

    // Map over the batch documents and return their data
    const batches = batchSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return batches; // Return the array of batch objects
  } catch (error) {
    console.error("Error fetching batches for product ID: ", error);
    return [];
  }
};

export const addBatchToProduct = async (
  productId: string,
  limitQuantity: number,
  testReport: File | null
) => {
  try {
    const batchCollectionRef = collection(
      db,
      `productCategory/${productId}/batches`
    );
    const batchQuery = query(batchCollectionRef, orderBy("batchNo", "desc"));
    const batchSnapshot = await getDocs(batchQuery);

    // Initialize the first batch number
    let newBatchNo = "001";

    if (!batchSnapshot.empty) {
      const lastBatch = batchSnapshot.docs[0].data();
      const lastBatchNo = parseInt(lastBatch.batchNo);
      newBatchNo = (lastBatchNo + 1).toString().padStart(3, "0"); // Increment batch number and pad with leading zeros
    }

    let reportUrl = "";
    if (testReport) {
      const storageRef = ref(
        storage,
        `testReport/${uuidv4()}-${testReport.name}`
      );
      const snapshot = await uploadBytes(storageRef, testReport);
      reportUrl = await getDownloadURL(snapshot.ref); // Get the uploaded image's URL
    }

    // Add a new batch to the batches subcollection
    const batchRef = await addDoc(batchCollectionRef, {
      batchNo: newBatchNo, // Store the incremented batch number
      limitQuantity,
      testReport: reportUrl, // Add test report URL if provided
    });

    return batchRef.id; // Return the newly created batch ID
  } catch (error) {
    console.error("Error adding batch: ", error);
    if (error instanceof Error) {
      return { success: false, message: error.message }; // Handle the error with a message
    }
    return { success: false, message: "An unknown error occurred" }; // Fallback for unknown errors
  }
};

export const updateBatchTestReport = async (
  productId: string,
  batchId: string,
  testReport: File
) => {
  try {
    const batchDocRef = doc(db, `productCategory/${productId}/batches/${batchId}`);

    // Upload to Firebase Storage
    const storageRef = ref(storage, `testReport/${uuidv4()}-${testReport.name}`);
    const snapshot = await uploadBytes(storageRef, testReport);
    const reportUrl = await getDownloadURL(snapshot.ref);

    // Update the batch document
    await updateDoc(batchDocRef, {
      testReport: reportUrl,
    });

    return { success: true, reportUrl };
  } catch (error) {
    console.error("Error updating batch test report: ", error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unknown error occurred" };
  }
};

export const fetchBatchDetails = async (productId: string, batchId: string) => {
  try {
    // Reference to the specific batch document
    const batchDocRef = doc(
      db,
      `productCategory/${productId}/batches/${batchId}`
    );

    // Fetch the batch document
    const batchDoc = await getDoc(batchDocRef);

    // Check if the document exists and return the data
    if (batchDoc.exists()) {
      const batchData = {
        id: batchDoc.id,
        ...batchDoc.data(),
      };
      return batchData; // Return the batch data
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching batch details for product ID: ", error);
    return null;
  }
};

export const fetchPacketDetails = async (
  productId: string,
  batchId: string
) => {
  try {
    // Reference to the packets subcollection for a specific batch
    const packetsRef = collection(
      db,
      `productCategory/${productId}/batches/${batchId}/packets`
    );

    // Fetch all documents from the packets subcollection
    const packetSnapshot = await getDocs(packetsRef);

    // Fetch product data to fix potential undefined serial numbers
    const productCategoryRef = doc(collection(db, "productCategory"), productId);
    const productDoc = await getDoc(productCategoryRef);
    const productNo = productDoc.data()?.productCategoryId || "";

    // Map over the packet documents and return their data
    const packets = packetSnapshot.docs.map((doc) => {
      const data = doc.data();
      let serialNo = data.serialNo;
      if (serialNo?.startsWith("undefined")) {
        serialNo = serialNo.replace("undefined", productNo);
      }
      return {
        id: doc.id,
        ...data,
        serialNo,
      };
    });

    return packets; // Return the array of packet objects
  } catch (error) {
    console.error("Error fetching packets for product ID: ", error);
    return []; // Return an empty array on error
  }
};

export const addPacketToBatch = async (
  productId: string,
  batchId: string,
  refractometerReport: string
) => {
  try {
    //productNo
    const productCategoryRef = doc(
      collection(db, "productCategory"),
      productId
    );
    const productDoc = await getDoc(productCategoryRef);
    const productData = productDoc.data();
    const productNo = productData?.productCategoryId || "";

    //batchNo
    const batchCategoryRef = doc(
      collection(db, "productCategory", productId, "batches"),
      batchId
    );

    
    const batchDoc = await getDoc(batchCategoryRef);
    const batchData = batchDoc.data();
    const batchNo = batchData?.batchNo;
    
    if (!productNo || !batchNo) {
      throw new Error(`Missing product category ID (${productNo}) or batch number (${batchNo})`);
    }
    
    // Step 3: Get current quantity from batch
    let currentQuantity = batchData?.quantity || 0;
    
    const packetCollectionRef = collection(
      db,
      `productCategory/${productId}/batches/${batchId}/packets`
    );
    const packetQuery = query(
      packetCollectionRef,
      orderBy("packetNo", "desc")
    );
    const packetSnapshot = await getDocs(packetQuery);
    // Initialize the first packet number
    let newpacketNo = "001";

    if (!packetSnapshot.empty) {
      const lastpacket = packetSnapshot.docs[0].data();
      const lastpacketNo = parseInt(lastpacket.packetNo);
      newpacketNo = (lastpacketNo + 1).toString().padStart(3, "0");
      // console.log(newpacketNo)
    }

    // const quantity = parseInt(newpacketNo);
    // console.log("quantity", quantity);

    const serialNo = `${productNo}${batchNo}${newpacketNo}`; // Serial number format

    // Add the packet to the packet subcollection
    const packetRef = await addDoc(packetCollectionRef, {
      packetNo: newpacketNo,
      serialNo,
      refractometerReport,
    });
    // Add to serial numbers collection
    await setDoc(doc(db, "serialNumbers", serialNo), {
      productCategoryId: productId,
      batchId,
      packetId: packetRef.id, // Use packet reference ID
      serialNo, // Store the serial number globally
    });
    // }

    currentQuantity += 1; // Increment quantity by 1 for the new packet
    await updateDoc(batchCategoryRef, {
      quantity: currentQuantity, // Update batch with the new quantity
    });

    return packetRef.id; // Return the newly created packet ID
  } catch (error) {
    console.error("Error adding packet: ", error);
    if (error instanceof Error) {
      return { success: false, message: error.message }; // Handle the error with a message
    }
    return { success: false, message: "An unknown error occurred" }; // Fallback for unknown errors
  }
};


export const generatePackets = async (
  productId: string,
  batchId: string,
  quantity: number, 
) => {
  try {
    // Step 1: Fetch product data
    const productCategoryRef = doc(collection(db, "productCategory"), productId);
    const productDoc = await getDoc(productCategoryRef);
    const productData = productDoc.data();
    const productNo = productData?.productCategoryId || "";

    // Step 2: Fetch batch data
    const batchCategoryRef = doc(
      collection(db, "productCategory", productId, "batches"),
      batchId
    );
    const batchDoc = await getDoc(batchCategoryRef);
    const batchData = batchDoc.data();
    const batchNo = batchData?.batchNo;

    if (!productNo || !batchNo) {
      throw new Error(`Missing product category ID (${productNo}) or batch number (${batchNo})`);
    }

    // Step 3: Get current quantity from batch
    let currentQuantity = batchData?.quantity || 0;

    // Step 4: Get the latest packet number
    const packetCollectionRef = collection(
      db,
      `productCategory/${productId}/batches/${batchId}/packets`
    );
    const packetQuery = query(
      packetCollectionRef,
      orderBy("packetNo", "desc")
    );
    const packetSnapshot = await getDocs(packetQuery);

    let lastpacketNo = 0;
    if (!packetSnapshot.empty) {
      const lastpacket = packetSnapshot.docs[0].data();
      lastpacketNo = parseInt(lastpacket.packetNo);
    }

    // Step 5: Loop to generate the specified quantity of packets
    const generatedpackets: any[] = []; // Array to store generated packet references
    for (let i = 1; i <= quantity; i++) {
      const newpacketNo = (lastpacketNo + i).toString().padStart(3, "0"); // Generate new packet number
      const serialNo = `${productNo}${batchNo}${newpacketNo}`; // Generate serial number

      // Add the packet to the packet subcollection
      const packetRef = await addDoc(packetCollectionRef, {
        packetNo: newpacketNo,
        refractometerReport:"",
        serialNo,
      });

      // Add to serial numbers collection
      // await addDoc(collection(db, "serialNumbers"), {
      //   productCategoryId: productId,
      //   batchId,
      //   packetId: packetRef.id, // Use packet reference ID
      //   serialNo, // Store the serial number globally
      // });
      await setDoc(doc(db, "serialNumbers", serialNo), {
        productCategoryId: productId,
        batchId,
        packetId: packetRef.id, // Use packet reference ID
        serialNo, // Store the serial number globally
      });

      generatedpackets.push(packetRef.id); // Store the created packet ID
    }

    // Update batch quantity by adding the new packets
    currentQuantity += quantity;
    await updateDoc(batchCategoryRef, {
      quantity: currentQuantity, // Update batch with the new quantity
    });

    return generatedpackets; // Return the list of created packet IDs
  } catch (error) {
    console.error("Error generating packets: ", error);
    if (error instanceof Error) {
      return { success: false, message: error.message }; // Handle the error with a message
    }
    return { success: false, message: "An unknown error occurred" }; // Fallback for unknown errors
  }
};


// export const fetchExistingPackets = async (productId: string, batchId: string) => {
//   try {
//     // Reference to the collection
//     const packetsRef = collection(
//       db,
//       "productCategory",
//       productId,
//       "batches",
//       batchId,
//       "packets"
//     );

//     // Build a query to get packets where refractometerReport is empty
//     const q = query(packetsRef, where("refractometerReport", "==", ""));

//     // Execute the query
//     const snapshot = await getDocs(q);

//     // Map through the results and return packets
//     const packets = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     }));

//     return packets;
//   } catch (error) {
//     console.error("Error fetching existing packets:", error);
//     return [];
//   }
// };

export const fetchExistingPackets = async (
  productId: string,
  batchId: string
): Promise<Packet[]> => {
  try {
    // Reference to the collection
    const packetsRef = collection(
      db,
      "productCategory",
      productId,
      "batches",
      batchId,
      "packets"
    );

    // Step 1: Fetch product data
    const productCategoryRef = doc(collection(db, "productCategory"), productId);
    const productDoc = await getDoc(productCategoryRef);
    const productData = productDoc.data();
    const productNo = productData?.productCategoryId || "";

    // Step 2: Fetch batch data
    const batchCategoryRef = doc(
      collection(db, "productCategory", productId, "batches"),
      batchId
    );
    const batchDoc = await getDoc(batchCategoryRef);
    const batchData = batchDoc.data();
    const batchNo = batchData?.batchNo;


    // Query to get packets where refractometerReport is empty
    const q = query(packetsRef, where("refractometerReport", "==", ""));
    const snapshot = await getDocs(q);

    // Map through the results and return packets with the correct structure
    const packets: Packet[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      let serialNo = data.serialNo;
      if (serialNo?.startsWith("undefined")) {
        serialNo = serialNo.replace("undefined", productNo);
      }
      return {
        id: doc.id,
        serialNo,
        refractometerReport: data.refractometerReport,
        packetNo: data.packetNo,
        productNo,
        batchNo
      };
    });

    return packets;
  } catch (error) {
    console.error("Error fetching existing packets:", error);
    return [];
  }
};



export const addRefractometerReport = async (
  productId: string,
  batchId: string,
  packetId: string,
  refractometerReport: string
) => {
  try {
    const packetRef = doc(
      db,
      "productCategory",
      productId,
      "batches",
      batchId,
      "packets",
      packetId
    );

    // Update the refractometerReport field
    await updateDoc(packetRef, {
      refractometerReport: refractometerReport,
    });

    return { success: true, message: "Refractometer report added successfully." };
  } catch (error) {
    console.error("Error adding refractometer report:", error);
    // return { success: false, message: error.message };
  }
};


export const updateRefractometerReport = async (
  productId: string,
  batchId: string,
  serialNo: string,
  refractometerReport: string
) => {
  try {
    const packetsRef = collection(
      db,
      "productCategory",
      productId,
      "batches",
      batchId,
      "packets"
    );
    
    const q = query(packetsRef, where("serialNo", "==", serialNo));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const packetDoc = snapshot.docs[0];
      await updateDoc(packetDoc.ref, {
        refractometerReport,
      });
    } else {
      throw new Error("packet not found");
    }
  } catch (error) {
    console.error("Error updating refractometer report:", error);
    throw error;
  }
};

export const updateRefractometerReportById = async (
  productId: string,
  batchId: string,
  packetId: string,
  refractometerReport: string
) => {
  try {
    const packetRef = doc(
      db,
      `productCategory/${productId}/batches/${batchId}/packets/${packetId}`
    );
    
    const packetSnap = await getDoc(packetRef);
    if (!packetSnap.exists()) throw new Error("Packet not found");
    
    const packetData = packetSnap.data();
    let currentSerialNo = packetData.serialNo;
    let newSerialNo = currentSerialNo;

    // Repair serial number if it's broken
    if (!currentSerialNo || currentSerialNo.startsWith("undefined")) {
      const productSnap = await getDoc(doc(db, "productCategory", productId));
      const batchSnap = await getDoc(doc(db, "productCategory", productId, "batches", batchId));
      
      const productNo = productSnap.data()?.productCategoryId;
      const batchNo = batchSnap.data()?.batchNo;
      const packetNo = packetData.packetNo;

      if (productNo && batchNo && packetNo) {
        newSerialNo = `${productNo}${batchNo}${packetNo}`;
        console.log(`Repairing serial number: ${currentSerialNo} -> ${newSerialNo}`);
      }
    }

    // Update the packet document
    const updateData: any = { refractometerReport };
    if (newSerialNo !== currentSerialNo) {
      updateData.serialNo = newSerialNo;
    }
    
    await updateDoc(packetRef, updateData);

    // Synchronize with global serialNumbers collection
    if (newSerialNo) {
      await setDoc(doc(db, "serialNumbers", newSerialNo), {
        productCategoryId: productId,
        batchId,
        packetId,
        serialNo: newSerialNo,
      });

      // If we repaired it, delete the old broken entry if it existed
      if (currentSerialNo && currentSerialNo !== newSerialNo) {
        try {
          await deleteDoc(doc(db, "serialNumbers", currentSerialNo));
        } catch (e) {
          console.warn("Could not delete old serial number entry:", e);
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating refractometer report by ID:", error);
    throw error;
  }
};




// Function to fetch product, batch, and packet details by serial number
export const fetchCustomerDetailsBySerialNo = async (serialNo: string) => {
  try {
    // Query the serialNumbers collection
    const serialRef = collection(db, "serialNumbers");
    const serialSnapshot = await getDoc(doc(serialRef, serialNo));
    
    if (!serialSnapshot.exists()) {
      throw new Error("Serial number not found.");
    }

    const serialData = serialSnapshot.data();
    const { batchId, packetId, productCategoryId } = serialData;

    // Fetch product details
    const productCategoryRef = doc(collection(db, "productCategory"), productCategoryId);
    const productCategorySnapshot = await getDoc(productCategoryRef);
    const productData = productCategorySnapshot.data();

    // Fetch batch details
    const batchRef = doc(collection(productCategoryRef, "batches"), batchId);
    const batchSnapshot = await getDoc(batchRef);
    const batchData = batchSnapshot.data();

    // Fetch packet details
    const packetRef = doc(collection(batchRef, "packets"), packetId);
    const packetSnapshot = await getDoc(packetRef);
    const packetData = packetSnapshot.data();

    // Combine all the data and return
    return {
      product: {
        name: productData?.productName,
        details: productData?.productDetails,
        description: productData?.description,
        image: productData?.productImage,
      },
      batch: {
        batchNo: batchData?.batchNo,
        testReport: batchData?.testReport,
        quantity: batchData?.quantity,
      },
      packet: {
        packetNo: packetData?.packetNo,
        refractometerReport: packetData?.refractometerReport,
      }
    };
  } catch (error) {
    console.error("Error fetching customer details:", error);
    throw error;
  }
};



export const fetchCustomerDetails = async (serialNo: string) => {
  try {
    // 1. Direct Lookup
    let serialNumbersRef = doc(db, "serialNumbers", serialNo);
    let serialSnapshot = await getDoc(serialNumbersRef);

    // 2. Fallback for legacy "undefined" prefixed serial numbers
    if (!serialSnapshot.exists()) {
      console.log(`Serial ${serialNo} not found, trying fallback...`);
      const categories = await fetchProductCategories();
      
      for (const cat of categories) {
        if (cat.productCategoryId && serialNo.startsWith(cat.productCategoryId)) {
          const fallbackSerialNo = serialNo.replace(cat.productCategoryId, "undefined");
          console.log(`Checking fallback: ${fallbackSerialNo}`);
          const fallbackRef = doc(db, "serialNumbers", fallbackSerialNo);
          const fallbackSnapshot = await getDoc(fallbackRef);
          
          if (fallbackSnapshot.exists()) {
            serialSnapshot = fallbackSnapshot;
            console.log("Found legacy serial number!");
            break;
          }
        }
      }
    }

    if (!serialSnapshot.exists()) {
      return null;
    }

    const { productCategoryId, batchId, packetId } = serialSnapshot.data();

    // Fetch product details
    const productRef = doc(db, "productCategory", productCategoryId);
    const productSnapshot = await getDoc(productRef);
    const productData = productSnapshot.data();

    // Fetch batch details
    const batchRef = doc(db, "productCategory", productCategoryId, "batches", batchId);
    const batchSnapshot = await getDoc(batchRef);
    const batchData = batchSnapshot.data();

    // Fetch packet details
    const packetRef = doc(
      db,
      "productCategory",
      productCategoryId,
      "batches",
      batchId,
      "packets",
      packetId
    );
    const packetSnapshot = await getDoc(packetRef);
    const packetData = packetSnapshot.data();

    return {
      productName: productData?.productName,
      productDetails: productData?.productDetails,
      description: productData?.description,
      productImage: productData?.productImage,
      batchNo: batchData?.batchNo,
      testReport: batchData?.testReport,
      refractometerReport: packetData?.refractometerReport,
    };
  } catch (error) {
    console.error("Error fetching customer details:", error);
    return null;
  }
};

export const deleteBatch = async (productId: string, batchId: string) => {
  try {
    // 1. Get all packets for this batch
    const packetsRef = collection(db, `productCategory/${productId}/batches/${batchId}/packets`);
    const snapshot = await getDocs(packetsRef);
    
    // Safety check: Don't delete if any packet has a refractometer report
    const hasReports = snapshot.docs.some(doc => {
      const data = doc.data();
      return !!data.refractometerReport && data.refractometerReport !== "N/A" && data.refractometerReport !== "";
    });

    if (hasReports) {
      return { 
        success: false, 
        message: "This batch contains packets with refractometer reports and cannot be deleted for data integrity." 
      };
    }
    
    const batch = writeBatch(db);
    
    // 2. Delete each packet and its global serial number
    for (const packetDoc of snapshot.docs) {
      const packetData = packetDoc.data();
      const serialNo = packetData.serialNo;
      
      // Delete packet document
      batch.delete(packetDoc.ref);
      
      // Delete global serial number document if it exists
      if (serialNo) {
        batch.delete(doc(db, "serialNumbers", serialNo));
      }
    }
    
    // 3. Delete the batch document
    const batchRef = doc(db, `productCategory/${productId}/batches/${batchId}`);
    batch.delete(batchRef);
    
    // Commit the batch
    await batch.commit();
    
    return { success: true, message: "Batch deleted successfully" };
  } catch (error) {
    console.error("Error deleting batch: ", error);
    return { success: false, message: error instanceof Error ? error.message : "An unknown error occurred" };
  }
};