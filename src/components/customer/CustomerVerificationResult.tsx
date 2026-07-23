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
    <div className="min-h-screen w-full max-w-full flex flex-col bg-gradient-to-br from-[#f8faf6] via-[#f3f7f1] to-[#eaf2e8] text-gray-900 p-4 md:p-6 lg:p-8 overflow-x-hidden overflow-y-auto box-border font-sans">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-screen-2xl mx-auto w-full min-w-0 h-full flex flex-col justify-between min-h-0"
      >
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            className="mb-4 text-[#2c5325] hover:text-[#1e3b19] hover:bg-[#2c5325]/15 transition-colors font-normal h-9"
            onClick={() => router.push("/customer")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </div>

        <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-0 min-w-0 mb-6">
          <div className="lg:col-span-4 flex flex-col justify-between bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-full min-h-0 min-w-0">
            <div className="relative flex-grow flex items-center justify-center bg-gray-50/50 min-h-0 p-4">
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
                <div className="flex h-full items-center justify-center text-sm font-light text-gray-400">
                  No product image available
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 p-4 bg-[#2c5325] border-t border-[#2c5325] flex-shrink-0">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white">
                <ShieldCheck className="w-6 h-6" strokeWidth={2} />
              </div>
              <span className="font-display text-white font-bold text-[14px] md:text-[16px] tracking-wide uppercase leading-tight">
                YOUR PRODUCT IS AUTHENTIC & TESTED
              </span>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col justify-between bg-white rounded-xl border border-gray-100 shadow-sm p-5 md:p-6 lg:p-7 h-full min-h-0 min-w-0 overflow-hidden">
            <div className="flex flex-col justify-between h-full min-h-0 gap-4">
              <div className="flex-shrink-0">
                <div className="mb-5">
                  <h1 className="font-sans text-[2rem] md:text-[2.35rem] font-bold text-[#2c5325] tracking-[0.06em] leading-[1.15]">
                    PRODUCT TEST REPORT
                  </h1>
                </div>
                <div className="space-y-2.5 text-sm md:text-base tracking-tight">
                  <div>
                    <span className="font-normal text-gray-900">Product Name:</span>{" "}
                    <span className="font-light text-gray-700">{packetDetails.productName}</span>
                  </div>
                  <div>
                    <span className="font-normal text-gray-900">Batch number:</span>{" "}
                    <span className="font-light text-gray-700">{packetDetails.batchNo}</span>
                  </div>
                  <div>
                    <span className="font-normal text-gray-900">Bottle number:</span>{" "}
                    <span className="font-light text-gray-700">{serialNo}</span>
                  </div>
                  <div>
                    <span className="font-normal text-gray-900">Date of Manufacturing:</span>{" "}
                    <span className="font-light text-gray-700">
                      {packetDetails.manufacturingDate || "11 July 2026"}
                    </span>
                  </div>
                  <div>
                    <span className="font-normal text-gray-900">Expiry date:</span>{" "}
                    <span className="font-light text-gray-700">
                      {packetDetails.expiryDate || "Best before 12 months from the date of manufacturing"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-grow min-h-0 flex flex-col justify-center">
                <h2 className="font-sans text-lg md:text-xl font-bold text-gray-900 tracking-tight mb-2">
                  QUALITY & PURITY REPORT
                </h2>
                <div className="rounded-xl border border-[#2c5325]/20 overflow-hidden bg-white max-w-full">
                  <div className="overflow-x-auto max-w-full">
                    <table className="w-full min-w-[640px] xl:min-w-0 border-collapse text-left table-fixed">
                      <thead>
                        <tr className="bg-[#2c5325] border-b border-[#1e3b19]">
                          <th className="py-2.5 px-3 text-[11px] md:text-xs font-bold text-white uppercase tracking-wider w-[26%] border-r border-white/25">
                            TEST PARAMETER
                          </th>
                          <th className="py-2.5 px-3 text-[11px] md:text-xs font-bold text-white uppercase tracking-wider text-center w-[14%] border-r border-white/25">
                            OBSERVED VALUE
                          </th>
                          <th className="py-2.5 px-3 text-[11px] md:text-xs font-bold text-white uppercase tracking-wider text-center w-[24%] border-r border-white/25">
                            {purityInfo.rangeLabel}
                          </th>
                          <th className="py-2.5 px-3 text-[11px] md:text-xs font-bold text-white uppercase tracking-wider w-[36%]">
                            REMARKS
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2c5325]/15 font-light">
                        <tr>
                          <td className="py-3 px-3 text-xs md:text-sm font-normal text-gray-800 border-r border-[#2c5325]/15">
                            {purityInfo.parameter}
                          </td>
                          <td className="py-3 px-3 text-center border-r border-[#2c5325]/15">
                            <span className="inline-block px-2.5 py-0.5 bg-[#FEF08A] text-gray-900 font-semibold rounded text-xs md:text-sm border border-[#fcee7e] min-w-[45px]">
                              {packetDetails.refractometerReport && packetDetails.refractometerReport !== "N/A"
                                ? packetDetails.refractometerReport
                                : "2.8"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-xs md:text-sm font-light text-gray-700 border-r border-[#2c5325]/15">
                            {purityInfo.standardRange}
                          </td>
                          <td className="py-3 px-3 align-middle w-[36%]">
                            <ul className="space-y-1.5">
                              {QUALITY_REMARKS.map((remark) => (
                                <li
                                  key={remark}
                                  className="flex items-center gap-2 text-xs md:text-sm font-normal text-[#2c5325] whitespace-nowrap"
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

              <div className="flex-shrink-0">
                {packetDetails.testReport ? (
                  <Button
                    className="w-full bg-[#2C5325] hover:bg-[#1E3B19] text-white py-5 px-4 rounded-lg text-sm md:text-base font-bold shadow-sm transition-all active:scale-[0.98] flex items-center justify-between gap-2"
                    onClick={() => window.open(packetDetails.testReport!, "_blank")}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 md:w-6 md:h-6 text-white/90 flex-shrink-0" strokeWidth={2.25} />
                      <span>View Batch Lab Test Report</span>
                    </div>
                    <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                ) : (
                  <div
                    className="w-full bg-[#94B890] rounded-lg py-5 px-4 flex items-center justify-center gap-3 shadow-sm"
                    role="status"
                    aria-live="polite"
                  >
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6 text-white flex-shrink-0"
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
                    <span className="text-white font-bold text-sm md:text-base tracking-wide">
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
      className="w-4 h-4 flex-shrink-0 text-[#2c5325]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
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
      <div className="flex-shrink-0 bg-[#faf9f4] border border-gray-100 rounded-xl p-4 md:p-5 min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 items-center divide-y sm:divide-y-0 xl:divide-x divide-gray-200/80">
          <div className="flex items-center gap-3 py-3 sm:py-0 sm:px-3 xl:px-4 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#2c5325]/10 flex items-center justify-center text-[#2c5325]">
              <TestTube2 className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <span className="font-display text-sm md:text-base font-bold text-[#2c5325] leading-snug min-w-0">
              Every Bottle<br />Lab Tested
            </span>
          </div>

          <div className="flex items-center gap-3 py-3 sm:py-0 sm:px-3 xl:px-4 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#2c5325]/10 flex items-center justify-center text-[#2c5325]">
              <FlaskConical className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <span className="font-display text-sm md:text-base font-bold text-[#2c5325] leading-snug min-w-0">
              No Added<br />Chemicals
            </span>
          </div>

          <div className="flex items-center gap-3 py-3 sm:py-0 sm:px-3 xl:px-4 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#2c5325]/10 flex items-center justify-center text-[#2c5325]">
              <Leaf className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <span className="font-display text-sm md:text-base font-bold text-[#2c5325] leading-snug min-w-0">
              Pure. Natural.<br />Trustworthy.
            </span>
          </div>

          <div className="flex items-center gap-3 py-3 sm:py-0 sm:px-3 xl:px-4 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#2c5325]/10 flex items-center justify-center text-[#2c5325]">
              <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <span className="font-display text-sm md:text-base font-bold text-[#2c5325] leading-snug min-w-0">
              Trust isn&apos;t claimed.<br />It&apos;s proven.
            </span>
          </div>
        </div>
      </div>

      <p className="font-sans text-xs md:text-sm lg:text-base font-light text-[#2c5325]/90 text-center mt-4 leading-snug">
        Thank you for choosing UniVillage Agro.
      </p>
    </>
  );
}
