import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchNo?: string;
  hasReports: boolean;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteBatchDialog({
  open,
  onOpenChange,
  batchNo,
  hasReports,
  onConfirm,
  isDeleting,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            Confirm Batch Deletion
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {hasReports ? (
            <>
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                This batch has refractometer report. Are you sure you want to delete this batch?
              </p>
              <p className="text-sm text-red-500 mt-3 font-semibold bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                Warning: Deleting this batch will permanently remove all associated reporting data,
                packets, and serial numbers. This action cannot be undone.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete{" "}
                <span className="font-bold text-gray-900 dark:text-white">
                  Batch {batchNo}
                </span>
                ?
              </p>
              <p className="text-sm text-red-500 mt-2 font-medium">
                This action will permanently remove all associated packets and serial numbers.
                This cannot be undone.
              </p>
            </>
          )}
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white border-0"
          >
            {isDeleting ? "Deleting..." : "Delete Permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
