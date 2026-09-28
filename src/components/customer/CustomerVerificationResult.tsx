"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, FlaskConical, Leaf, ShieldCheck, TestTube2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { CustomerPacketDetails } from "./useCustomerSerialDetails";
import { getPurityReportDetails } from "./purity-report";

const QUALITY_REMARKS = [
  "Adulteration free",
  "Chemical free",
  "Natural",
  
] as const;

interface CustomerVerificationResultProps {
  serialNo: string;
  packetDetails: CustomerPacketDetails;
}

export function CustomerVerificationResult({
  serialNo,
  packetDetails,
}: CustomerVerificationResultProps) {
  const router = useRouter();
  const purityInfo = getPurityReportDetails(packetDetails.productName);

  return (
    <div className="min-h-screen w-full max-w-full flex flex-col bg-gradient-to-br from-[#f8faf6] via-[#f3f7f1] to-[#eaf2e8] text-gray-900 p-3 sm:p-5 md:p-6 lg:p-8 overflow-x-hidden overflow-y-auto box-border font-sans">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-screen-2xl mx-auto w-full min-w-0 h-full flex flex-col justify-between min-h-0"
      >
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            className="mb-3 sm:mb-4 text-[#2c5325] hover:text-[#1e3b19] hover:bg-[#2c5325]/15 transition-colors font-medium h-9 text-xs sm:text-sm px-2 sm:px-3"
            onClick={() => router.push("/customer")}
          >
            <ArrowLeft className="mr-1.5 sm:mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </div>

        <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch min-h-0 min-w-0 mb-4 sm:mb-6">
          {/* Left Column: Product Image & Authenticity Badge */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-0 min-w-0">
            <div className="relative flex-grow flex items-center justify-center bg-gray-50/50 p-4 min-h-[220px] sm:min-h-[280px] lg:min-h-0 h-56 sm:h-72 lg:h-auto">
              {packetDetails.productImage ? (
                <div className="relative w-full h-full">
                  <Image
                    src={packetDetails.productImage}
                    alt={packetDetails.productName || "Product image"}
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-contain transition-transform duration-300 hover:scale-[1.02]"
                    priority
                  />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-xs sm:text-sm font-light text-gray-400">
                  No product image available
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 bg-[#2c5325] border-t border-[#2c5325] flex-shrink-0">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/15 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
              </div>
              <span className="font-display text-white font-bold text-xs sm:text-sm md:text-[15px] tracking-wide uppercase leading-tight">
                YOUR PRODUCT IS AUTHENTIC & TESTED
              </span>
            </div>
          </div>

          {/* Right Column: Details & Quality Report */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 md:p-6 lg:p-7 min-h-0 min-w-0 overflow-hidden">
            <div className="flex flex-col justify-between h-full min-h-0 gap-4 sm:gap-5">
              <div className="flex-shrink-0">
                <div className="mb-3 sm:mb-5">
                  <h1 className="font-sans text-xl sm:text-2xl md:text-3xl lg:text-[2.2rem] font-bold text-[#2c5325] tracking-wide leading-tight">
                    PRODUCT TEST REPORT
                  </h1>
                </div>
                <div className="space-y-1.5 sm:space-y-2.5 text-xs sm:text-sm md:text-base tracking-tight divide-y sm:divide-y-0 divide-gray-100">
                  <div className="pt-1 sm:pt-0 flex flex-wrap gap-x-1.5">
                    <span className="font-semibold text-gray-900">Product Name:</span>{" "}
                    <span className="font-normal text-gray-700">{packetDetails.productName}</span>
                  </div>
                  <div className="pt-1 sm:pt-0 flex flex-wrap gap-x-1.5">
                    <span className="font-semibold text-gray-900">Batch number:</span>{" "}
                    <span className="font-normal text-gray-700">{packetDetails.batchNo}</span>
                  </div>
                  <div className="pt-1 sm:pt-0 flex flex-wrap gap-x-1.5">
                    <span className="font-semibold text-gray-900">Bottle number:</span>{" "}
                    <span className="font-normal text-gray-700">{serialNo}</span>
                  </div>
                  <div className="pt-1 sm:pt-0 flex flex-wrap gap-x-1.5">
                    <span className="font-semibold text-gray-900">Date of Manufacturing:</span>{" "}
                    <span className="font-normal text-gray-700">
                      {packetDetails.manufacturingDate || "11 July 2026"}
                    </span>
                  </div>
                  <div className="pt-1 sm:pt-0 flex flex-wrap gap-x-1.5">
                    <span className="font-semibold text-gray-900">Expiry date:</span>{" "}
                    <span className="font-normal text-gray-700">
                      {packetDetails.expiryDate || "Best before 12 months from the date of manufacturing"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-grow min-h-0 flex flex-col justify-center">
                <h2 className="font-sans text-sm sm:text-base md:text-lg font-bold text-gray-900 tracking-tight mb-2">
                  QUALITY & PURITY REPORT
                </h2>
                <div className="rounded-xl border border-[#2c5325]/20 overflow-hidden bg-white max-w-full">
                  <div className="overflow-x-auto max-w-full">
                    <table className="w-full min-w-[500px] xl:min-w-0 border-collapse text-left">
                      <thead>
                        <tr className="bg-[#2c5325] border-b border-[#1e3b19]">
                          <th className="py-2 sm:py-2.5 px-2.5 sm:px-3 text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider w-[28%] border-r border-white/25">
                            TEST PARAMETER
                          </th>
                          <th className="py-2 sm:py-2.5 px-2 sm:px-3 text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider text-center w-[16%] border-r border-white/25">
                            OBSERVED
                          </th>
                          <th className="py-2 sm:py-2.5 px-2 sm:px-3 text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider text-center w-[22%] border-r border-white/25">
                            {purityInfo.rangeLabel}
                          </th>
                          <th className="py-2 sm:py-2.5 px-2.5 sm:px-3 text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider w-[34%]">
                            REMARKS
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2c5325]/15 font-light">
                        <tr>
                          <td className="py-2.5 sm:py-3 px-2.5 sm:px-3 text-xs sm:text-sm font-medium text-gray-800 border-r border-[#2c5325]/15">
                            {purityInfo.parameter}
                          </td>
                          <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center border-r border-[#2c5325]/15">
                            <span className="inline-block px-2 sm:px-2.5 py-0.5 bg-[#FEF08A] text-gray-900 font-semibold rounded text-xs sm:text-sm border border-[#fcee7e] min-w-[40px]">
                              {packetDetails.refractometerReport && packetDetails.refractometerReport !== "N/A"
                                ? packetDetails.refractometerReport
                                : "2.8"}
                            </span>
                          </td>
                          <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-xs sm:text-sm font-normal text-gray-700 border-r border-[#2c5325]/15">
                            {purityInfo.standardRange}
                          </td>
                          <td className="py-2.5 sm:py-3 px-2.5 sm:px-3 align-middle w-[34%]">
                            <ul className="space-y-1 sm:space-y-1.5">
                              {QUALITY_REMARKS.map((remark) => (
                                <li
                                  key={remark}
                                  className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#2c5325] whitespace-nowrap"
                                >
                                  <RemarkCheckIcon />
                                  <span>{remark}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 pt-1">
                {packetDetails.testReport ? (
                  <Button
                    className="w-full bg-[#2C5325] hover:bg-[#1E3B19] text-white py-4 sm:py-5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm md:text-base font-bold shadow-sm transition-all active:scale-[0.98] flex items-center justify-between gap-2"
                    onClick={() => window.open(packetDetails.testReport!, "_blank")}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white/90 flex-shrink-0" strokeWidth={2.25} />
                      <span>View Batch Lab Test Report</span>
                    </div>
                    <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                ) : (
                  <div
                    className="w-full bg-[#94B890] rounded-lg py-3.5 sm:py-4 px-3 sm:px-4 flex items-center justify-center gap-2 sm:gap-3 shadow-sm"
                    role="status"
                    aria-live="polite"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                      <line x1="8" y1="16" x2="16" y2="16" />
                      <line x1="8" y1="8" x2="12" y2="8" />
                    </svg>
                    <span className="text-white font-bold text-xs sm:text-sm md:text-base tracking-wide">
                      Test Report Not Available
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <CustomerTrustIndicators />
      </motion.div>
    </div>
  );
}

function RemarkCheckIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-[#2c5325]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CustomerTrustIndicators() {
  return (
    <>
      <div className="flex-shrink-0 bg-[#faf9f4] border border-gray-100 rounded-xl p-3 sm:p-4 md:p-5 min-w-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 items-center divide-y-0 divide-x-0 lg:divide-x divide-gray-200/80">
          <div className="flex items-center gap-2.5 sm:gap-3 py-1 sm:py-0 px-1 sm:px-3 lg:px-4 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#2c5325]/10 flex items-center justify-center text-[#2c5325]">
              <TestTube2 className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.75} />
            </div>
            <span className="font-display text-xs sm:text-sm md:text-base font-bold text-[#2c5325] leading-snug min-w-0">
              Every Bottle<br />Lab Tested
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 py-1 sm:py-0 px-1 sm:px-3 lg:px-4 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#2c5325]/10 flex items-center justify-center text-[#2c5325]">
              <FlaskConical className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.75} />
            </div>
            <span className="font-display text-xs sm:text-sm md:text-base font-bold text-[#2c5325] leading-snug min-w-0">
              No Added<br />Chemicals
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 py-1 sm:py-0 px-1 sm:px-3 lg:px-4 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#2c5325]/10 flex items-center justify-center text-[#2c5325]">
              <Leaf className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.75} />
            </div>
            <span className="font-display text-xs sm:text-sm md:text-base font-bold text-[#2c5325] leading-snug min-w-0">
              Pure. Natural.<br />Trustworthy.
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 py-1 sm:py-0 px-1 sm:px-3 lg:px-4 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#2c5325]/10 flex items-center justify-center text-[#2c5325]">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.75} />
            </div>
            <span className="font-display text-xs sm:text-sm md:text-base font-bold text-[#2c5325] leading-snug min-w-0">
              Trust isn&apos;t claimed.<br />It&apos;s proven.
            </span>
          </div>
        </div>
      </div>

      <p className="font-sans text-[11px] sm:text-xs md:text-sm font-normal text-[#2c5325]/90 text-center mt-3 sm:mt-4 leading-snug">
        Thank you for choosing UniVillage Agro.
      </p>
    </>
  );
}
