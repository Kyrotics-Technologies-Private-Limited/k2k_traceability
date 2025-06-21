// "use client";

// import React, { useState, useEffect } from "react";
// import { fetchExistingPackets, updateRefractometerReport } from "../../../../../../firebase/firebaseUtil"; // Import your Firebase functions
// import { Button } from "@/components/ui/button";
// import { useRouter } from "next/navigation";

// interface Packet {
//   id: string;
//   serialNo: string;
//   refractometerReport: string;
//   productNo: string;
//   batchNo: string;
//   packetNo: string;
// }

// interface Batch {
//   id: string;
//   quantity: number;
//   batchNo: string;
// }

// interface Props {
//   params: {
//     productId: string;
//     batchId: string;
//   };
// }
// const AddRefractometerReport: React.FC<Props> = ({ params }) => {
//   const [serialNumbers, setSerialNumbers] = useState<any[]>([]);
//   const [selectedSerialNo, setSelectedSerialNo] = useState("");
//   const [refractometerReport, setRefractometerReport] = useState("");
//   const router = useRouter();
//   const [packetNo, setPacketNo] = useState("");
//   const [productNumber, setProductNumber] = useState("");
//   const [batchNumber, setBatchNumber] = useState("");
//   const { productId, batchId } = params;

//   useEffect(() => {
//     const fetchSerialNumbers = async () => {
//       try {
//         const packets = await fetchExistingPackets(productId, batchId);
//         if (packets.length > 0) {
//           setSerialNumbers(packets);
//           setProductN(packets[0].productNo);
//           setBatchNo(packets[0].batchNo);
//           setSelectedSerialNo(packets[0].serialNo);
//         }
//       } catch (error) {
//         console.error("Error fetching serial numbers:", error);
//       }
//     };
//     fetchSerialNumbers();
//   }, [productId, batchId]);

//   const handleAddReport = async () => {
//     if (!selectedSerialNo || !refractometerReport) {
//       alert("Please select a serial number and enter the refractometer report.");
//       return;
//     }

//     try {
//       await updateRefractometerReport(productId, batchId, selectedSerialNo, refractometerReport);
//       setRefractometerReport("");
//       const remainingSerials = serialNumbers.filter(serial => serial.serialNo !== selectedSerialNo);
//       setSerialNumbers(remainingSerials);
//       if (remainingSerials.length > 0) {
//         setSelectedSerialNo(remainingSerials[0].serialNo);
//       } else {
//         alert("All reports added!");
//         router.push(`/admin/${productId}/${batchId}/batch_details`);
//       }
//     } catch (error) {
//       console.error("Error adding refractometer report:", error);
//     }
//   };

//   return (
//     <div className="min-h-screen p-8 bg-gray-100">
//       <div className="mb-6">
//         <h1 className="text-3xl font-bold text-center text-gray-800">
//           Add Refractometer Report
//         </h1>
//       </div>

//       <div className="bg-white p-6 rounded shadow-md">
//         {serialNumbers.length > 0 ? (
//           <>
//             <div className="mb-4">
//               <label className="block mb-2">Serial Number</label>
//               <select
//                 className="w-full p-2 border rounded"
//                 value={selectedSerialNo}
//                 onChange={(e) => setSelectedSerialNo(e.target.value)}
//               >
//                 {serialNumbers.map((packet) => (
//                   <option key={packet.id} value={packet.serialNo}>
//                     {packet.serialNo}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="mb-4">
//               <label className="block mb-2">Refractometer Report</label>
//               <input
//                 type="text"
//                 className="w-full p-2 border rounded"
//                 value={refractometerReport}
//                 onChange={(e) => setRefractometerReport(e.target.value)}
//                 placeholder="Enter refractometer report"
//               />
//             </div>

//             <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleAddReport}>
//               Add Report
//             </Button>
//           </>
//         ) : (
//           <p>No packets available without refractometer report</p>
//         )}
//       </div>
//     </div>
//   );
// };


// export default AddRefractometerReport;



// "use client";

// import React, { useState, useEffect } from "react";
// import { fetchExistingPackets, updateRefractometerReport } from "../../../../../../firebase/firebaseUtil"; // Firebase functions
// import { Button } from "@/components/ui/button";
// import { useRouter } from "next/navigation";
// import { toast } from "react-toastify"; // Use toast for notifications
// import "react-toastify/dist/ReactToastify.css"; // Toast styles

// interface Packet {
//   id: string;
//   serialNo: string;
//   refractometerReport: string;
//   packetNo: string;
//   productNo: string;
//   batchNo: string;
// }

// interface Props {
//   params: {
//     productId: string;
//     batchId: string;
//   };
// }

// const AddRefractometerReport: React.FC<Props> = ({ params }) => {
//   const [serialNumbers, setSerialNumbers] = useState<any[]>([]);
//   const [selectedSerialNo, setSelectedSerialNo] = useState("");
//   const [packetNo, setPacketNo] = useState("");
//   const [refractometerReport, setRefractometerReport] = useState("");
// const [productNumber, setProductNumber] = useState("");
//   const [batchNumber, setBatchNumber] = useState("");
//   const [isLoading, setIsLoading] = useState(true); // Loading state
//   const [isSubmitting, setIsSubmitting] = useState(false); // Submitting state
//   const router = useRouter();
//   const { productId, batchId } = params;

