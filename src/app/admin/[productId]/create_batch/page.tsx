"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Package, Layers, Upload } from "lucide-react";
import { fetchProductByProductId, addBatchToProduct, fetchBatchesByProductId } from "../../../../../firebase/firebaseUtil";
import Link from "next/link";
import { motion } from "framer-motion";

interface Props {
  params: {
    productId: string;
  };
}

interface ProductDetails {
  id: string;
  productName?: string;
  productDetails?: string;
  productImage?: string;
}

const BatchesPage: React.FC<Props> = ({ params }) => {
  const [open, setOpen] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
  const [quantity, setQuantity] = useState("");
  const [testReport, setTestReport] = useState<File | null>(null);
  const [batchNo, setBatchNo] = useState("");
  const [testReportUrl, setTestReportUrl] = useState<string | null>("");
  const [dragActive, setDragActive] = useState(false);

  const { productId } = params;

  useEffect(() => {
    const fetchData = async () => {
      const product = await fetchProductByProductId(productId);
      setProductDetails(product);
      const fetchedBatches = await fetchBatchesByProductId(productId);
      setBatches(fetchedBatches);
    };

    fetchData();
  }, [productId]);

  const handleDialogOpen = () => {
    if (batches.length > 0) {
      const lastBatchNo = Math.max(...batches.map(batch => parseInt(batch.batchNo, 10))) || 0;
      setBatchNo((lastBatchNo + 1).toString().padStart(3, "0"));
    } else {
      setBatchNo("001");
    }
    setOpen(true);
  };

  const handleCreateBatch = async () => {
    const newBatchId = await addBatchToProduct(productId, Number(quantity), testReport);
    setBatches([...batches, { id: newBatchId, batchNo, quantity, testReportUrl }]);
    setQuantity("");
    setTestReport(null);
    setOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setTestReport(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setTestReport(file);
    }
  };

  return (
    <div className="min-h-screen bg-[url('/grid.svg')] bg-fixed bg-green-50/90 dark:bg-green-950/90">
      <div className="absolute inset-0 bg-gradient-to-b from-green-50/90 to-green-100/90 dark:from-green-950/90 dark:to-green-900/90" />
      
      <div className="relative container mx-auto px-4 py-8">
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap md:flex-nowrap gap-8">
              {/* Left Section: Product Image */}
              <div className="w-full md:w-1/3 space-y-6">
                <div className="relative group overflow-hidden rounded-xl">
                  {productDetails?.productImage ? (
                    <img
                      src={productDetails.productImage}
                      alt={productDetails.productName || "Product Image"}
                      className="w-full aspect-square object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gray-200 dark:bg-gray-800 flex items-center justify-center rounded-xl">
                      <Package className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <Badge className="absolute top-4 right-4 bg-green-600/90 backdrop-blur-sm">
                    Active Product
                  </Badge>
                </div>

                <Button 
                  onClick={handleDialogOpen}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" /> Create New Batch
                </Button>
              </div>

              {/* Right Section: Product Details */}
              <div className="w-full md:w-2/3 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                    {productDetails?.productName || "Product Name"}
                  </h1>
                  <p className="mt-4 text-gray-600 dark:text-gray-300">
                    {productDetails?.productDetails || "Product Details"}
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center">
                    <Layers className="w-5 h-5 mr-2 text-green-600" />
                    Product Batches
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {batches.map((batch, index) => (
                      <Link href={`/admin/${productId}/${batch.id}/batch_details`} key={index}>
                        <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 border-0">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-50">
                                  Batch {batch.batchNo || `${index + 1}`.padStart(3, "0")}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Quantity: {batch.quantity || "N/A"}
                                </p>
                              </div>
                              <FileText className="w-5 h-5 text-green-600" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Batch
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label htmlFor="quantity" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Maximum Batch Size
              </label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="border-gray-200 dark:border-gray-700"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Test Report
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                  dragActive ? "border-green-500 bg-green-50/50" : "border-gray-200 dark:border-gray-700"
                } relative`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-green-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF or DOC up to 10MB</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="batch-no" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Generated Batch Number
              </label>
              <Input
                id="batch-no"
                value={batchNo}
                readOnly
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateBatch}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Create Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BatchesPage;