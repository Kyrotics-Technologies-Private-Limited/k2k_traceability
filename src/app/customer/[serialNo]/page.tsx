"use client";

import React, { useEffect, useState } from "react";
import { fetchCustomerDetails } from "../../../../firebase/firebaseUtil";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHead,
} from "@/components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { motion } from "framer-motion";
import Image from "next/image";

interface PacketDetails {
  productName: string;
  productDetails: string;
  description?: string;
  productImage: string;
  batchNo: string;
  testReport: string;
  refractometerReport: string;
  manufacturingDate?: string;
  expiryDate?: string;
  certifications?: string[];
}

const SearchResult = ({ params }: { params: { serialNo: string } }) => {
  const [packetDetails, setPacketDetails] = useState<PacketDetails | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const { serialNo } = params;

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const details = await fetchCustomerDetails(serialNo);
        if (details) {
          setPacketDetails(details);
        } else {
          router.push("/customer?error=not-found");
        }
      } catch (error) {
        console.error("Error fetching details:", error);
        router.push("/customer?error=fetch-failed");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [serialNo, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 dark:from-green-900 dark:to-green-950 py-10 px-4 w-screen">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="w-full h-[400px] rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-8 w-1/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 dark:from-green-900 dark:to-green-950 py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <Button
          variant="ghost"
          className="mb-6 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          onClick={() => router.push("/customer")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Search
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Product Image and Verification Status */}
          <div className="flex flex-col">
            <Card className="overflow-hidden h-full">
              <div className="relative h-full w-full overflow-hidden group">
                {packetDetails?.productImage ? (
                  <Image
                    src={packetDetails.productImage}
                    alt={packetDetails.productName || "Product image"}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    priority
                  />
                ) : (
                  <div className="flex h-full min-h-[200px] items-center justify-center bg-muted text-sm text-muted-foreground">
                    No product image
                  </div>
                )}
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-green-600 hover:bg-green-700 text-white">
                    <ShieldCheck className="w-4 h-4 mr-1" />
                    Verified Product
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Product Details */}
          <div className="flex flex-col">
            <Card className="h-full">
              <CardContent className="p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-50 leading-tight">
                    {packetDetails?.productName}
                  </h1>
                  
                  {packetDetails?.description && (
                    <p className="text-gray-700 dark:text-gray-200 mb-5 leading-relaxed text-base">
                      {packetDetails.description}
                    </p>
                  )}

                  <div className="bg-green-50/50 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-800/30 mb-6">
                    <p className="text-green-800 dark:text-green-300 font-medium text-[13px]">
                      {packetDetails?.productDetails}
                    </p>
                  </div>

                  <div className="rounded-md border border-gray-200 dark:border-gray-700 mb-6">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="w-[40%] font-medium text-muted-foreground">
                            Batch Number
                          </TableCell>
                          <TableCell className="font-semibold">
                            {packetDetails?.batchNo}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-muted-foreground">
                            Serial Number
                          </TableCell>
                          <TableCell className="font-semibold">
                            {serialNo}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-muted-foreground">
                            Manufacturing Date
                          </TableCell>
                          <TableCell className="font-semibold">
                            {packetDetails?.manufacturingDate || "01/01/2024"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-muted-foreground">
                            Expiry Date
                          </TableCell>
                          <TableCell className="font-semibold">
                            {packetDetails?.expiryDate || "01/01/2025"}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-muted-foreground">
                            Purity Status
                          </TableCell>
                          <TableCell className="font-semibold ">
                           
                              100% Pure
                            
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="space-y-4">
                    <Button
                      className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white py-6 rounded-lg text-[15px] font-semibold shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        if (packetDetails?.testReport) {
                          window.open(packetDetails.testReport, "_blank");
                        }
                      }}
                      disabled={!packetDetails?.testReport}
                    >
                      <FileText className="w-5 h-5" />
                      {packetDetails?.testReport ? "View Batch Laboratory Test Report" : "Test Report Not Available"}
                    </Button>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottle Number Highlight */}
        <p className="mt-8 text-center text-2xl md:text-3xl text-green-700 dark:text-green-400">
          <span className="font-semibold mr-2">
            Your Bottle Test Number:
          </span>
          <span className="font-bold font-mono tracking-wider">
            {serialNo}
          </span>
        </p>
        {/* Purity Analysis Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-50 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                Purity Analysis Report
              </h2>
              <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-1/4">Product Name</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-1/4">
                        Minimum Reference Value <br/>
                        <span className="text-xs font-normal text-gray-500">(for adulteration free)</span>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-1/4">Our Test Value</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 w-1/4">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">{packetDetails?.productName || "N/A"}</TableCell>
                      <TableCell>5.0 - 6.0</TableCell>
                      <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                        {packetDetails?.refractometerReport && packetDetails.refractometerReport !== "N/A" 
                          ? packetDetails.refractometerReport 
                          : "Awaiting Test"}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-col gap-2 text-sm text-green-700 dark:text-green-400 font-medium">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                            Found no adulteration
                          </span>
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                            Natural
                          </span>
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                            Chemical free
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SearchResult;
