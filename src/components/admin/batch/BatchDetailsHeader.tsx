import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  FileText,
  Layers,
  RefreshCw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import type { BatchData } from "./types";

interface Props {
  productName: string;
  batchDetails: BatchData | null;
  onViewReport: () => void;
  onUploadReport: () => void;
  onExportExcel: () => void;
  onDeleteBatch: () => void;
}

export function BatchDetailsHeader({
  productName,
  batchDetails,
  onViewReport,
  onUploadReport,
  onExportExcel,
  onDeleteBatch,
}: Props) {
  return (
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
              <p className="text-gray-500 dark:text-gray-400">Manage batch details and packets</p>
            </div>
          </div>

          <div className="flex gap-3">
            {batchDetails?.testReport ? (
              <>
                <Button variant="outline" onClick={onViewReport} className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  View Report
                </Button>
                <Button
                  variant="outline"
                  onClick={onUploadReport}
                  className="flex items-center gap-2 text-amber-600 border-amber-300 hover:bg-amber-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Replace Report
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={onUploadReport}
                className="flex items-center gap-2 text-green-600 border-green-300 hover:bg-green-50"
              >
                <UploadCloud className="w-4 h-4" />
                Upload Report
              </Button>
            )}
            <Button
              onClick={onExportExcel}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </Button>
            <Button
              variant="destructive"
              onClick={onDeleteBatch}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Batch
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
