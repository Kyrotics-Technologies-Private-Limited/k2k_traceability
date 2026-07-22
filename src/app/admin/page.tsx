"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  adminDeleteProduct,
  adminFetchProducts,
} from "@/lib/admin-client";
import type { ProductCategory } from "@/lib/admin-data/types";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { Package, Trash2 } from "lucide-react";
import Loader from "@/components/common/Loader";

export default function AdminPanel() {
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductCategory | null>(null);
  
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

  // Show loading while checking auth, fetching data, or submitting
  if (authLoading || dataLoading || loading) {
    return <Loader />;
  }

  // If not authenticated, don't render
  if (!user || userRole !== 'admin') {
    return null;
  }



  const handleDeleteClick = (e: React.MouseEvent, category: ProductCategory) => {
    e.preventDefault();
    e.stopPropagation();
    setProductToDelete(category);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete || !user) return;
    setLoading(true);
    try {
      const result = await adminDeleteProduct(user, productToDelete.id);
      if (result.ok) {
        toast.success(result.message || "Product deleted successfully");
        const categories = await adminFetchProducts(user);
        setProductCategories(categories);
        setIsDeleteConfirmOpen(false);
        setProductToDelete(null);
      } else {
        toast.error("Failed to delete product");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 border-gray-200 text-red-600 hover:text-red-700 hover:bg-red-50/50 flex items-center gap-1.5"
                          onClick={(e) => handleDeleteClick(e, category)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dialog for deleting a product */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-sm text-gray-700">
            <p>Are you sure you want to delete <strong>{productToDelete?.productName}</strong>?</p>
            <p className="mt-2 text-xs text-red-600 font-semibold">This action cannot be undone. The product will be permanently removed. It will fail if there are active batches associated with this product.</p>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
