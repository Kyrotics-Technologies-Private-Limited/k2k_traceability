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
  updateProduct,
} from "../../../firebase/firebaseUtil"; // Adjust path as needed
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { Package, Pencil } from "lucide-react";
import Loader from "@/components/Loader";

interface ProductCategory {
  id: string;
  productName?: string;
  productDetails?: string;
  description?: string;
  productImage?: string;
}

export default function AdminPanel() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [description, setDescription] = useState("");
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(
    []
  ); // Hold fetched categories
  const [loading, setLoading] = useState(false); // For submit button loading state
  const [dataLoading, setDataLoading] = useState(true); // For data fetching state
  const [error, setError] = useState<string | null>(null); // Error handling
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductCategory | null>(null);
  const [editProductName, setEditProductName] = useState("");
  const [editProductDetails, setEditProductDetails] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editProductImage, setEditProductImage] = useState<File | string | null>(null);
  
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Fetch product categories when the component mounts
    const loadCategories = async () => {
      try {
        setDataLoading(true);
        const categories = await fetchProductCategories();
        setProductCategories(categories);
      } finally {
        setDataLoading(false);
      }
    };
    loadCategories();
  }, []);

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

  const handleEditClick = (e: React.MouseEvent, category: ProductCategory) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProduct(category);
    setEditProductName(category.productName || "");
    setEditProductDetails(category.productDetails || "");
    setEditDescription(category.description || "");
    setEditProductImage(category.productImage || null);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    setError(null);
    try {
      const result = await updateProduct(
        selectedProduct.id,
        editProductName,
        editProductDetails,
        editDescription,
        editProductImage
      );
      if (result.success) {
        const categories = await fetchProductCategories();
        setProductCategories(categories);
        setIsEditDialogOpen(false);
        toast.success("Product updated successfully");
      } else {
        setError(result.message);
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
      <div className="w-full flex justify-between items-center mb-8 px-8">
        {/* <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Button> */}
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Admin Panel</h1>
        <div className="w-24"></div> {/* Spacer for alignment */}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4">
        {productCategories.map((category, index) => (
          <Link
            href={category.id ? `/admin/${category.id}/create_batch` : "#"}
            key={category.id || index}
            className="w-full aspect-square bg-white border border-gray-200 flex flex-col items-center justify-center text-black rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 group"
          >
            <div className="w-full h-3/4 flex items-center justify-center mb-2 overflow-hidden rounded-lg bg-gray-50">
              {category.productImage && typeof category.productImage === 'string' && category.productImage.startsWith('http') ? (
                <Image
                  src={category.productImage}
                  alt={category.productName || "Product Image"}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <Package className="w-12 h-12 mb-2" />
                  <span className="text-xs">No Image</span>
                </div>
              )}
            </div>
            <h3 className="font-semibold text-sm text-center line-clamp-1 text-gray-800 tracking-wide uppercase mb-1">{category.productName || "Unnamed Product"}</h3>

            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white"
              onClick={(e) => handleEditClick(e, category)}
            >
              <Pencil className="w-4 h-4 text-blue-600" />
            </Button>
          </Link>
        ))}
      </div>

      <Button
        size="sm"
        className="px-4 rounded-md fixed bottom-4 right-4 text-xs font-medium shadow-lg hover:shadow-xl transition-all"
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
            {/* <Input
              value={productDetails}
              onChange={(e) => setProductDetails(e.target.value)}
              placeholder="Enter product short details"
              className="mb-4"
            /> */}
            {/* <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter full product description"
              className="mb-4"
            /> */}
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

      {/* Dialog for editing a product */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <Input
              value={editProductName}
              onChange={(e) => setEditProductName(e.target.value)}
              placeholder="Enter product name"
              className="mb-4"
            />
            <Input
              value={editProductDetails}
              onChange={(e) => setEditProductDetails(e.target.value)}
              placeholder="Enter product short details"
              className="mb-4"
            />
            <Input
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Enter full product description"
              className="mb-4"
            />
            <Input 
              type="file" 
              onChange={(e) => e.target.files && setEditProductImage(e.target.files[0])} 
              className="mb-4" 
            />
            {error && <p className="text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? "Updating..." : "Update"}
            </Button>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
