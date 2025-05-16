"use client";

import React from "react";
import { ShoppingCart } from "lucide-react";
import { Product } from "@/types/product";
import StarRating from "./StarRating";
import QuickAddButton from "./QuickAddButton";
import EnhancedQuickAddButton from "./EnhancedQuickAddButton";
import { useRouter } from "next/navigation";

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product, event?: React.MouseEvent) => void;
}

export default function ProductGrid({
  products,
  onAddToCart,
}: ProductGridProps) {
  const router = useRouter();

  const handleProductClick = (productId: string) => {
    router.push(`/store/${productId}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer"
        >
          <div
            className="relative aspect-square"
            onClick={() => handleProductClick(product.id)}
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.isSale && (
              <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-semibold rounded">
                SALE
              </span>
            )}
          </div>
          <div className="p-4" onClick={() => handleProductClick(product.id)}>
            <h3 className="text-lg font-medium text-gray-900">
              {product.name}
            </h3>
            <div className="mt-2">
              <StarRating rating={product.rating} />
              <span className="text-sm text-gray-700">({product.reviews})</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {product.salePrice ? (
                  <>
                    <span className="text-lg font-medium text-gray-900">
                      ${product.salePrice}
                    </span>
                    <span className="text-sm text-gray-700 line-through">
                      ${product.price}
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-medium text-gray-900">
                    ${product.price}
                  </span>
                )}
              </div>{" "}
              <div onClick={(e) => e.stopPropagation()}>
                <EnhancedQuickAddButton
                  product={product}
                  className="flex items-center justify-center w-10 h-10"
                  showIcon={true}
                  variant="round"
                  size="md"
                  onClick={(e) => onAddToCart(product, e)}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