//   // Fetch existing packets that don't have a refractometer report
//   useEffect(() => {
//     const fetchSerialNumbers = async () => {
//       try {
//         const packets = await fetchExistingPackets(productId, batchId);
//         setSerialNumbers(packets);
//         if (packets.length > 0) {
//           setSelectedSerialNo(packets[0].serialNo); // Set first serial number by default
//         }
//       } catch (error) {
//         toast.error("Error fetching serial numbers.");
//         console.error("Error fetching serial numbers:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchSerialNumbers();
//   }, [productId, batchId]);

//   // Handle adding refractometer report
//   const handleAddReport = async () => {
//     const selectedPacket = serialNumbers.find(packet => packet.serialNo === selectedSerialNo);

//     if (!selectedSerialNo || !packetNo || !refractometerReport || !selectedPacket) {
//       toast.warn("Please fill all fields.");
//       return;
//     }

//     // Concatenate productNo + batchNo + packetNo to check serialNo
//     const generatedSerialNo = `${selectedPacket.productNo}${selectedPacket.batchNo}${packetNo}`;

//     if (generatedSerialNo !== selectedSerialNo) {
//       toast.error("Packet number does not match the serial number.");
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       await updateRefractometerReport(productId, batchId, selectedSerialNo, refractometerReport);
//       // console.log("updated")
//       toast.success("Refractometer report added successfully!");

//       // Reset the form
//       setRefractometerReport("");
//       setPacketNo("");

//       // Remove the updated serial number from the list
//       const remainingSerials = serialNumbers.filter((serial) => serial.serialNo !== selectedSerialNo);
//       setSerialNumbers(remainingSerials);

//       if (remainingSerials.length > 0) {
//         setSelectedSerialNo(remainingSerials[0].serialNo);
//       } else {
//         toast.info("All reports added!");
//         router.push(`/admin/${productId}/${batchId}/batch_details`);
//       }
//     } catch (error) {
//       toast.error("Error adding refractometer report.");
//       console.error("Error adding refractometer report:", error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen p-8 bg-gray-100">
//       <div className="mb-6">
//         <h1 className="text-3xl font-bold text-center text-gray-800">
//           Add Refractometer Report
//         </h1>
//         <Button
//           className="bg-blue-600 text-white hover:bg-blue-700"
//           onClick={() => router.push(`/admin/${productId}/${batchId}/batch_details`)}
//         >
//           Back to Batch Details
//         </Button>
//       </div>


//       <div className="bg-white p-6 rounded shadow-md max-w-lg mx-auto">
//         {isLoading ? (
//           <p className="text-center text-gray-500">Loading packets...</p>
//         ) : serialNumbers.length > 0 ? (
//           <>
//             {/* Displaying product and batch number */}
//             <div className="mb-4">
//               <label className="block mb-2 font-semibold text-gray-700">Product No</label>
//               <p className="text-gray-600">{serialNumbers[0]?.productNo}</p>
//             </div>
//             <div className="mb-4">
//               <label className="block mb-2 font-semibold text-gray-700">Batch No</label>
//               <p className="text-gray-600">{serialNumbers[0]?.batchNo}</p>
//             </div>

//             {/* Packet Number Input */}
//             <div className="mb-4">
//               <label className="block mb-2 font-semibold text-gray-700">Packet No</label>
//               <input
//                 type="text"
//                 className="w-full p-2 border rounded bg-gray-50 focus:outline-none focus:ring focus:border-blue-300"
//                 value={packetNo}
//                 onChange={(e) => setPacketNo(e.target.value)}
//                 placeholder="Enter packet number"
//               />
//             </div>

//             {/* Serial Number Select */}
//             <div className="mb-4">
//               <label className="block mb-2 font-semibold text-gray-700">Serial Number</label>
//               <select
//                 className="w-full p-2 border rounded bg-gray-50 focus:outline-none focus:ring focus:border-blue-300"
//                 value={selectedSerialNo}
//                 onChange={(e) => setSelectedSerialNo(e.target.value)}
//               >
//                 {serialNumbers.map((packet) => (
//                   <option key={packet.id} value={packet.serialNo}>
//                     {packet.serialNo}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Refractometer Report Input */}
//             <div className="mb-4">
//               <label className="block mb-2 font-semibold text-gray-700">Refractometer Report</label>
//               <input
//                 type="text"
//                 className="w-full p-2 border rounded bg-gray-50 focus:outline-none focus:ring focus:border-blue-300"
//                 value={refractometerReport}
//                 onChange={(e) => setRefractometerReport(e.target.value)}
//                 placeholder="Enter refractometer report"
//               />
//             </div>

