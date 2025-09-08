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
import { Input } from "@/components/ui/input";
import {
  fetchProductCategories,
  addProduct,
} from "../../../firebase/firebaseUtil"; // Adjust path as needed
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

interface ProductCategory {
  id: string;
  productName?: string;
  productDetails?: string;
  productImage?: string;
}

export default function AdminPanel() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(
    []
  ); // Hold fetched categories
  const [loading, setLoading] = useState(false); // For submit button loading state
  const [error, setError] = useState<string | null>(null); // Error handling
  
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    if (!authLoading) {
      if (!user || userRole !== 'admin') {
        toast.error("Access denied. Admin authentication required.");
        router.push("/login");
      }
    }
  }, [user, userRole, authLoading, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render
  if (!user || userRole !== 'admin') {
    return null;
  }

  useEffect(() => {
    // Fetch product categories when the component mounts
    const loadCategories = async () => {
      const categories = await fetchProductCategories();
      setProductCategories(categories);
    };
    loadCategories();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProductImage(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null); // Reset error before submission
    try {
      // Call the addProduct function and pass necessary data
      const result = await addProduct(
        productName,
        productDetails,
        productImage
      );
      if (result.success) {
        // Reload categories after successful addition
        const categories = await fetchProductCategories();
        setProductCategories(categories);
        setIsDialogOpen(false);
        setProductName("");
        setProductDetails("");
        setProductImage(null);
      } else {
        setError(result.message); // Show error message
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] max-w-7xl pt-10 flex flex-col items-center">
      {/* Admin Header */}
      <div className="w-full flex justify-center items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {productCategories.map((category, index) => (
          <Link
            href={`/admin/${category.id}/create_batch`}
            key={index}
            className="w-48 h-48 bg-slate-300 flex flex-col items-center justify-center text-black rounded-md shadow-md"
          >
            <h3 className="font-bold text-lg">{category.productName}</h3>
            {/* <p className="text-sm">{category.productDetails}</p> */}
            {category.productImage && (
              <Image
                src={category.productImage}
                alt={category.productName || "Product Image"}
                width={100}
                height={100}
                className="w-32 h-32 object-cover mt-2"
              />
            )}
          </Link>
        ))}
      </div>

      <Button
        className="px-4 rounded-md fixed bottom-4 right-4"
        onClick={() => setIsDialogOpen(true)}
      >
        Add new Product
      </Button>

      {/* Dialog for adding a new product */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Enter product name"
              className="mb-4"
            />
            <Input
              value={productDetails}
              onChange={(e) => setProductDetails(e.target.value)}
              placeholder="Enter product details"
              className="mb-4"
            />
            <Input type="file" onChange={handleFileChange} className="mb-4" />
            {error && <p className="text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </Button>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
