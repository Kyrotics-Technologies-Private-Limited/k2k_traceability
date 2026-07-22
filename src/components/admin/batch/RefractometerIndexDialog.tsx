import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Beaker } from "lucide-react";
import type { PacketDetails } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packet: PacketDetails | null;
  productCategoryId: string;
  value: string;
  onValueChange: (v: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function RefractometerIndexDialog({
  open,
  onOpenChange,
  packet,
  productCategoryId,
  value,
  onValueChange,
  onSave,
  isSaving,
}: Props) {
  const displaySerial =
    packet?.serialNo?.startsWith("undefined")
      ? packet.serialNo.replace("undefined", productCategoryId)
      : packet?.serialNo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              {displaySerial}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Refractometer Index Value
            </label>
            <Input
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder="Enter index value (e.g. 1.345)"
              className="border-gray-200 dark:border-gray-700"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving || !value}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSaving ? "Saving..." : "Confirm & Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
