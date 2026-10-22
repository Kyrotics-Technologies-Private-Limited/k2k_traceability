import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: string;
  onSave: (formattedDate: string) => Promise<void>;
  isSaving: boolean;
}

function formatDateToReadable(isoDateStr: string): string {
  if (!isoDateStr) return "";
  const parts = isoDateStr.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  }
  return isoDateStr;
}

export function ManufacturingDateDialog({
  open,
  onOpenChange,
  initialDate,
  onSave,
  isSaving,
}: Props) {
  const [dateText, setDateText] = useState("");
  const [pickerValue, setPickerValue] = useState("");

  useEffect(() => {
    if (open) {
      setDateText(initialDate || "");
      setPickerValue("");
    }
  }, [open, initialDate]);

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setPickerValue(rawVal);
    if (rawVal) {
      setDateText(formatDateToReadable(rawVal));
    }
  };

  const handleSetToday = () => {
    const now = new Date();
    const formatted = now.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    setPickerValue(`${year}-${month}-${day}`);
    setDateText(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateText.trim() || isSaving) return;
    await onSave(dateText.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            {initialDate ? "Update Manufacturing Date" : "Add Manufacturing Date"}
          </DialogTitle>
          <DialogDescription>
            Specify the date of manufacturing for this batch. Consumers will see this on the product verification report.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Pick a Date
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSetToday}
                className="h-6 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              >
                <Sparkles className="w-3 h-3 mr-1" /> Today
              </Button>
            </div>
            <Input
              type="date"
              value={pickerValue}
              onChange={handlePickerChange}
              className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Display Format (as shown to customer)
            </label>
            <Input
              type="text"
              placeholder="e.g. 11 July 2026"
              value={dateText}
              onChange={(e) => setDateText(e.target.value)}
              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              You can adjust this text to any preferred date format.
            </p>
          </div>

          {dateText.trim() && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                Customer View Preview:
              </span>{" "}
              <span className="text-emerald-900 dark:text-emerald-100 font-medium">
                Date of Manufacturing: {dateText.trim()}
              </span>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!dateText.trim() || isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSaving ? "Saving..." : "Save Date"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
