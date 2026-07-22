import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasExistingReport: boolean;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
  isUploading: boolean;
}

export function UploadTestReportDialog({
  open,
  onOpenChange,
  hasExistingReport,
  file,
  onFileChange,
  onUpload,
  isUploading,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <UploadCloud className="w-5 h-5" />
            {hasExistingReport ? "Replace Test Report" : "Upload Test Report"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {hasExistingReport
              ? "A report is already uploaded. Selecting a new file will overwrite the existing one."
              : "Select a PDF or image file for the lab test report for this batch."}
          </p>
          <label
            htmlFor="report-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-green-300 dark:border-green-700 rounded-lg cursor-pointer bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
          >
            <UploadCloud className="w-8 h-8 text-green-500 mb-2" />
            <span className="text-sm text-green-700 dark:text-green-400 font-medium">
              {file ? file.name : "Click to select file"}
            </span>
            <span className="text-xs text-gray-400 mt-1">PDF, PNG, JPG supported</span>
            <input
              id="report-upload"
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <DialogFooter>
          <Button
            onClick={onUpload}
            disabled={!file || isUploading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
