"use client";

import { CustomerVerificationLoading } from "@/components/customer/CustomerVerificationLoading";
import { CustomerVerificationResult } from "@/components/customer/CustomerVerificationResult";
import { useCustomerSerialDetails } from "@/components/customer/useCustomerSerialDetails";

export default function SearchResult({ params }: { params: { serialNo: string } }) {
  const { serialNo } = params;
  const { packetDetails, loading } = useCustomerSerialDetails(serialNo);

  if (loading) {
    return <CustomerVerificationLoading />;
  }

  if (!packetDetails) {
    return null;
  }

  return <CustomerVerificationResult serialNo={serialNo} packetDetails={packetDetails} />;
}