//             {/* Submit Button */}
//             <Button
//               className="bg-blue-600 text-white hover:bg-blue-700 w-full py-2"
//               onClick={handleAddReport}
//               disabled={isSubmitting}
//             >
//               {isSubmitting ? "Submitting..." : "Add Report"}
//             </Button>
//           </>
//         ) : (
//           <p className="text-center text-gray-500">No packets available without refractometer report</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AddRefractometerReport;




"use client";

import React, { useState, useEffect } from "react";
import { fetchExistingPackets, updateRefractometerReport } from "../../../../../../firebase/firebaseUtil";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Packet {
  id: string;
  serialNo: string;
  refractometerReport: string;
  packetNo: string;
  productNo: string;
  batchNo: string;
}

interface Props {
  params: {
    productId: string;
    batchId: string;
  };
}

const AddRefractometerReport: React.FC<Props> = ({ params }) => {
  const [serialNumbers, setSerialNumbers] = useState<any[]>([]);
  const [packetNo, setPacketNo] = useState("");
  const [refractometerReport, setRefractometerReport] = useState("");
  const router = useRouter();
  const { productId, batchId } = params;

  useEffect(() => {
    const fetchSerialNumbers = async () => {
      try {
        const packets = await fetchExistingPackets(productId, batchId);
        setSerialNumbers(packets);
      } catch (error) {
        console.error("Error fetching serial numbers:", error);
      }
    };
    fetchSerialNumbers();
  }, [productId, batchId]);

  const handleAddReport = async () => {
    if (!packetNo || !refractometerReport) {
      toast.error("Please enter the packet number and refractometer report.");
      return;
    }

    // Find the packet based on the serial number format
    const selectedPacket = serialNumbers.find(
      (packet) => packet.serialNo === `${packet.productNo}${packet.batchNo}${packetNo}`
    );

    if (!selectedPacket) {
      // console.log('Invalid packet number. Serial number does not exist.')
      
      toast.error("Invalid packet number or already exists ");
      return;
    }

    if (selectedPacket.refractometerReport) {
      // console.log('Refractometer report already exists for this packet.')

      toast.error("Refractometer report already exists for this packet.");
      return;
    }

    try {
      // Proceed with adding the refractometer report
      await updateRefractometerReport(productId, batchId, selectedPacket.serialNo, refractometerReport);
      // console.log('updated')
      toast.success("Refractometer report added successfully!");

      // Remove the updated packet from the list
      const remainingPackets = serialNumbers.filter(packet => packet.serialNo !== selectedPacket.serialNo);
      setSerialNumbers(remainingPackets);
      setPacketNo("");
      setRefractometerReport("");

      if (remainingPackets.length === 0) {
        router.push(`/admin/${productId}/${batchId}/batch_details`);
      }
    } catch (error) {
      console.log('error',error)
      console.error("Error adding refractometer report:", error);
      toast.error("Error adding refractometer report. Please try again.");
    }
  };

  return (
    <div className="min-h-screen max-w-7xl mx-auto pt-10 p-8 bg-gray-100">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Add Refractometer Report
        </h1>
        <Button
          className="bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => router.push(`/admin/${productId}/${batchId}/batch_details`)}
        >
          Back to Batch Details
        </Button>
      </div>

      <div className="bg-white p-6 rounded shadow-md">
        {serialNumbers.length > 0 ? (
          <>
            {/* <div className="mb-4">
              <label className="block mb-2">Product Number</label>
              <input
                type="text"
                className="w-full p-2 border rounded bg-gray-100"
                value={serialNumbers[0].productNo}
                readOnly
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2">Batch Number</label>
              <input
                type="text"
                className="w-full p-2 border rounded bg-gray-100"
                value={serialNumbers[0].batchNo}
                readOnly
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2">Packet Number</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={packetNo}
                onChange={(e) => setPacketNo(e.target.value)}
                placeholder="Enter packet number"
              />
            </div> */}

<div className="mb-4">
  <label className="block mb-2">Serial Number</label>
  <div className="flex space-x-2">
    {/* Product Number (Read-only) */}
    <input
      type="text"
      className="w-1/3 p-2 border rounded bg-gray-100"
      value={serialNumbers[0].productNo}
      readOnly
    />
    
    {/* Batch Number (Read-only) */}
    <input
      type="text"
      className="w-1/3 p-2 border rounded bg-gray-100"
      value={serialNumbers[0].batchNo}
      readOnly
    />
    
    {/* Packet Number (Editable) */}
    <input
      type="text"
      className="w-1/3 p-2 border rounded"
      value={packetNo}
      onChange={(e) => setPacketNo(e.target.value)}
      placeholder="Enter last digits"
    />
  </div>
</div>


            <div className="mb-4">
              <label className="block mb-2">Refractometer Report</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={refractometerReport}
                onChange={(e) => setRefractometerReport(e.target.value)}
                placeholder="Enter refractometer report"
              />
            </div>

            <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleAddReport}>
              Add Report
            </Button>
          </>
        ) : (
          <p>No packets available without refractometer report</p>
        )}
      </div>
    </div>
  );
};

export default AddRefractometerReport;
