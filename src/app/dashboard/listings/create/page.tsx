"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import { ProductService } from "../../../../services/productService";
import { Product } from "../../../../types/product";
import { LoadingSpinner } from "../../../components/Loading";
import toast from "react-hot-toast";
import Image from "next/image";

export default function CreateProductPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [product, setProduct] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category: "other",
    image: "",
    listed: false,
    productCode: "",
    rating: 0,
    reviews: 0,
  });

  // Redirect non-sellers
  useEffect(() => {
    if (!authLoading && user) {
      if (userProfile?.role !== "seller" && userProfile?.role !== "admin") {
        toast.error("You do not have permission to create products");
        router.push("/dashboard");
      }
    } else if (!authLoading && !user) {
      router.push("/login?redirect=/dashboard/listings/create");
    }
  }, [user, userProfile, authLoading, router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "price" || name === "stock") {
      setProduct({ ...product, [name]: parseFloat(value) || 0 });
    } else {
      setProduct({ ...product, [name]: value });
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    setFileLoading(true);

    try {
      // Create a temporary preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Generate a temporary product ID for the image upload
      const tempId = `temp_${Date.now()}`;

      // Upload the image to Firebase Storage
      const imageUrl = await ProductService.uploadProductImage(file, tempId);

      // Update product state with the image URL
      setProduct({ ...product, image: imageUrl });
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setFileLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user || !userProfile) {
      toast.error("You must be logged in to create products");
      return;
    }

    if (!product.name || !product.description || !product.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!product.productCode) {
      // Generate a random product code if not provided
      const randomCode = `SKU-${Math.floor(Math.random() * 10000)}`;
      setProduct({ ...product, productCode: randomCode });
    }

    setLoading(true);

    try {
      // Add seller info to the product
      const completeProduct = {
        ...product,
        sellerId: user.uid,
        sellerName: userProfile.displayName || user.email || "Unknown Seller",
      } as Omit<Product, "id">;

      // Save to Firestore
      await ProductService.createProduct(completeProduct);
      toast.success("Product created successfully!");

      // Redirect to product listings
      router.push("/dashboard/listings");
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Create New Product
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white shadow-sm rounded-lg p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Product Name*
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={product.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            />
          </div>

          <div>
            <label
              htmlFor="productCode"
              className="block text-sm font-medium text-gray-700"
            >
              Product Code (SKU)
            </label>
            <input
              type="text"
              id="productCode"
              name="productCode"
              value={product.productCode}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              placeholder="SKU-12345"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description*
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              required
              value={product.description}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            />
          </div>

          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700"
            >
              Price ($)*
            </label>
            <input
              type="number"
              id="price"
              name="price"
              min="0"
              step="0.01"
              required
              value={product.price}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            />
          </div>

          <div>
            <label
              htmlFor="stock"
              className="block text-sm font-medium text-gray-700"
            >
              Stock Quantity*
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              min="0"
              required
              value={product.stock}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700"
            >
              Category
            </label>            <select
              id="category"
              name="category"
              value={product.category}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
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

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="listed"
              name="listed"
              checked={product.listed}
              onChange={(e) =>
                setProduct({ ...product, listed: e.target.checked })
              }
              className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
            />
            <label
              htmlFor="listed"
              className="text-sm font-medium text-gray-700"
            >
              List product immediately (make visible to customers)
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product Image
          </label>

          <div className="mt-1 flex items-center space-x-6">
            <div className="w-32 h-32 border border-gray-300 rounded-md overflow-hidden flex items-center justify-center relative">
              {fileLoading ? (
                <LoadingSpinner size="md" />
              ) : imagePreview || product.image ? (                <Image
                  src={imagePreview || product.image || ""}
                  alt="Product preview"
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-gray-400">No image</span>
              )}
            </div>

            <div>
              <label
                htmlFor="image-upload"
                className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Upload Image
              </label>
              <input
                id="image-upload"
                name="image"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleImageChange}
              />
              <p className="mt-2 text-xs text-gray-500">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading || fileLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-pink-300"
          >
            {loading ? <LoadingSpinner size="sm" /> : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
