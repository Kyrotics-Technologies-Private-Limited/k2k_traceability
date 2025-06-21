"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Package,
  List,
  ArrowUp,
  ArrowDown,
  FileText,
  Download,
  Beaker,
  FlaskConical,
  Layers
} from "lucide-react";
import {
  fetchBatchDetails,
  fetchPacketDetails,
  addPacketToBatch,
  generatePackets,
} from "../../../../../../firebase/firebaseUtil";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

interface Props {
  params: {
    batchId: string;
    productId: string;
  };
}

interface BatchDetails {
  id: string;
  limitQuantity?: number;
  quantity?: number;
  batchNo?: string;
  testReport?: string;
}

interface PacketDetails {
  id: string;
  serialNo?: string;
  refractometerReport?: string;
}

type SortKey = "no" | "serialNo" | null;
type SortDirection = "asc" | "desc";

const BatchDetails: React.FC<Props> = ({ params }) => {
  const [open, setOpen] = useState(false);
  const [openGeneratePacket, setOpenGeneratePacket] = useState(false);
  const [refractometerReport, setRefractometerReport] = useState("");
  const [packetQuantity, setPacketQuantity] = useState(0);
  const [batchDetails, setBatchDetails] = useState<BatchDetails | null>(null);
  const [packetDetails, setPacketDetails] = useState<PacketDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const router = useRouter();
  const { batchId, productId } = params;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const details = await fetchBatchDetails(productId, batchId);
        setBatchDetails(details);
        const packets = await fetchPacketDetails(productId, batchId);
        setPacketDetails(packets);
      } catch (error) {
        console.error("Error fetching batch or packet details:", error);
      }
    };
    fetchData();
  }, [productId, batchId]);

  const handleAddBottle = async () => {
    setIsLoading(true);
    try {
      await addPacketToBatch(productId, batchId, refractometerReport);
      const updatedPackets = await fetchPacketDetails(productId, batchId);
      setPacketDetails(updatedPackets);
      setRefractometerReport("");
      setOpen(false);
    } catch (error) {
      console.error("Error adding bottle:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePacket = async () => {
    try {
      await generatePackets(productId, batchId, packetQuantity);
      setOpenGeneratePacket(false);
    } catch (error) {
      console.error("Error generating packets:", error);
    }
  };

  const handleOpenReportInNewTab = () => {
    if (batchDetails?.testReport) {
      window.open(batchDetails.testReport, "_blank");
    }
  };

  const handleViewExistingPackets = () => {
    router.push(`/admin/${productId}/${batchId}/existing_packets`);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedPacketDetails = useMemo(() => {
    return [...packetDetails].sort((a, b) => {
      if (!sortKey) return 0;
      let aValue: any;
      let bValue: any;

      if (sortKey === "serialNo") {
        aValue = a.serialNo?.toLowerCase() || "";
        bValue = b.serialNo?.toLowerCase() || "";
      } else {
        return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [packetDetails, sortKey, sortDirection]);

  const handleExportToExcel = () => {
    const data = sortedPacketDetails.map((pkg, index) => ({
      No: index + 1,
      "Serial Number": pkg.serialNo || "",
      "Refractometer Report": pkg.refractometerReport || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Batch Details");
    const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Batch_${batchDetails?.batchNo || batchId}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[url('/grid.svg')] bg-fixed bg-green-50/90 dark:bg-green-950/90">
      <div className="absolute inset-0 bg-gradient-to-b from-green-50/90 to-green-100/90 dark:from-green-950/90 dark:to-green-900/90" />
      
      <div className="relative container mx-auto px-4 py-8 space-y-6">
        {/* Header Section */}
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <Layers className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                    Batch {batchDetails?.batchNo || "Loading..."}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400">
                    Manage batch details and packets
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleOpenReportInNewTab}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  View Report
                </Button>
                <Button
                  onClick={handleExportToExcel}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Batch Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Quantity</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                    {batchDetails?.quantity || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <Beaker className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Limit Quantity</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                    {batchDetails?.limitQuantity || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Packets Table */}
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0">
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      No
                    </th>
                    <th
                      className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                      onClick={() => handleSort("serialNo")}
                    >
                      <div className="flex items-center gap-2">
                        Serial Number
                        {sortKey === "serialNo" && (
                          sortDirection === "asc" ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Refractometer Report
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPacketDetails.map((packet, index) => (
                    <tr
                      key={packet.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {packet.serialNo || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {packet.refractometerReport || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-8 right-8 space-y-4">
          <Button
            onClick={() => setOpenGeneratePacket(true)}
            className="bg-green-600 hover:bg-green-700 text-white shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Generate Packets
          </Button>
          <Button
            onClick={handleViewExistingPackets}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center gap-2"
          >
            <List className="w-4 h-4" /> View Existing
          </Button>
        </div>

        {/* Add Bottle Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5" />
                Add New Bottle
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Refractometer Report
                </label>
                <Textarea
                  value={refractometerReport}
                  onChange={(e) => setRefractometerReport(e.target.value)}
                  className="border-gray-200 dark:border-gray-700"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddBottle}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? "Adding..." : "Add Bottle"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generate Packet Dialog */}
        <Dialog open={openGeneratePacket} onOpenChange={setOpenGeneratePacket}>
          <DialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Generate Packets
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Quantity
                </label>
                <Input
                  type="number"
                  value={packetQuantity}
                  onChange={(e) => setPacketQuantity(Number(e.target.value))}
                  className="border-gray-200 dark:border-gray-700"
                  placeholder="Enter quantity"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenGeneratePacket(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGeneratePacket}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Generate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BatchDetails;