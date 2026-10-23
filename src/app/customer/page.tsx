
"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CodeSegmentInputProps {
  id: string;
  length: number;
  value: string;
  label: string;
  sublabel?: string;
  isFocused: boolean;
  onChange: (val: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

function CodeSegmentInput({
  id,
  length,
  value,
  label,
  // sublabel,
  isFocused,
  onChange,
  onKeyDown,
  onPaste,
  onFocus,
  onBlur,
}: CodeSegmentInputProps) {
  const isFilled = value.length === length;

  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      <div
        className={cn(
          "relative w-full flex items-center justify-center rounded-xl border-2 transition-all duration-200 cursor-text py-2.5 sm:py-3.5 px-1 shadow-sm select-none",
          isFocused
            ? "border-green-600 dark:border-green-500 ring-4 ring-green-500/15 bg-green-50/30 dark:bg-green-950/30 shadow-md scale-[1.02]"
            : isFilled
            ? "border-green-300 dark:border-green-800 bg-green-50/20 dark:bg-green-950/20"
            : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-green-200 dark:hover:border-gray-700"
        )}
        onClick={() => document.getElementById(id)?.focus()}
      >
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer text-base"
          value={value}
          maxLength={length}
          onChange={(e) => {
            const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
            onChange(val);
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onFocus={onFocus}
          onBlur={onBlur}
        />

        {/* Visual Slots showing entered characters and _ for each number */}
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 font-mono select-none pointer-events-none">
          {Array.from({ length }).map((_, i) => {
            const char = value[i];
            const isNextActive = isFocused && i === value.length;
            return (
              <span
                key={i}
                className={cn(
                  "inline-flex items-center justify-center w-4 sm:w-6 text-center text-base sm:text-xl font-bold tracking-tight transition-all",
                  char
                    ? "text-gray-900 dark:text-gray-50"
                    : isNextActive
                    ? "text-green-600 dark:text-green-400 font-extrabold animate-pulse underline decoration-2 decoration-green-500 underline-offset-4"
                    : "text-gray-400 dark:text-gray-500 font-semibold"
                )}
              >
                {char || "_"}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-1.5 sm:mt-2 text-center">
        <span className="block text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">
          {label}
        </span>
        {/* <span className="block text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 font-medium leading-tight">
          {sublabel}
        </span> */}
      </div>
    </div>
  );
}

const CustomerSearchContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [part1, setPart1] = useState("");
  const [part2, setPart2] = useState("");
  const [part3, setPart3] = useState("");
  const [focusedPart, setFocusedPart] = useState<number | null>(null);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const raw = e.clipboardData.getData("text").trim().toUpperCase();
    const clean = raw.replace(/[^A-Z0-9- ]/g, "");

    // Hyphen or space separated: e.g. "001-00001-00001" or "001 00001 00001"
    const splitRegex = /[- ]+/;
    if (splitRegex.test(clean)) {
      const segments = clean.split(splitRegex).filter(Boolean);
      if (segments[0]) setPart1(segments[0].slice(0, 3));
      if (segments[1]) setPart2(segments[1].slice(0, 5));
      if (segments[2]) setPart3(segments[2].slice(0, 5));
      if (segments[2]) {
        document.getElementById("part3")?.focus();
      } else if (segments[1]) {
        document.getElementById("part3")?.focus();
      }
      return;
    }

    // Continuous string of 13 alphanumeric chars: e.g. "0010000100001"
    const digitsOnly = clean.replace(/[^A-Z0-9]/g, "");
    if (digitsOnly.length === 13) {
      setPart1(digitsOnly.slice(0, 3));
      setPart2(digitsOnly.slice(3, 8));
      setPart3(digitsOnly.slice(8, 13));
      document.getElementById("part3")?.focus();
      return;
    }

    // Single chunk paste into whichever field had focus
    const activeId = (e.target as HTMLElement).id;
    if (activeId === "part1") {
      const val = digitsOnly.slice(0, 3);
      setPart1(val);
      if (val.length === 3) document.getElementById("part2")?.focus();
    } else if (activeId === "part2") {
      const val = digitsOnly.slice(0, 5);
      setPart2(val);
      if (val.length === 5) document.getElementById("part3")?.focus();
    } else if (activeId === "part3") {
      const val = digitsOnly.slice(0, 5);
      setPart3(val);
    }
  };

  const handleClear = () => {
    setPart1("");
    setPart2("");
    setPart3("");
    document.getElementById("part1")?.focus();
  };

  const handleSearch = () => {
    const p1 = part1.trim();
    const p2 = part2.trim();
    const p3 = part3.trim();

    if (!p1 && !p2 && !p3) {
      alert("Please enter a serial number.");
      return;
    }

    // Normalize partial digits (e.g. "1" -> "001", "2" -> "00002") for optimal matching
    const normP1 = p1 ? (p1.length < 3 && /^\d+$/.test(p1) ? p1.padStart(3, "0") : p1) : "";
    const normP2 = p2 ? (p2.length < 5 && /^\d+$/.test(p2) ? p2.padStart(5, "0") : p2) : "";
    const normP3 = p3 ? (p3.length < 5 && /^\d+$/.test(p3) ? p3.padStart(5, "0") : p3) : "";

    const segments = [normP1, normP2, normP3].filter(Boolean);
    const resolvedQuery = segments.join("-");
    router.push(`/customer/${resolvedQuery}`);
  };

  const hasAnyInput = Boolean(part1 || part2 || part3);

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-b from-green-50/50 via-white to-green-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 relative z-10 max-w-6xl">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        <Card className="order-1 lg:order-2 w-full backdrop-blur-sm bg-white/95 dark:bg-gray-900/90 shadow-md border border-gray-100 dark:border-gray-800">
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
                  <p className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 leading-tight">Purity Report</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-green-50/50 dark:bg-green-950/20">
                  <div className="bg-green-100 dark:bg-green-800/50 p-2 sm:p-3 rounded-full w-9 h-9 sm:w-11 sm:h-11 mx-auto mb-1.5 sm:mb-2 flex items-center justify-center">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <p className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 leading-tight">Lab Report</p>
                </div>
              </div>

              {/* Search Input */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-bold">
                    Enter the Bottle Number/Jar Number Printed on your Bottle/Jar:
                  </label>
                  {hasAnyInput && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-[11px] sm:text-xs text-gray-400 hover:text-red-500 transition-colors font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* 3 Segments with _ slots */}
                <div className="flex items-start justify-center gap-1.5 sm:gap-3 w-full">
                  <CodeSegmentInput
                    id="part1"
                    length={3}
                    value={part1}
                    label="Product"
                    // sublabel="3 digits"
                    isFocused={focusedPart === 1}
                    onChange={(val) => {
                      setPart1(val);
                      if (val.length === 3) document.getElementById("part2")?.focus();
                    }}
                    onFocus={() => setFocusedPart(1)}
                    onBlur={() => setFocusedPart(null)}
                    onPaste={handlePaste}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      } else if (e.key === "ArrowRight" && e.currentTarget.selectionStart === part1.length) {
                        document.getElementById("part2")?.focus();
                      }
                    }}
                  />

              

                  <CodeSegmentInput
                    id="part2"
                    length={5}
                    value={part2}
                    label="Batch"
                    // sublabel="5 digits"
                    isFocused={focusedPart === 2}
                    onChange={(val) => {
                      setPart2(val);
                      if (val.length === 5) document.getElementById("part3")?.focus();
                    }}
                    onFocus={() => setFocusedPart(2)}
                    onBlur={() => setFocusedPart(null)}
                    onPaste={handlePaste}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !part2) {
                        document.getElementById("part1")?.focus();
                      } else if (e.key === "ArrowLeft" && e.currentTarget.selectionStart === 0) {
                        document.getElementById("part1")?.focus();
                      } else if (e.key === "ArrowRight" && e.currentTarget.selectionStart === part2.length) {
                        document.getElementById("part3")?.focus();
                      } else if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                  />


                  <CodeSegmentInput
                    id="part3"
                    length={5}
                    value={part3}
                    label="Bottle"
                    // sublabel="5 digits"
                    isFocused={focusedPart === 3}
                    onChange={(val) => {
                      setPart3(val);
                    }}
                    onFocus={() => setFocusedPart(3)}
                    onBlur={() => setFocusedPart(null)}
                    onPaste={handlePaste}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !part3) {
                        document.getElementById("part2")?.focus();
                      } else if (e.key === "ArrowLeft" && e.currentTarget.selectionStart === 0) {
                        document.getElementById("part2")?.focus();
                      } else if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                  />
                </div>

                {/* Helper hint */}
                {/* <div className="flex flex-col items-center gap-1 text-center pt-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Format: <span className="font-mono font-semibold text-green-700 dark:text-green-300">001-00001-00001</span> (3 - 5 - 5 digits)
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    Located above or near the QR code on your product
                  </p>
                </div> */}
                
                <Button 
                  onClick={handleSearch}
                  className="w-full py-4 sm:py-6 text-base sm:text-lg font-bold bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white transition-all shadow-md active:scale-[0.99] rounded-lg mt-2 cursor-pointer"
                >
                  Verify Product
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Where to find the Bottle Number Guide Card */}
        <div className="order-2 lg:order-1 w-full bg-[#f4fbf5] dark:bg-green-950/20 border border-green-200/80 dark:border-green-800/40 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-start gap-3 mb-3 sm:mb-4">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-700 dark:bg-green-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 mt-0.5 shadow-sm">
              ?
            </div>
            <div>
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-green-900 dark:text-green-100 leading-tight">
                Where to find the Bottle Number?
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                The bottle number / jar number is printed on the back label of your product, near the MRP section, as shown in the image below.
              </p>
            </div>
          </div>

          <div className="relative mt-2 grid grid-cols-2 items-start gap-2 sm:gap-4">
            {/* Left: Ghee Jar */}
            <div className="relative flex flex-col items-center">
              <span className="mb-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-700 dark:bg-green-600 text-[11px] font-bold text-white shadow-sm">
                1
              </span>
              <div className="w-full rounded-xl bg-white/80 dark:bg-gray-900/40 p-1.5 ring-1 ring-green-200/70 dark:ring-green-800/50">
                <Image
                  src="/images/ghee-jar.png"
                  alt="Golden Ghee Jar showing label location"
                  width={400}
                  height={533}
                  className="w-full h-[170px] sm:h-[210px] lg:h-[240px] object-contain drop-shadow-md"
                  priority
                />
              </div>
              <p className="mt-1.5 text-center text-[10px] sm:text-[11px] font-semibold text-green-900 dark:text-green-100 leading-tight">
                Back of your ghee jar or Mustard oil Bottle
              </p>
            </div>

            {/* Connecting Curved Arrow */}
            <div className="absolute left-[44%] top-[52%] -translate-y-1/2 w-[12%] pointer-events-none z-10 flex items-center justify-center">
              <svg viewBox="0 0 100 60" fill="none" className="w-full h-auto drop-shadow-sm overflow-visible">
                <defs>
                  <marker
                    id="red-arrowhead"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="4"
                    orient="auto"
                  >
                    <polygon points="0 1, 8 4, 0 7" fill="#ef4444" />
                  </marker>
                </defs>
                <path
                  d="M 5 32 Q 45 45, 88 25"
                  stroke="#ef4444"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                  markerEnd="url(#red-arrowhead)"
                />
              </svg>
            </div>

            {/* Right: Packaged Food Information Label */}
            <div className="relative flex flex-col items-center">
              <span className="mb-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-700 dark:bg-green-600 text-[11px] font-bold text-white shadow-sm">
                2
              </span>
              <div className="w-full rounded-xl bg-white/80 dark:bg-gray-900/40 p-1.5 ring-1 ring-green-200/70 dark:ring-green-800/50">
                <Image
                  src="/images/food-label.png"
                  alt="Bottle / Jar Number Label Guide"
                  width={600}
                  height={366}
                  className="w-full h-[170px] sm:h-[210px] lg:h-[240px] object-contain drop-shadow-sm"
                  priority
                />
              </div>
              <p className="mt-1.5 text-center text-[10px] sm:text-[11px] font-semibold text-green-900 dark:text-green-100 leading-tight">
                Find JAR NO/BOTTLE NO near the MRP
              </p>
            </div>
          </div>

          {/* <p className="mt-3 sm:mt-4 text-center text-[11px] sm:text-xs text-gray-600 dark:text-gray-300">
            Example: <span className="font-mono font-bold text-green-800 dark:text-green-200">001-00001-00505</span>
          </p> */}
        </div>
        </div>
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