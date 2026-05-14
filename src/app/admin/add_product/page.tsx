"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
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
  ProductCategory,
} from "../../../../firebase/firebaseUtil"; // Adjust path as needed
import Image from "next/image";
import { Package } from "lucide-react";
import Loader from "@/components/Loader";

// Interface is now imported from firebaseUtil

export default function ProductPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [description, setDescription] = useState("");
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(
    []
  ); // Hold fetched categories
  const [loading, setLoading] = useState(false); // For submit button loading state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Error handling

  useEffect(() => {
    // Fetch product categories when the component mounts
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        const categories = await fetchProductCategories();
        setProductCategories(categories);
      } finally {
        setIsLoading(false);
      }
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
        description,
        productImage
      );
      if (result.success) {
        // Reload categories after successful addition
        const categories = await fetchProductCategories();
        setProductCategories(categories);
        setIsDialogOpen(false);
        setProductName("");
        setProductDetails("");
        setDescription("");
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

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="h-[calc(100vh-100px)] w-full flex flex-col items-center">
      <div className="grid grid-cols-4 gap-4">
        {productCategories.map((category, index) => (
          <Link
            href={category.id ? `/admin/${category.id}/create_batch` : "#"}
            key={category.id || index}
            className="w-full aspect-square bg-white border border-gray-200 flex flex-col items-center justify-center text-black rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 group relative"
          >
            <div className="w-full h-1/2 flex items-center justify-center mb-2 overflow-hidden rounded-lg bg-gray-50">
              {category.productImage && typeof category.productImage === 'string' && category.productImage.startsWith('http') ? (
                <Image
                  src={category.productImage}
                  alt={category.productName || "Product Image"}
                  width={150}
                  height={150}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <Package className="w-8 h-8 mb-1" />
                  <span className="text-[10px]">No Image</span>
                </div>
              )}
            </div>
            <h3 className="font-bold text-xs text-center line-clamp-1 mb-1">{category.productName}</h3>
            <p className="text-[10px] text-gray-500 line-clamp-2 text-center px-1 mb-1 italic">
              {category.description}
            </p>
            <p className="text-[10px] text-gray-400 line-clamp-1 text-center px-1">
              {category.productDetails}
            </p>
            <p className="absolute bottom-2 right-2 text-[8px] text-gray-300 font-mono">
              {category.productCategoryId}
            </p>
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
              placeholder="Enter product short details"
              className="mb-4"
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter full product description"
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
