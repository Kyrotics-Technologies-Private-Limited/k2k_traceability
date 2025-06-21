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
  setDoc
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";
import { v4 as uuidv4 } from "uuid";
import { app, db, storage } from "./firebaseConfig";

import { doc, getDoc } from "firebase/firestore";

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

// Function to add a new product
export const addProduct = async (
  productName: string,
  productDetails: string,
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
    const product = await addDoc(productCategoryRef, {
      productCategoryId: newProductCategoryId,
      productName,
      productDetails,
      productImage: imageUrl,
    });
    console.log(product);

    return { success: true, message: "Product added successfully" };
  } catch (error) {
    console.error("Error adding product: ", error);
    if (error instanceof Error) {
      return { success: false, message: error.message }; // Handle error with a message
    }
    return { success: false, message: "An unknown error occurred" }; // Fallback for unknown errors
  }
};

// Function to fetch product categories
export const fetchProductCategories = async () => {
  try {
    const productCategoryRef = collection(db, "productCategory");
    const productSnapshot = await getDocs(productCategoryRef);

    const productCategories = productSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return productCategories;
  } catch (error) {
    console.error("Error fetching product categories: ", error);
    return [];
  }
};

export const fetchProductByProductId = async (productId: string) => {
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
    };
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

    // Map over the packet documents and return their data
    const packets = packetSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

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
    const productNo = productData?.productCategoryId;

    //batchNo
    const batchCategoryRef = doc(
      collection(db, "productCategory", productId, "batches"),
      batchId
    );

    
    const batchDoc = await getDoc(batchCategoryRef);
    const batchData = batchDoc.data();
    const batchNo = batchData?.batchNo;
    
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
    const productNo = productData?.productCategoryId;

    // Step 2: Fetch batch data
    const batchCategoryRef = doc(
      collection(db, "productCategory", productId, "batches"),
      batchId
    );
    const batchDoc = await getDoc(batchCategoryRef);
    const batchData = batchDoc.data();
    const batchNo = batchData?.batchNo;

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
    const productNo = productData?.productCategoryId;

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
    const packets: Packet[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      serialNo: doc.data().serialNo,
      refractometerReport: doc.data().refractometerReport,
      packetNo: doc.data().packetNo,
      productNo,
      batchNo
    }));

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
      "products",
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
    // Query the "serialNumbers" collection to find the packet with the serial number
    const serialNumbersRef = doc(db, "serialNumbers", serialNo);
    const serialSnapshot = await getDoc(serialNumbersRef);

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