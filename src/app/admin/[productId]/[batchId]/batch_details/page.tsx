"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Loader from "@/components/common/Loader";
import { BatchDetailsHeader } from "@/components/admin/batch/BatchDetailsHeader";
import { BatchStatsCards } from "@/components/admin/batch/BatchStatsCards";
import { DeleteBatchDialog } from "@/components/admin/batch/DeleteBatchDialog";
import { GeneratePacketsDialog } from "@/components/admin/batch/GeneratePacketsDialog";
import { PacketInventoryTable } from "@/components/admin/batch/PacketInventoryTable";
import { RefractometerIndexDialog } from "@/components/admin/batch/RefractometerIndexDialog";
import { UploadTestReportDialog } from "@/components/admin/batch/UploadTestReportDialog";
import { useBatchDetails } from "@/components/admin/batch/useBatchDetails";

interface Props {
  params: {
    batchId: string;
    productId: string;
  };
}

export default function BatchDetailsPage({ params }: Props) {
  const { user } = useAuth();
  const { productId, batchId } = params;
  const batch = useBatchDetails({ user, productId, batchId });

  if (batch.isPageBusy) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen pb-10">
      <div className="absolute inset-0 bg-gradient-to-b from-green-50/90 to-green-100/90 dark:from-green-950/90 dark:to-green-900/90" />

      <div className="relative container mx-auto px-4 py-8 space-y-6">
        <Link href={`/admin/${productId}/create_batch`}>
          <Button variant="ghost" className="text-gray-600 hover:text-green-600 p-0">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Batches
          </Button>
        </Link>

        <BatchDetailsHeader
          productName={batch.productName}
          batchDetails={batch.batchDetails}
          onViewReport={batch.openTestReport}
          onUploadReport={batch.openUploadDialog}
          onExportExcel={batch.handleExportToExcel}
          onDeleteBatch={() => batch.setOpenDeleteDialog(true)}
        />

        <BatchStatsCards batchDetails={batch.batchDetails} />

        <PacketInventoryTable
          packets={batch.filteredAndSortedPackets}
          productCategoryId={batch.productCategoryId}
          searchQuery={batch.searchQuery}
          onSearchQueryChange={batch.setSearchQuery}
          filterType={batch.filterType}
          onFilterTypeChange={batch.setFilterType}
          sortKey={batch.sortKey}
          sortDirection={batch.sortDirection}
          onSort={batch.handleSort}
          onGeneratePackets={() => batch.setOpenGeneratePacket(true)}
          onAddIndex={batch.handleOpenIndexModal}
        />

        <GeneratePacketsDialog
          open={batch.openGeneratePacket}
          onOpenChange={batch.setOpenGeneratePacket}
          quantity={batch.packetQuantity}
          onQuantityChange={batch.setPacketQuantity}
          onGenerate={batch.handleGeneratePacket}
          isGenerating={batch.isGenerating}
        />

        <DeleteBatchDialog
          open={batch.openDeleteDialog}
          onOpenChange={batch.setOpenDeleteDialog}
          batchNo={batch.batchDetails?.batchNo}
          hasReports={batch.hasReports}
          onConfirm={batch.confirmDeleteBatch}
          isDeleting={batch.isGenerating}
        />

        <RefractometerIndexDialog
          open={batch.openIndexModal}
          onOpenChange={batch.setOpenIndexModal}
          packet={batch.selectedPacketForIndex}
          productCategoryId={batch.productCategoryId}
          value={batch.newIndexValue}
          onValueChange={batch.setNewIndexValue}
          onSave={batch.handleSaveIndex}
          isSaving={batch.isUpdatingIndex}
        />

        <UploadTestReportDialog
          open={batch.openUploadReportDialog}
          onOpenChange={batch.setOpenUploadReportDialog}
          hasExistingReport={!!batch.batchDetails?.testReport}
          file={batch.uploadReportFile}
          onFileChange={batch.setUploadReportFile}
          onUpload={batch.handleUploadReport}
          isUploading={batch.isUploadingReport}
        />
      </div>
    </div>
  );
}
