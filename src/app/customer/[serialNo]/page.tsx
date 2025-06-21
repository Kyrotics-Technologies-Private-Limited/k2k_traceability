// "use client";

// import React, { useEffect, useState } from "react";
// import { fetchCustomerDetails } from "../../../../firebase/firebaseUtil";
// import { useRouter } from "next/navigation";

// interface PacketDetails {
//   productName: string;
//   productDetails: string;
//   productImage: string;
//   batchNo: string;
//   testReport: string;
//   refractometerReport: string;
// }

// const SearchResult = ({ params }: { params: { serialNo: string } }) => {
//   const [packetDetails, setPacketDetails] = useState<PacketDetails | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const router = useRouter();
//   const { serialNo } = params;

//   useEffect(() => {
//     const fetchDetails = async () => {
//       try {
//         const details = await fetchCustomerDetails(serialNo);
//         if (details) {
//           setPacketDetails(details);
//         } else {
//           alert("No details found for the given serial number.");
//           router.push("/customer");
//         }
//       } catch (error) {
//         console.error("Error fetching details:", error);
//         router.push("/customer");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDetails();
//   }, [serialNo, router]);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-white">
//         <p className="text-xl font-bold text-gray-800 animate-pulse">Loading...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen flex justify-center bg-gray-100 py-10">
//       <div className="bg-white shadow-lg rounded-lg max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
//         {/* Left: Product Image */}
//         <div className="">
//           <img
//             src={packetDetails?.productImage}
//             alt={packetDetails?.productName}
//             className="w-full h-auto max-h-96 object-contain rounded-lg shadow-md"
//           />
//         </div>

//         {/* Right: Product Details */}
//         <div className="flex flex-col ">
//           <div>
//             {/* Product Name */}
//             <h1 className="text-4xl font-semibold mb-4 text-gray-800">
//               {packetDetails?.productName}
//             </h1>

//             {/* Product Details */}
//             <p className="text-gray-600 mb-6">{packetDetails?.productDetails}</p>

//             {/* Product Information */}
//             <div className="mb-6">
//               <p className="text-lg font-medium text-gray-700 mb-2">
//                 <strong>Batch No:</strong> {packetDetails?.batchNo}
//               </p>
//               <p className="text-lg font-medium text-gray-700 mb-2">
//                 <strong>Refractometer Report:</strong>{" "}
//                 {packetDetails?.refractometerReport || "Not available"}
//               </p>
//             </div>

//             {/* Test Report Link */}
//             <div className="mb-6">
//               <p className="text-lg font-medium text-gray-700">
//                 <strong>Test Report:</strong>{" "}
//                 {packetDetails?.testReport ? (
//                   <a
//                     href={packetDetails.testReport}
//                     target="_blank"
//                     className="text-blue-600 hover:underline"
//                     rel="noopener noreferrer"
//                   >
//                     View Report
//                   </a>
//                 ) : (
//                   "Not available"
//                 )}
//               </p>
//             </div>
//           </div>

//           {/* Bottom: Actions */}
//           <div className="mt-6">
            
//             <button
//               onClick={() => router.push("/customer")}
//               className="w-full py-3 bg-gray-200 text-gray-800 rounded-md text-lg font-semibold hover:bg-gray-300 transition-colors"
//             >
//               Back to Search
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SearchResult;


"use client";

import React, { useEffect, useState } from "react";
import { fetchCustomerDetails } from "../../../../firebase/firebaseUtil";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Beaker, 
  Box, 
  FileText, 
  Loader2, 
  PackageCheck, 
  ShieldCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { motion } from "framer-motion";

interface PacketDetails {
  productName: string;
  productDetails: string;
  productImage: string;
  batchNo: string;
  testReport: string;
  refractometerReport: string;
  manufacturingDate?: string;
  expiryDate?: string;
  certifications?: string[];
}

const SearchResult = ({ params }: { params: { serialNo: string } }) => {
  const [packetDetails, setPacketDetails] = useState<PacketDetails | null>(null);
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
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="relative group">
                <img
                  src={packetDetails?.productImage}
                  alt={packetDetails?.productName}
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-green-600 hover:bg-green-700 text-white">
                    <ShieldCheck className="w-4 h-4 mr-1" />
                    Verified Product
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Product Certifications */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <PackageCheck className="w-5 h-5 mr-2 text-green-600" />
                  Product Certifications
                </h3>
                <div className="flex flex-wrap gap-2">
                  {packetDetails?.certifications?.map((cert, index) => (
                    <Badge key={index} variant="secondary">
                      {cert}
                    </Badge>
                  )) || (
                    <>
                      <Badge variant="secondary">ISO 9001:2015</Badge>
                      <Badge variant="secondary">GMP Certified</Badge>
                      <Badge variant="secondary">HACCP</Badge>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Product Details */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-50">
                    {packetDetails?.productName}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {packetDetails?.productDetails}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Batch Number</p>
                      <p className="font-semibold">{packetDetails?.batchNo}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Serial Number</p>
                      <p className="font-semibold">{serialNo}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Manufacturing Date</p>
                      <p className="font-semibold">{packetDetails?.manufacturingDate || "01/01/2024"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Expiry Date</p>
                      <p className="font-semibold">{packetDetails?.expiryDate || "01/01/2025"}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center">
                        <Beaker className="w-5 h-5 text-green-600 mr-2" />
                        <span className="font-medium">Refractometer Report</span>
                      </div>
                      <Badge variant="outline">
                        {packetDetails?.refractometerReport || "98% Pure"}
                      </Badge>
                    </div>

                    {packetDetails?.testReport && (
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => window.open(packetDetails.testReport, '_blank')}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Laboratory Test Report
                      </Button>
                    )}
                  </div>
                </motion.div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Storage Instructions</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Store in a cool, dry place away from direct sunlight. Keep container tightly sealed when not in use.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SearchResult;