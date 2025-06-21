


// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";

// export default function ProductPage() {
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [productName, setProductName] = useState("");
//   const [productDetails, setProductDetails] = useState("");
//   const [productImage, setProductImage] = useState<File | null>(null);

//   const productCategories = ["Oil", "Honey", "Ghee", "Salt", "Sugar", "Rice",];

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files) {
//       setProductImage(e.target.files[0]);
//     }
//   };

//   const handleSubmit = () => {
//     // Handle form submission
//     console.log({
//       productName,
//       productDetails,
//       productImage,
//     });
//     setIsDialogOpen(false);
//   };

//   return (
//     <div className="h-[calc(100vh-100px)] w-full flex flex-col items-center">
//       <div className="grid grid-cols-4 gap-4">
//         {productCategories.map((category, index) => (
//           <div
//             key={index}
//             className="w-24 h-24 bg-slate-300 flex items-center justify-center text-black rounded-md"
//           >
//             {category}
//           </div>
//         ))}
//       </div>

      
//       <Button
//         className="px-4 rounded-md fixed bottom-4 right-4"
//         onClick={() => setIsDialogOpen(true)}
//       >
//         Add new Product
//       </Button>
      

//       {/* Dialog for adding a new product */}
//       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Add New Product</DialogTitle>
//           </DialogHeader>
//           <div className="p-4">
//             <Input
//               value={productName}
//               onChange={(e) => setProductName(e.target.value)}
//               placeholder="Enter product name"
//               className="mb-4"
//             />
//             <Input
//               value={productDetails}
//               onChange={(e) => setProductDetails(e.target.value)}
//               placeholder="Enter product details"
//               className="mb-4"
//             />
//             <Input
//               type="file"
//               onChange={handleFileChange}
//               className="mb-4"
//             />
//           </div>
//           <DialogFooter>
//             <Button onClick={handleSubmit}>Submit</Button>
//             <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
//               Cancel
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fetchProductCategories, addProduct } from '../../../../firebase/firebaseUtil'; // Adjust path as needed

export default function ProductPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productCategories, setProductCategories] = useState<any[]>([]);  // Hold fetched categories
  const [loading, setLoading] = useState(false);  // For submit button loading state
  const [error, setError] = useState<string | null>(null);  // Error handling

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
    setError(null);  // Reset error before submission
    try {
      // Call the addProduct function and pass necessary data
      const result = await addProduct(productName, productDetails, productImage);
      if (result.success) {
        // Reload categories after successful addition
        const categories = await fetchProductCategories();
        setProductCategories(categories);
        setIsDialogOpen(false);
        setProductName("");
        setProductDetails("");
        setProductImage(null);
      } else {
        setError(result.message);  // Show error message
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] w-full flex flex-col items-center">
      <div className="grid grid-cols-4 gap-4" >
        
        {productCategories.map((category, index) => (
          <Link
            href = '/admin/create_batch'
            key={index}
            className="w-48 h-48 bg-slate-300 flex flex-col items-center justify-center text-black rounded-md shadow-md"
          >
            <h3 className="font-bold text-lg">{category.productName}</h3>
            <p className="text-sm">{category.productDetails}</p>
            {category.productImage && (
              <img
                src={category.productImage}
                alt={category.productName}
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
            <Input
              type="file"
              onChange={handleFileChange}
              className="mb-4"
            />
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