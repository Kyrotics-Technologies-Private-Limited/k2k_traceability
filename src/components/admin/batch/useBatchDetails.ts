"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import toast from "react-hot-toast";
import {
  adminDeleteBatch,
  adminFetchBatch,
  adminFetchPackets,
  adminFetchProduct,
  adminGeneratePackets,
  adminUpdateRefractometer,
  adminUploadTestReport,
} from "@/lib/admin-client";
import {
  exportPacketsToExcel,
  filterAndSortPackets,
  hasRefractometerReport,
} from "./packet-utils";
import type {
  BatchData,
  PacketDetails,
  PacketFilterType,
  SortDirection,
  SortKey,
} from "./types";

interface UseBatchDetailsOptions {
  user: User | null;
  productId: string;
  batchId: string;
}

export function useBatchDetails({ user, productId, batchId }: UseBatchDetailsOptions) {
  const router = useRouter();

  const [openGeneratePacket, setOpenGeneratePacket] = useState(false);
  const [packetQuantity, setPacketQuantity] = useState(0);
  const [batchDetails, setBatchDetails] = useState<BatchData | null>(null);
  const [productCategoryId, setProductCategoryId] = useState("");
  const [productName, setProductName] = useState("");
  const [packetDetails, setPacketDetails] = useState<PacketDetails[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterType, setFilterType] = useState<PacketFilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIndexModal, setOpenIndexModal] = useState(false);
  const [selectedPacketForIndex, setSelectedPacketForIndex] = useState<PacketDetails | null>(null);
  const [newIndexValue, setNewIndexValue] = useState("");
  const [isUpdatingIndex, setIsUpdatingIndex] = useState(false);
  const [openUploadReportDialog, setOpenUploadReportDialog] = useState(false);
  const [uploadReportFile, setUploadReportFile] = useState<File | null>(null);
  const [isUploadingReport, setIsUploadingReport] = useState(false);

  const hasReports = useMemo(
    () => packetDetails.some((p) => hasRefractometerReport(p.refractometerReport)),
    [packetDetails]
  );

  const filteredAndSortedPackets = useMemo(
    () =>
      filterAndSortPackets(packetDetails, {
        filterType,
        searchQuery,
        productCategoryId,
        sortKey,
        sortDirection,
      }),
    [packetDetails, filterType, searchQuery, productCategoryId, sortKey, sortDirection]
  );

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        setDataLoading(true);
        const details = await adminFetchBatch(user, productId, batchId);
        setBatchDetails(details);
        const product = await adminFetchProduct(user, productId);
        setProductCategoryId(product.productCategoryId || "");
        setProductName(product.productName || "");
        const packets = await adminFetchPackets(user, productId, batchId);
        setPacketDetails(packets);
      } catch (error) {
        console.error("Error fetching batch or packet details:", error);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [productId, batchId, user]);

  const handleGeneratePacket = async () => {
    if (!user) return;
    try {
      setIsGenerating(true);
      await adminGeneratePackets(user, productId, batchId, packetQuantity);
      const updatedPackets = await adminFetchPackets(user, productId, batchId);
      setPacketDetails(updatedPackets);
      setOpenGeneratePacket(false);
      toast.success(`Generated ${packetQuantity} packet(s) successfully`);
    } catch (error) {
      console.error("Error generating packets:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadReport = async () => {
    if (!uploadReportFile || !user) return;
    setIsUploadingReport(true);
    try {
      const result = await adminUploadTestReport(
        user,
        productId,
        batchId,
        uploadReportFile
      );
      setBatchDetails((prev) => (prev ? { ...prev, testReport: result.reportUrl } : prev));
      setOpenUploadReportDialog(false);
      setUploadReportFile(null);
      toast.success("Test report uploaded successfully!");
    } catch (error) {
      console.error("Error uploading report:", error);
      toast.error("An error occurred while uploading.");
    } finally {
      setIsUploadingReport(false);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleExportToExcel = () => {
    exportPacketsToExcel(
      filteredAndSortedPackets,
      productCategoryId,
      batchDetails?.batchNo || batchId
    );
  };

  const handleOpenIndexModal = (packet: PacketDetails) => {
    setSelectedPacketForIndex(packet);
    setNewIndexValue("");
    setOpenIndexModal(true);
  };

  const handleSaveIndex = async () => {
    if (!selectedPacketForIndex || !newIndexValue || !user) return;
    try {
      setIsUpdatingIndex(true);
      await adminUpdateRefractometer(
        user,
        productId,
        batchId,
        selectedPacketForIndex.id,
        newIndexValue
      );
      toast.success("Refractometer index added successfully");
      setPacketDetails((prev) =>
        prev.map((p) =>
          p.id === selectedPacketForIndex.id
            ? { ...p, refractometerReport: newIndexValue }
            : p
        )
      );
      setOpenIndexModal(false);
    } catch (error) {
      console.error("Error saving index:", error);
      toast.error("Failed to save refractometer index");
    } finally {
      setIsUpdatingIndex(false);
    }
  };

  const confirmDeleteBatch = async () => {
    if (!user) return;
    try {
      setIsGenerating(true);
      const result = await adminDeleteBatch(user, productId, batchId);
      toast.success(result.message || "Batch deleted successfully");
      setOpenDeleteDialog(false);
      router.push(`/admin/${productId}/create_batch`);
    } catch (error) {
      console.error("Error deleting batch:", error);
      toast.error(
        error instanceof Error ? error.message : "An error occurred while deleting the batch"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const openUploadDialog = () => {
    setUploadReportFile(null);
    setOpenUploadReportDialog(true);
  };

  const openTestReport = () => {
    if (batchDetails?.testReport) {
      window.open(batchDetails.testReport, "_blank");
    }
  };

  const isPageBusy = dataLoading || isGenerating;

  return {
    batchDetails,
    productCategoryId,
    productName,
    hasReports,
    filteredAndSortedPackets,
    isPageBusy,
    openGeneratePacket,
    setOpenGeneratePacket,
    packetQuantity,
    setPacketQuantity,
    isGenerating,
    openDeleteDialog,
    setOpenDeleteDialog,
    sortKey,
    sortDirection,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    openIndexModal,
    setOpenIndexModal,
    selectedPacketForIndex,
    newIndexValue,
    setNewIndexValue,
    isUpdatingIndex,
    openUploadReportDialog,
    setOpenUploadReportDialog,
    uploadReportFile,
    setUploadReportFile,
    isUploadingReport,
    handleGeneratePacket,
    handleUploadReport,
    handleSort,
    handleExportToExcel,
    handleOpenIndexModal,
    handleSaveIndex,
    confirmDeleteBatch,
    openUploadDialog,
    openTestReport,
  };
}
