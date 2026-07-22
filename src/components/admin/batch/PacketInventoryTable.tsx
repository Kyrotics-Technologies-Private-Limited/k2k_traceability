import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDown, ArrowUp, Plus, Search } from "lucide-react";
import { formatSerialNo, hasRefractometerReport } from "./packet-utils";
import type { PacketDetails, PacketFilterType, SortDirection, SortKey } from "./types";

interface Props {
  packets: PacketDetails[];
  productCategoryId: string;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  filterType: PacketFilterType;
  onFilterTypeChange: (value: PacketFilterType) => void;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  onGeneratePackets: () => void;
  onAddIndex: (packet: PacketDetails) => void;
}

export function PacketInventoryTable({
  packets,
  productCategoryId,
  searchQuery,
  onSearchQueryChange,
  filterType,
  onFilterTypeChange,
  sortKey,
  sortDirection,
  onSort,
  onGeneratePackets,
  onAddIndex,
}: Props) {
  return (
    <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Packet Inventory</h2>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-64 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </span>
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Search serial or bottle no..."
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-9 text-xs pl-9"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={filterType} onValueChange={onFilterTypeChange}>
                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-9 text-xs">
                  <SelectValue placeholder="Filter Packets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Packets</SelectItem>
                  <SelectItem value="missing">Missing Reports</SelectItem>
                  <SelectItem value="completed">Reports Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={onGeneratePackets}
              className="bg-green-600 hover:bg-green-700 text-white shadow-sm flex items-center gap-2 h-9 text-xs"
            >
              <Plus className="w-3 h-3" /> Generate Packets
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  No
                </th>
                <th
                  className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                  onClick={() => onSort("serialNo")}
                >
                  <div className="flex items-center gap-2">
                    Serial Number
                    {sortKey === "serialNo" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      ))}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Refractometer Report
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {packets.map((packet, index) => {
                const reportAdded = hasRefractometerReport(packet.refractometerReport);
                return (
                  <tr
                    key={packet.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {formatSerialNo(packet.serialNo, productCategoryId)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {packet.refractometerReport || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <Button
                        size="sm"
                        disabled={reportAdded}
                        onClick={() => onAddIndex(packet)}
                        className={`text-xs font-medium h-8 px-4 transition-all ${
                          reportAdded
                            ? "bg-gray-100 text-gray-400 border-gray-200"
                            : "bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md border-0"
                        }`}
                      >
                        Add Refractometer Index
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
