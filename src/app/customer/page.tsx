// "use client";

// import React, { useState } from "react";
// import { useRouter } from "next/navigation";

// const CustomerSearch = () => {
//   const [serialNo, setSerialNo] = useState<string>("");
//   const router = useRouter();

//   const handleSearch = () => {
//     if (serialNo.trim() === "") {
//       alert("Please enter a serial number.");
//       return;
//     }

//     // Redirect to the search results page with the serial number
//     router.push(`/customer/${serialNo}`);
//   };

//   return (
//     <div className="min-h-screen p-8 bg-gray-100">
//       <div className="mb-6">
//         <h1 className="text-3xl font-bold text-center text-gray-800">
//           Customer Search
//         </h1>
//       </div>

//       <div className="bg-white p-6 rounded shadow-md">
//         <div className="mb-4">
//           <label className="block mb-2">Enter Serial Number</label>
//           <input
//             type="text"
//             className="w-full p-2 border rounded"
//             value={serialNo}
//             onChange={(e) => setSerialNo(e.target.value)}
//             placeholder="Enter serial number"
//           />
//         </div>

//         <button
//           className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
//           onClick={handleSearch}
//         >
//           Search
//         </button>
//       </div>
//     </div>
//   );
// };

// export default CustomerSearch;


"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

const CustomerSearch = () => {
  const [serialNo, setSerialNo] = useState<string>("");
  const router = useRouter();

  const handleSearch = () => {
    if (serialNo.trim() === "") {
      alert("Please enter a serial number.");
      return;
    }
    router.push(`/customer/${serialNo}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-green-50 to-green-100 dark:from-green-900 dark:to-green-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNTQuNjI3IDQuMzczQzU2LjA0OSAyLjk1MSA1OC4zNzEgMi45NTEgNTkuNzkzIDQuMzczQzYxLjIxNSA1Ljc5NSA2MS4yMTUgOC4xMTcgNTkuNzkzIDkuNTM5TDU1LjQyIDEzLjkxMkM1My45OTggMTUuMzM0IDUxLjY3NiAxNS4zMzQgNTAuMjU0IDEzLjkxMkM0OC44MzIgMTIuNDkgNDguODMyIDEwLjE2OCA1MC4yNTQgOC43NDZMNTQ2MjcgNC4zNzN6TTMwIDMwQzMwIDEzLjQzMSA0My40MzEgMCAzMCAwQzE2LjU2OSAwIDMwIDEzLjQzMSAzMCAzMEMzMCA0Ni41NjkgMTYuNTY5IDYwIDMwIDYwQzQzLjQzMSA2MCAzMCA0Ni41NjkgMzAgMzB6IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')] opacity-10" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="flex justify-center mb-6">
            <Leaf className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-50">
            Natural Product Verification
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Verify the authenticity and quality of your natural grocery products
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
                  <p className="text-sm text-gray-600 dark:text-gray-300">Product Authenticity</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 dark:bg-green-800/50 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Batch Reports</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 dark:bg-green-800/50 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Quality Analysis</p>
                </div>
              </div>

              {/* Search Input */}
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type="text"
                    className="pl-4 pr-12 py-6 text-lg border-2 border-green-100 dark:border-green-800 focus:border-green-500 dark:focus:border-green-600"
                    value={serialNo}
                    onChange={(e) => setSerialNo(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter product serial number"
                  />
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                
                <Button 
                  onClick={handleSearch}
                  className="w-full py-6 text-lg bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 transition-colors duration-200"
                >
                  Verify Product
                </Button>
                
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  Enter the serial number found on your product packaging
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
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
        </div>
      </div>
    </div>
  );
};

export default CustomerSearch;