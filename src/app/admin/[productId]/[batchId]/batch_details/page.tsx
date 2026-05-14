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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
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
  Layers,
  ArrowLeft,
  Trash2,
  UploadCloud,
  RefreshCw,
} from "lucide-react";
import {
  fetchBatchDetails,
  fetchPacketDetails,
  addPacketToBatch,
  generatePackets,
  fetchProductByProductId,
  deleteBatch,
  updateRefractometerReportById,
  updateBatchTestReport,
  ProductCategory,
} from "../../../../../../firebase/firebaseUtil";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import Loader from "@/components/Loader";

interface Props {
  params: {
    batchId: string;
    productId: string;
  };
}

interface BatchData {
  id: string;
  limitQuantity?: number;
  quantity?: number;
  batchNo?: string;
  testReport?: string;
}

interface PacketDetails {
  id: string;
  serialNo?: string;
  packetNo?: string;
  refractometerReport?: string;
}

type SortKey = "no" | "serialNo" | null;
type SortDirection = "asc" | "desc";

const BatchDetails: React.FC<Props> = ({ params }) => {
  const [open, setOpen] = useState(false);
  const [openGeneratePacket, setOpenGeneratePacket] = useState(false);
  const [refractometerReport, setRefractometerReport] = useState("");
  const [packetQuantity, setPacketQuantity] = useState(0);
  const [batchDetails, setBatchDetails] = useState<BatchData | null>(null);
  const [productCategoryId, setProductCategoryId] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  const [productDescription, setProductDescription] = useState<string>("");
  const [packetDetails, setPacketDetails] = useState<PacketDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterType, setFilterType] = useState<"all" | "missing" | "completed">("all");
  const [openIndexModal, setOpenIndexModal] = useState(false);
  const [selectedPacketForIndex, setSelectedPacketForIndex] = useState<PacketDetails | null>(null);
  const [newIndexValue, setNewIndexValue] = useState("");
  const [isUpdatingIndex, setIsUpdatingIndex] = useState(false);
  const [showDeleteWarningDialog, setShowDeleteWarningDialog] = useState(false);
  const [openUploadReportDialog, setOpenUploadReportDialog] = useState(false);
  const [uploadReportFile, setUploadReportFile] = useState<File | null>(null);
  const [isUploadingReport, setIsUploadingReport] = useState(false);

  const router = useRouter();
  const { batchId, productId } = params;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);
        const details = await fetchBatchDetails(productId, batchId);
        setBatchDetails(details);
        const product = await fetchProductByProductId(productId);
        if (product) {
          setProductCategoryId(product.productCategoryId || "");
          setProductName(product.productName || "");
          setProductDescription(product.description || "");
        }
        const packets = await fetchPacketDetails(productId, batchId);
        setPacketDetails(packets);
      } catch (error) {
        console.error("Error fetching batch or packet details:", error);
      } finally {
        setDataLoading(false);
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
      setIsGenerating(true);
      await generatePackets(productId, batchId, packetQuantity);
      const updatedPackets = await fetchPacketDetails(productId, batchId);
      setPacketDetails(updatedPackets);
      setOpenGeneratePacket(false);
    } catch (error) {
      console.error("Error generating packets:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenReportInNewTab = () => {
    if (batchDetails?.testReport) {
      window.open(batchDetails.testReport, "_blank");
    }
  };

  const handleUploadReport = async () => {
    if (!uploadReportFile) return;
    setIsUploadingReport(true);
    try {
      const result = await updateBatchTestReport(productId, batchId, uploadReportFile);
      if (result && result.success && result.reportUrl) {
        setBatchDetails(prev => prev ? { ...prev, testReport: result.reportUrl } : prev);
        setOpenUploadReportDialog(false);
        setUploadReportFile(null);
        toast.success("Test report uploaded successfully!");
      } else {
        toast.error("Failed to upload report. Please try again.");
      }
    } catch (error) {
      console.error("Error uploading report:", error);
      toast.error("An error occurred while uploading.");
    } finally {
      setIsUploadingReport(false);
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

  const filteredAndSortedPackets = useMemo(() => {
    let result = [...packetDetails];
    
    if (filterType === "missing") {
      result = result.filter(p => !p.refractometerReport || p.refractometerReport === "N/A" || p.refractometerReport === "");
    } else if (filterType === "completed") {
      result = result.filter(p => !!p.refractometerReport && p.refractometerReport !== "N/A" && p.refractometerReport !== "");
    }

    return result.sort((a, b) => {
      // Default numeric sort by packetNo
      if (!sortKey) {
        const aNum = parseInt(a.packetNo || "0");
        const bNum = parseInt(b.packetNo || "0");
        return aNum - bNum;
      }

      let aValue: string;
      let bValue: string;

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
  }, [packetDetails, sortKey, sortDirection, filterType]);

  const handleExportToExcel = () => {
    const data = filteredAndSortedPackets.map((pkg, index) => ({
      No: index + 1,
      "Serial Number": pkg.serialNo?.startsWith("undefined")
        ? pkg.serialNo.replace("undefined", productCategoryId)
        : pkg.serialNo || "",
      "Refractometer Report": pkg.refractometerReport || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Batch Details");
    const excelBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    const dataBlob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Batch_${batchDetails?.batchNo || batchId}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleOpenIndexModal = (packet: PacketDetails) => {
    setSelectedPacketForIndex(packet);
    setNewIndexValue("");
    setOpenIndexModal(true);
  };

  const handleSaveIndex = async () => {
    if (!selectedPacketForIndex || !newIndexValue) return;
    
    try {
      setIsUpdatingIndex(true);
      
      await updateRefractometerReportById(
        productId, 
        batchId, 
        selectedPacketForIndex.id, 
        newIndexValue
      );
      
      toast.success("Refractometer index added successfully");
      
      // Update local state
      setPacketDetails(prev => prev.map(p => 
        p.id === selectedPacketForIndex.id 
          ? { ...p, refractometerReport: newIndexValue } 
          : p
      ));
      
      setOpenIndexModal(false);
    } catch (error) {
      console.error("Error saving index:", error);
      toast.error("Failed to save refractometer index");
    } finally {
      setIsUpdatingIndex(false);
    }
  };

  const handleDeleteBatch = () => {
    // Check if any packet has a refractometer report
    const hasReports = packetDetails.some(p => 
      !!p.refractometerReport && 
      p.refractometerReport !== "N/A" && 
      p.refractometerReport !== ""
    );
    
    if (hasReports) {
      setShowDeleteWarningDialog(true);
      return;
    }
    
    setOpenDeleteDialog(true);
  };

  const confirmDeleteBatch = async () => {
    try {
      setIsGenerating(true);
      const result = await deleteBatch(productId, batchId);
      if (result.success) {
        toast.success("Batch deleted successfully");
        setOpenDeleteDialog(false);
        router.push(`/admin/${productId}/create_batch`);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error deleting batch:", error);
      toast.error("An error occurred while deleting the batch");
    } finally {
      setIsGenerating(false);
    }
  };

  if (dataLoading || isGenerating || isLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-[url('/grid.svg')] bg-fixed bg-green-50/90 dark:bg-green-950/90">
      <div className="absolute inset-0 bg-gradient-to-b from-green-50/90 to-green-100/90 dark:from-green-950/90 dark:to-green-900/90" />

      <div className="relative container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <Link href={`/admin/${productId}/create_batch`}>
            <Button variant="ghost" className="text-gray-600 hover:text-green-600 p-0">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Batches
            </Button>
          </Link>
        </div>

        {/* Header Section */}
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <Layers className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 capitalize">
                    {productName} - Batch {batchDetails?.batchNo || "Loading..."}
                  </h1>
                  {/* {productDescription && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm italic line-clamp-2 max-w-2xl mb-1">
                      {productDescription}
                    </p>
                  )} */}
                  <p className="text-gray-500 dark:text-gray-400">
                    Manage batch details and packets
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                {batchDetails?.testReport ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleOpenReportInNewTab}
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      View Report
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setUploadReportFile(null); setOpenUploadReportDialog(true); }}
                      className="flex items-center gap-2 text-amber-600 border-amber-300 hover:bg-amber-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Replace Report
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => { setUploadReportFile(null); setOpenUploadReportDialog(true); }}
                    className="flex items-center gap-2 text-green-600 border-green-300 hover:bg-green-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Upload Report
                  </Button>
                )}
                <Button
                  onClick={handleExportToExcel}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Excel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteBatch}
                  className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Batch
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Quantity
                  </p>
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Limit Quantity
                  </p>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Packet Inventory</h2>
              <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                
                <div className="w-full sm:w-48">
                  <Select
                    value={filterType}
                    onValueChange={(value: "all" | "missing" | "completed") => setFilterType(value)}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-9 text-xs">
                      <SelectValue placeholder="Filter Packets" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Packets</SelectItem>
                      <SelectItem value="missing">Missing Reports</SelectItem>
                      <SelectItem value="completed">Reports Added</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => setOpenGeneratePacket(true)}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-sm flex items-center gap-2 h-9 text-xs"
                >
                  <Plus className="w-3 h-3" /> Generate Packets
                </Button>
              </div>
            </div>
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
                        {sortKey === "serialNo" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          ))}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Refractometer Report
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedPackets.map((packet, index) => (
                    <tr
                      key={packet.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {packet.serialNo?.startsWith("undefined")
                          ? packet.serialNo.replace("undefined", productCategoryId)
                          : packet.serialNo || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {packet.refractometerReport || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <Button
                          size="sm"
                          disabled={!!packet.refractometerReport && packet.refractometerReport !== "N/A" && packet.refractometerReport !== ""}
                          onClick={() => handleOpenIndexModal(packet)}
                          className={`text-xs font-medium h-8 px-4 transition-all ${
                            !!packet.refractometerReport && packet.refractometerReport !== "N/A" && packet.refractometerReport !== ""
                              ? "bg-gray-100 text-gray-400 border-gray-200"
                              : "bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md border-0"
                          }`}
                        >
                          Add Refractometer Index
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Removed Floating Action Buttons */}

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
              <Button
                variant="outline"
                onClick={() => setOpenGeneratePacket(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGeneratePacket}
                disabled={isGenerating}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Batch Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
          <DialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Confirm Batch Deletion
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">Batch {batchDetails?.batchNo}</span>?
              </p>
              <p className="text-sm text-red-500 mt-2 font-medium">
                This action will permanently remove all associated packets and serial numbers. This cannot be undone.
              </p>
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setOpenDeleteDialog(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteBatch}
                disabled={isGenerating}
                className="bg-red-600 hover:bg-red-700 text-white border-0"
              >
                {isGenerating ? "Deleting..." : "Delete Permanently"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Refractometer Index Modal */}
        <Dialog open={openIndexModal} onOpenChange={setOpenIndexModal}>
          <DialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Beaker className="w-5 h-5 text-green-600" />
                Add Refractometer Index
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Serial Number</p>
                <p className="font-mono font-medium text-gray-900 dark:text-gray-100">
                  {selectedPacketForIndex?.serialNo?.startsWith("undefined")
                    ? selectedPacketForIndex.serialNo.replace("undefined", productCategoryId)
                    : selectedPacketForIndex?.serialNo}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Refractometer Index Value
                </label>
                <Input
                  value={newIndexValue}
                  onChange={(e) => setNewIndexValue(e.target.value)}
                  placeholder="Enter index value (e.g. 1.345)"
                  className="border-gray-200 dark:border-gray-700"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setOpenIndexModal(false)}
                disabled={isUpdatingIndex}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveIndex}
                disabled={isUpdatingIndex || !newIndexValue}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isUpdatingIndex ? "Saving..." : "Confirm & Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Restriction Warning Dialog */}
        <Dialog open={showDeleteWarningDialog} onOpenChange={setShowDeleteWarningDialog}>
          <DialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <Trash2 className="w-5 h-5" />
                Deletion Restricted
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600 dark:text-gray-300">
                This batch <span className="font-bold text-gray-900 dark:text-white">cannot be deleted</span> because some packets already have refractometer reports added.
              </p>
              <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                To maintain data integrity and prevent accidental loss of reporting data, only empty batches or batches without any refractometer entries can be deleted.
              </p>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setShowDeleteWarningDialog(false)}
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              >
                Okay, I understand
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Upload / Replace Test Report Dialog */}
        <Dialog open={openUploadReportDialog} onOpenChange={setOpenUploadReportDialog}>
          <DialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <UploadCloud className="w-5 h-5" />
                {batchDetails?.testReport ? "Replace Test Report" : "Upload Test Report"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {batchDetails?.testReport
                  ? "A report is already uploaded. Selecting a new file will overwrite the existing one."
                  : "Select a PDF or image file for the lab test report for this batch."}
              </p>
              <label
                htmlFor="report-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-green-300 dark:border-green-700 rounded-lg cursor-pointer bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
              >
                <UploadCloud className="w-8 h-8 text-green-500 mb-2" />
                <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                  {uploadReportFile ? uploadReportFile.name : "Click to select file"}
                </span>
                <span className="text-xs text-gray-400 mt-1">PDF, PNG, JPG supported</span>
                <input
                  id="report-upload"
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && setUploadReportFile(e.target.files[0])}
                />
              </label>
            </div>
            <DialogFooter>
              <Button
                onClick={handleUploadReport}
                disabled={!uploadReportFile || isUploadingReport}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isUploadingReport ? "Uploading..." : "Upload"}
              </Button>
              <Button variant="outline" onClick={() => setOpenUploadReportDialog(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BatchDetails;
