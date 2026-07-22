"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface CustomerPacketDetails {
  productName: string;
  productDetails: string;
  description?: string;
  productImage: string;
  batchNo: string;
  testReport: string;
  refractometerReport: string;
  manufacturingDate?: string;
  expiryDate?: string;
}

export function useCustomerSerialDetails(serialNo: string) {
  const router = useRouter();
  const [packetDetails, setPacketDetails] = useState<CustomerPacketDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const apiResponse = await fetch(
          `/api/customer/resolve-serial?s=${encodeURIComponent(serialNo)}`,
          { cache: "no-store" }
        );

        if (apiResponse.ok) {
          const body = await apiResponse.json();
          const details = body.data as {
            productName?: string;
            productDetails?: string;
            description?: string;
            productImage?: string;
            batchNo?: string;
            testReport?: string;
            refractometerReport?: string;
          };

          setPacketDetails({
            productName: details.productName ?? "",
            productDetails: details.productDetails ?? "",
            description: details.description,
            productImage: details.productImage ?? "",
            batchNo: details.batchNo ?? "",
            testReport: details.testReport ?? "",
            refractometerReport: details.refractometerReport ?? "",
          });
          return;
        }

        if (apiResponse.status === 404) {
          router.push("/customer?error=not-found");
          return;
        }

        router.push("/customer?error=fetch-failed");
      } catch (error) {
        console.error("Error fetching details:", error);
        router.push("/customer?error=fetch-failed");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [serialNo, router]);

  return { packetDetails, loading };
}
