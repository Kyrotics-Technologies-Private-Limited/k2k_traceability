"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFetchProducts } from "@/lib/admin-client";
import type { ProductCategory } from "@/lib/admin-data/types";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { Package } from "lucide-react";
import Loader from "@/components/common/Loader";

export default function AdminPanel() {
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(
    []
  );
  const [dataLoading, setDataLoading] = useState(true);
  
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const loadCategories = async () => {
      try {
        setDataLoading(true);
        const categories = await adminFetchProducts(user);
        setProductCategories(categories);
      } finally {
        setDataLoading(false);
      }
    };
    loadCategories();
  }, [user]);

  // Check authentication
  useEffect(() => {
    if (!authLoading) {
      if (!user || userRole !== 'admin') {
        toast.error("Access denied. Admin authentication required.");
        router.push("/login");
      }
    }
  }, [user, userRole, authLoading, router]);

  // Show loading while checking auth or fetching data
  if (authLoading || dataLoading) {
    return <Loader />;
  }

  // If not authenticated, don't render
  if (!user || userRole !== 'admin') {
    return null;
  }

  return (
    <div className="h-[calc(100vh-100px)] max-w-7xl mx-auto pt-10 flex flex-col items-center">
      {/* Admin Header */}
      <div className="w-full flex justify-between items-center mb-8 px-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
      </div>
      
      <div className="w-full px-8 overflow-x-auto">
        <div className="min-w-full inline-block align-middle">
          <div className="border border-green-100 rounded-lg overflow-hidden shadow-sm bg-white/90 backdrop-blur-sm">
            <table className="min-w-full divide-y divide-green-100">
              <thead className="bg-green-50/80">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Product Image
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Product ID / Number
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total Batches
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-100 bg-white/90">
                {productCategories.map((category, index) => (
                  <tr key={category.id || index} className="hover:bg-green-50/60 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex-shrink-0 h-16 w-16 relative overflow-hidden rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center p-1">
                        {category.productImage && typeof category.productImage === 'string' && category.productImage.startsWith('http') ? (
                          <Image
                            src={category.productImage}
                            alt={category.productName || "Product Image"}
                            width={64}
                            height={64}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={category.id ? `/admin/${category.id}/create_batch` : "#"}
                        className="text-sm font-semibold text-green-600 hover:text-green-800 transition-colors uppercase tracking-wide"
                      >
                        {category.productName || "Unnamed Product"}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded">
                        {category.productCategoryId || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {category.batchCount ?? 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
