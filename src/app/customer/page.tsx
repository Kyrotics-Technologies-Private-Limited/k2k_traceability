
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

const CustomerSearch = () => {
  const [serialNo, setSerialNo] = useState<string>("");
  const router = useRouter();

  const handleSearch = () => {
    const trimmedSerialNo = serialNo.trim();
    if (trimmedSerialNo === "") {
      alert("Please enter a serial number.");
      return;
    }
    router.push(`/customer/${trimmedSerialNo}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/univillage-logo.jpeg"
              alt="UniVillage Logo"
              width={160}
              height={160}
              className="object-contain rounded-xl shadow-sm"
              priority
            />
          </div>
          
          <h1 className="font-display text-4xl font-bold mb-4 text-gray-900 dark:text-gray-50">
            Verify Your Product 
          </h1>
          <p className="font-display text-lg md:text-xl italic font-normal text-green-800 dark:text-green-200 mb-8 max-w-md mx-auto relative px-6 py-3 border-l-4 border-green-600 dark:border-green-400 bg-green-50/50 dark:bg-green-950/20 rounded-r-lg shadow-sm">
            “Trust is not claimed. It is proven.”
          </p>
        </div>

        <Card className="max-w-2xl mx-auto backdrop-blur-sm bg-white/90 dark:bg-gray-900/90">
          <CardContent className="p-8">
            <div className="grid gap-8">
              {/* Features */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="bg-green-100 dark:bg-green-800/50 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm font-light text-gray-600 dark:text-gray-300">Product Authenticity</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 dark:bg-green-800/50 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-light text-gray-600 dark:text-gray-300">Batch Reports</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 dark:bg-green-800/50 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <p className="text-sm font-light text-gray-600 dark:text-gray-300">Quality Analysis</p>
                </div>
              </div>

              {/* Search Input */}
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type="text"
                    className="pl-4 pr-12 py-6 text-lg font-light border-2 border-green-100 dark:border-green-800 focus:border-green-500 dark:focus:border-green-600"
                    value={serialNo}
                    onChange={(e) => setSerialNo(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter Bottle Number/Jar Number "
                  />
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                
                <Button 
                  onClick={handleSearch}
                  className="w-full py-6 text-lg font-bold bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 transition-colors duration-200"
                >
                  Verify Product
                </Button>
                
                {/* <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  Enter the serial number found on your product packaging
                </p> */}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        {/* <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Trusted by leading natural product manufacturers worldwide
          </p>
          <div className="mt-4 flex justify-center space-x-8">
            <div className="w-16 h-16 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center">
              <Image
                src="/honey.webp"
                alt="Certification 1"
                width={32}
                height={32}
                className="rounded-full"
              />
            </div>
            <div className="w-16 h-16 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center">
              <Image
                src="/cowghee.webp"
                alt="Certification 2"
                width={32}
                height={32}
                className="rounded-full"
              />
            </div>
            <div className="w-16 h-16 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center">
              <Image
                src="/TeaP.webp"
                alt="Certification 3"
                width={32}
                height={32}
                className="rounded-full"
              />
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default CustomerSearch;