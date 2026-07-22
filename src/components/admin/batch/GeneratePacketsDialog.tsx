import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quantity: number;
  onQuantityChange: (q: number) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function GeneratePacketsDialog({
  open,
  onOpenChange,
  quantity,
  onQuantityChange,
  onGenerate,
  isGenerating,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={quantity}
              onChange={(e) => onQuantityChange(Number(e.target.value))}
              className="border-gray-200 dark:border-gray-700"
              placeholder="Enter quantity"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
