"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { StockService } from "../../../../../services/stockService";
import { StockItem } from "../../../../../types/marketplace";
import { LoadingSpinner } from "../../../../components/Loading";
import { AdminRoute } from "../../../../components/AdminRoute";

const calculateSalePrice = (price: string, isSale: boolean, salePercentage: string) => {
  if (!isSale || !salePercentage || !price) return 0;
  const basePrice = parseFloat(price);
  const percentage = parseFloat(salePercentage);
  if (isNaN(basePrice) || isNaN(percentage) || percentage <= 0 || percentage >= 100) return 0;
  return basePrice * (1 - percentage / 100);
};

export default function EditStockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <AdminRoute>
      <EditStockPageContent params={params} />
    </AdminRoute>
  );
}

function EditStockPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<StockItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    features: "",
    price: "0",
    productCode: "",
    stock: "0",
    category: "general",
    rating: "0",
    reviews: "0",
    isSale: false,
    salePercentage: "0",
    images: [] as File[],
    existingImages: [] as string[],
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const fetchedProduct = await StockService.getStockItem(
          resolvedParams.id
        );
        if (!fetchedProduct) {
          toast.error("Product not found");
          router.push("/dashboard/stock");
          return;
        }        setProduct(fetchedProduct);
        setFormData({
          name: fetchedProduct.name,
          description: fetchedProduct.description,
          features: fetchedProduct.features || "",
          price: fetchedProduct.price.toString(),
          productCode: fetchedProduct.productCode || "",
          stock: fetchedProduct.stock.toString(),
          category: fetchedProduct.category || "general",
          rating: fetchedProduct.rating?.toString() || "0",
          reviews: fetchedProduct.reviews?.toString() || "0",
          isSale: fetchedProduct.isSale || false,
          salePercentage: fetchedProduct.salePercentage?.toString() || "0",
          images: [],
          existingImages: fetchedProduct.images || [],
        });
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };    fetchProduct();
  }, [resolvedParams.id, router]);

  // Create image preview URLs when files change
  useEffect(() => {
    const urls: string[] = [];
    formData.images.forEach((file) => {
      if (file instanceof File && file.size > 0 && file.type.startsWith('image/')) {
        try {
          const url = URL.createObjectURL(file);
          urls.push(url);
        } catch (error) {
          console.warn('Failed to create object URL for file:', error);
          urls.push('');
        }
      } else {
        urls.push('');
      }
    });
    
    // Cleanup old URLs before setting new ones
    setImagePreviewUrls(prevUrls => {
      prevUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
      return urls;
    });
    
    // Cleanup on unmount
    return () => {
      urls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [formData.images]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const salePrice = formData.isSale ? calculateSalePrice(formData.price, formData.isSale, formData.salePercentage) : 0;
    
    if (!formData.name || !formData.description || !formData.price || !formData.stock || isNaN(parseFloat(formData.price)) || isNaN(parseInt(formData.stock))) {
      toast.error("Please fill in all required fields with valid values");
      return;
    }

    try {
      setIsSubmitting(true);
      
      let finalImages = [...formData.existingImages];
      
      // Upload new images if any
      if (formData.images.length > 0) {
        try {
          const imageUrls: string[] = [];
          for (const image of formData.images) {
            const imageUrl = await StockService.uploadImage(image, 'stock/admin-products');
            imageUrls.push(imageUrl);
          }
          finalImages = [...finalImages, ...imageUrls];
          toast.success("New images uploaded successfully!");
        } catch (error) {
          console.error("Image upload failed:", error);
          toast.error("Image upload failed, keeping existing images");
        }
      }

      const updatedProduct: StockItem = {
        ...product,
        name: formData.name,
        description: formData.description,
        features: formData.features,        price: parseFloat(formData.price),
        productCode: formData.productCode || product.productCode,
        stock: parseInt(formData.stock),
        category: formData.category,
        rating: parseFloat(formData.rating) || 0,
        reviews: Array.isArray(product.reviews) ? product.reviews : [], // Keep existing reviews array
        isSale: formData.isSale,
        salePercentage: parseFloat(formData.salePercentage),
        salePrice: salePrice,
        images: finalImages,
        mainImage: finalImages[0] || product.mainImage,
        updatedAt: new Date(),
      };

      await StockService.updateStockItem(product.id!, updatedProduct);
      toast.success("Product updated successfully");
      router.push("/dashboard/stock");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");    } finally {
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

  const handleSalePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseFloat(value);
    
    if (value === "" || (numValue >= 0 && numValue <= 100)) {
      setFormData(prev => ({
        ...prev,
        salePercentage: value
      }));
    }
  };

  const removeExistingImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      existingImages: prev.existingImages.filter((_, i) => i !== index)
    }));
  };

  const removeNewImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const setMainExistingImage = (index: number) => {
    if (index !== 0) {
      const newImages = [...formData.existingImages];
      [newImages[0], newImages[index]] = [newImages[index], newImages[0]];
      setFormData(prev => ({
        ...prev,
        existingImages: newImages
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return null;
  }
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Product</h1>
          <Link
            href="/dashboard/stock"
            className="text-gray-600 hover:text-gray-900"
          >
            Back to Stock
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-lg font-medium mb-4">Basic details</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Product Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                required
              />
            </div>

            <div>
              <label htmlFor="features" className="block text-sm font-medium text-gray-700">
                Product Features
              </label>
              <textarea
                id="features"
                rows={3}
                value={formData.features}
                onChange={(e) => setFormData((prev) => ({ ...prev, features: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                placeholder="List the key features of your product. Each feature on a new line."
              />
              <p className="mt-1 text-sm text-gray-500">
                Add each feature on a new line. These will be displayed as bullet points on the product page.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-4">Images</h2>
          
          {/* Existing Images */}
          {formData.existingImages.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Current Images</h3>
              <div className="grid grid-cols-4 gap-4">
                {formData.existingImages.map((imageUrl, index) => (
                  <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                    <Image
                      src={imageUrl}
                      alt={`Current image ${index + 1}`}
                      fill
                      className="object-cover"
                    />

                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        Main Image
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {index !== 0 && (
                      <button
                        type="button"
                        onClick={() => setMainExistingImage(index)}
                        className="absolute bottom-2 right-2 bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600"
                        title="Set as main image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Images */}
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
                Add New Images
              </label>
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, GIF up to 10MB (will be added to existing images)
              </p>
            </div>

            {formData.images.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  {formData.images.length} new image{formData.images.length > 1 ? 's' : ''} selected
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {formData.images.map((file, index) => {
                    const previewUrl = imagePreviewUrls[index] || '';
                    
                    return (
                      <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                        {previewUrl ? (
                          <Image
                            src={previewUrl}
                            alt={`New preview ${index + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-4">Pricing & Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Price ($)
              </label>
              <input
                type="number"
                id="price"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                required
              />
            </div>

            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                Stock Quantity
              </label>
              <input
                type="number"
                id="stock"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData((prev) => ({ ...prev, stock: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="clothing">Clothing</option>
                <option value="electronics">Electronics</option>
                <option value="home">Home & Kitchen</option>
                <option value="beauty">Beauty</option>
                <option value="toys">Toys & Games</option>
                <option value="books">Books</option>
                <option value="accessories">Accessories</option>
                <option value="sports">Sports</option>
                <option value="liquor">Liquor</option>
                <option value="gym">Gym</option>
                <option value="sex">Sex</option>
                <option value="makeup">Makeup</option>
                <option value="luxury">Luxury</option>
                <option value="general">General</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="productCode" className="block text-sm font-medium text-gray-700">
                Product Code
              </label>
              <input
                type="text"
                id="productCode"
                value={formData.productCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, productCode: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                placeholder="Product code"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-4">Product Rating & Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
                Product Rating (0-5)
              </label>
              <input
                type="number"
                id="rating"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={(e) => setFormData((prev) => ({ ...prev, rating: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            <div>
              <label htmlFor="reviews" className="block text-sm font-medium text-gray-700">
                Number of Reviews
              </label>
              <input
                type="number"
                id="reviews"
                min="0"
                value={formData.reviews}
                onChange={(e) => setFormData((prev) => ({ ...prev, reviews: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-4">Sale Configuration</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isSale"
                checked={formData.isSale}
                onChange={(e) => setFormData((prev) => ({ ...prev, isSale: e.target.checked }))}
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <label htmlFor="isSale" className="ml-2 block text-sm text-gray-900">
                This product is on sale
              </label>
            </div>

            {formData.isSale && (
              <div className="ml-6 space-y-4">
                <div>
                  <label htmlFor="salePercentage" className="block text-sm font-medium text-gray-700">
                    Sale Percentage (0-100%)
                  </label>
                  <input
                    type="number"
                    id="salePercentage"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.salePercentage}
                    onChange={handleSalePercentageChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    placeholder="Enter discount percentage"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter a value between 0 and 100
                  </p>
                </div>

                {formData.price && formData.salePercentage && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      <span className="font-medium">Sale Price Preview:</span> $
                      {calculateSalePrice(formData.price, formData.isSale, formData.salePercentage).toFixed(2)}
                      {" "}
                      <span className="text-green-600">
                        ({formData.salePercentage}% off from ${parseFloat(formData.price || "0").toFixed(2)})
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href="/dashboard/stock"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-pink-300"
          >
            {isSubmitting ? "Updating Product..." : "Update Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
