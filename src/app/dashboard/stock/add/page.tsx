"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { StockService } from "../../../../services/stockService";
import { StockItem } from "../../../../types/marketplace";

export default function AddStockPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    productCode: "",
    quantity: "",
    images: [] as File[],
  });  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (
      !formData.name ||
      !formData.description ||
      !formData.price ||
      !formData.quantity
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = "/images/placeholders/t-shirt.svg"; // Default placeholder

      // Upload image if provided
      if (formData.images.length > 0) {
        try {
          imageUrl = await StockService.uploadImage(formData.images[0], 'stock/admin-products');
          toast.success("Image uploaded successfully!");
        } catch (error) {
          console.error("Image upload failed:", error);
          toast.error("Image upload failed, using placeholder");
        }
      }

      // Create new stock item for Firestore
      const newStockItem: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'> = {
        productId: `admin-${Date.now()}`, // Generate unique product ID
        productCode: formData.productCode || `PROD-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.quantity),
        image: imageUrl,
        category: 'general',
        listed: true,
        sellerId: 'admin',
        sellerName: 'TikTok Shop Admin'
      };

      // Add to Firestore
      await StockService.addStockItem(newStockItem);

      // Show success message
      toast.success("Product added successfully and is now available for sellers!");

      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        productCode: "",
        quantity: "",
        images: [],
      });

      // Redirect back to stock listing page
      router.push("/dashboard/stock");
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        images: Array.from(e.target.files || []),
      }));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-2xl font-semibold">John Doe</h1>
          <span className="px-2 py-1 text-sm bg-gray-200 rounded">ref002</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-8">
          <Link
            href="/dashboard/stock"
            className="px-1 py-4 text-gray-500 hover:text-gray-700"
          >
            Stock
          </Link>
          <Link
            href="/dashboard/stock/add"
            className="px-1 py-4 text-pink-500 border-b-2 border-pink-500"
          >
            List a Stock
          </Link>
        </nav>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-lg font-medium mb-4">Basic details</h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Product Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-4">Images</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
            <div className="text-center">
              <input
                type="file"
                id="images"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label
                htmlFor="images"
                className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700"
              >
                Click to upload or drag and drop
              </label>
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
            {formData.images.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-4">
                {formData.images.map((file, index) => (
                  <div
                    key={index}
                    className="relative aspect-square bg-gray-100 rounded-lg"
                  >                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-4">Pricing</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700"
              >
                Price ($)
              </label>
              <input
                type="number"
                id="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="productCode"
                className="block text-sm font-medium text-gray-700"
              >
                Product code
              </label>
              <input
                type="text"
                id="productCode"
                value={formData.productCode}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    productCode: e.target.value,
                  }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700"
              >
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                min="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Link
            href="/dashboard/stock"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </Link>          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-pink-600 hover:bg-pink-700'
            }`}
          >
            {isSubmitting ? 'Adding Product...' : 'List'}
          </button>
        </div>
      </form>
    </div>
  );
}
