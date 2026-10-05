
"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

const CustomerSearchContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [part1, setPart1] = useState("");
  const [part2, setPart2] = useState("");
  const [part3, setPart3] = useState("");

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").trim();
    if (text.includes("-")) {
      e.preventDefault();
      const segments = text.split("-").map((s) => s.trim().toUpperCase());
      if (segments[0]) setPart1(segments[0].slice(0, 3));
      if (segments[1]) setPart2(segments[1].slice(0, 5));
      if (segments[2]) setPart3(segments[2].slice(0, 5));
      if (segments[2]) {
        document.getElementById("part3")?.focus();
      } else if (segments[1]) {
        document.getElementById("part3")?.focus();
      }
    }
  };

  const handleSearch = () => {
    const p1 = part1.trim();
    const p2 = part2.trim();
    const p3 = part3.trim();

    if (!p1 && !p2 && !p3) {
      alert("Please enter a product or serial number.");
      return;
    }

    const segments = [p1, p2, p3].filter(Boolean);
    const resolvedQuery = segments.join("-");
    router.push(`/customer/${resolvedQuery}`);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-b from-green-50/50 via-white to-green-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 relative z-10 max-w-4xl">
        <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4 sm:mb-6">
            <Link href="/" className="cursor-pointer inline-block">
              <Image
                src="/images/univillage-logo.jpeg"
                alt="UniVillage Logo"
                width={140}
                height={140}
                className="w-24 sm:w-32 md:w-36 h-auto object-contain rounded-xl shadow-sm hover:opacity-90 transition-opacity"
                priority
              />
            </Link>
          </div>
          
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-gray-50 tracking-tight">
            Verify Your Product 
          </h1>
          <p className="font-display text-sm sm:text-base md:text-lg italic font-normal text-green-800 dark:text-green-200 mb-6 sm:mb-8 max-w-md mx-auto relative px-4 sm:px-6 py-2 sm:py-3 border-l-4 border-green-600 dark:border-green-400 bg-green-50/80 dark:bg-green-950/40 rounded-r-lg shadow-sm">
            “Trust is not claimed. It is proven.”
          </p>

          {errorParam === "not-found" && (
            <div className="max-w-md mx-auto mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2.5 text-amber-800 text-xs sm:text-sm text-left shadow-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
              <span>Product or Serial number was not found. Please double-check your code or confirm batches have been created in the Admin portal.</span>
            </div>
          )}

          {errorParam === "fetch-failed" && (
            <div className="max-w-md mx-auto mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-red-800 text-xs sm:text-sm text-left shadow-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
              <span>Could not load verification details right now. Please try again.</span>
            </div>
          )}
        </div>

        <Card className="w-full max-w-xl mx-auto backdrop-blur-sm bg-white/95 dark:bg-gray-900/90 shadow-md border border-gray-100 dark:border-gray-800">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="grid gap-6 sm:gap-8">
              {/* Features */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="text-center p-2 rounded-lg bg-green-50/50 dark:bg-green-950/20">
                  <div className="bg-green-100 dark:bg-green-800/50 p-2 sm:p-3 rounded-full w-9 h-9 sm:w-11 sm:h-11 mx-auto mb-1.5 sm:mb-2 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 leading-tight">Product Authenticity</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-green-50/50 dark:bg-green-950/20">
                  <div className="bg-green-100 dark:bg-green-800/50 p-2 sm:p-3 rounded-full w-9 h-9 sm:w-11 sm:h-11 mx-auto mb-1.5 sm:mb-2 flex items-center justify-center">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 leading-tight">Batch Reports</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-green-50/50 dark:bg-green-950/20">
                  <div className="bg-green-100 dark:bg-green-800/50 p-2 sm:p-3 rounded-full w-9 h-9 sm:w-11 sm:h-11 mx-auto mb-1.5 sm:mb-2 flex items-center justify-center">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <p className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 leading-tight">Quality Analysis</p>
                </div>
              </div>

              {/* Search Input */}
              <div className="space-y-4">
                <label className="block text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Enter the Serial Number on your bottle / jar:
                </label>
                <div className="flex items-center justify-center gap-1.5 sm:gap-3 w-full">
                  <Input
                    id="part1"
                    type="text"
                    className="flex-1 max-w-[80px] sm:max-w-[100px] text-center py-3 sm:py-5 text-base sm:text-xl font-semibold border-2 border-green-100 dark:border-green-800 focus:border-green-500 dark:focus:border-green-600 uppercase px-1 rounded-lg"
                    value={part1}
                    onPaste={handlePaste}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                      setPart1(val);
                      if (val.length === 3) document.getElementById("part2")?.focus();
                    }}
                    placeholder="001"
                    maxLength={3}
                  />
                  <span className="text-gray-400 font-bold text-lg sm:text-2xl select-none">-</span>
                  <Input
                    id="part2"
                    type="text"
                    className="flex-1 max-w-[105px] sm:max-w-[130px] text-center py-3 sm:py-5 text-base sm:text-xl font-semibold border-2 border-green-100 dark:border-green-800 focus:border-green-500 dark:focus:border-green-600 uppercase px-1 rounded-lg"
                    value={part2}
                    onPaste={handlePaste}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                      setPart2(val);
                      if (val.length === 5) document.getElementById("part3")?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !part2) {
                        document.getElementById("part1")?.focus();
                      }
                    }}
                    placeholder="00001"
                    maxLength={5}
                  />
                  <span className="text-gray-400 font-bold text-lg sm:text-2xl select-none">-</span>
                  <Input
                    id="part3"
                    type="text"
                    className="flex-1 max-w-[105px] sm:max-w-[130px] text-center py-3 sm:py-5 text-base sm:text-xl font-semibold border-2 border-green-100 dark:border-green-800 focus:border-green-500 dark:focus:border-green-600 uppercase px-1 rounded-lg"
                    value={part3}
                    onPaste={handlePaste}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                      setPart3(val);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !part3) {
                        document.getElementById("part2")?.focus();
                      } else if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    placeholder="00001"
                    maxLength={5}
                  />
                </div>
                
                <Button 
                  onClick={handleSearch}
                  className="w-full py-4 sm:py-6 text-base sm:text-lg font-bold bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white transition-all shadow-md active:scale-[0.99] rounded-lg mt-2"
                >
                  Verify Product
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function CustomerSearch() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-900" />}>
      <CustomerSearchContent />
    </Suspense>
  );
}