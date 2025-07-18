"use client";

import React, { useState, useEffect } from "react";
import {
  fetchExistingPackets,
  updateRefractometerReport,
} from "../../../../../../firebase/firebaseUtil";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Packet {
  id: string;
  serialNo: string;
  refractometerReport: string;
  packetNo: string;
  productNo?: string;
  batchNo?: string;
}

interface Props {
  params: {
    productId: string;
    batchId: string;
  };
}

const AddRefractometerReport: React.FC<Props> = ({ params }) => {
  const [serialNumbers, setSerialNumbers] = useState<Packet[]>([]);
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
      (packet) =>
        packet.serialNo === `${packet.productNo}${packet.batchNo}${packetNo}`
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
      await updateRefractometerReport(
        productId,
        batchId,
        selectedPacket.serialNo,
        refractometerReport
      );
      // console.log('updated')
      toast.success("Refractometer report added successfully!");

      // Remove the updated packet from the list
      const remainingPackets = serialNumbers.filter(
        (packet) => packet.serialNo !== selectedPacket.serialNo
      );
      setSerialNumbers(remainingPackets);
      setPacketNo("");
      setRefractometerReport("");

      if (remainingPackets.length === 0) {
        router.push(`/admin/${productId}/${batchId}/batch_details`);
      }
    } catch (error) {
      console.log("error", error);
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
          onClick={() =>
            router.push(`/admin/${productId}/${batchId}/batch_details`)
          }
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

            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleAddReport}
            >
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
