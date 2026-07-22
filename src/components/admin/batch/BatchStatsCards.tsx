import { Card, CardContent } from "@/components/ui/card";
import { Beaker, Package } from "lucide-react";
import type { BatchData } from "./types";

interface Props {
  batchDetails: BatchData | null;
}

export function BatchStatsCards({ batchDetails }: Props) {
  return (
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
  );
}
