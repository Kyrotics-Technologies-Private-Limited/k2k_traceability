import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Beaker, Calendar, Edit2, Package } from "lucide-react";
import type { BatchData } from "./types";

interface Props {
  batchDetails: BatchData | null;
  onOpenMfgDate?: () => void;
}

export function BatchStatsCards({ batchDetails, onOpenMfgDate }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Date of Manufacturing</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-50 truncate max-w-[150px] sm:max-w-[180px]">
                  {batchDetails?.manufacturingDate || "Not Set"}
                </p>
              </div>
            </div>
            {onOpenMfgDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenMfgDate}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 h-8 px-2 text-xs flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                {batchDetails?.manufacturingDate ? "Edit" : "Add"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
