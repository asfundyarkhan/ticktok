"use client";

import React, { useState } from "react";
import { StockItem } from "@/types/marketplace";
import Image from "next/image";
import { motion } from "framer-motion";
import EnhancedQuickAddButton from "./EnhancedQuickAddButton";
import LoginModal from "./LoginModal";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getBestProductImage } from "../utils/imageHelpers";

interface ProductGridProps {
  products: StockItem[];
  onAddToCart: (product: StockItem, event: React.MouseEvent) => void;
}

export default function ProductGrid({
  products,
  onAddToCart,
}: ProductGridProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StockItem | null>(null);

  const handleProductClick = (product: StockItem) => {
    // Check if user is logged in for product navigation
    if (!user) {
      setSelectedProduct(product);
      setShowLoginModal(true);
      return;
    }

    // Allow all logged in users (including sellers) to view product details
    console.log("ProductGrid: Clicking product", {
      productId: product.id,
      productCode: product.productCode,
      name: product.name,
      userEmail: user?.email || 'guest'
    });
    
    if (product.id) {
      console.log("ProductGrid: Navigating to", `/store/${product.id}`);
      router.push(`/store/${product.id}`);
    } else {
      console.error("ProductGrid: Product has no ID", product);
    }
  };

  const handleAddToCart = (product: StockItem, event: React.MouseEvent) => {
    if (!user) {
      event.stopPropagation();
      setSelectedProduct(product);
      setShowLoginModal(true);
      return;
    }
    
    onAddToCart(product, event);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, index) => (
          <motion.div
            key={`${product.id}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div
              className="relative aspect-square mb-4 overflow-hidden rounded-md bg-gray-200 cursor-pointer"
              onClick={() => handleProductClick(product)}
            >
            <Image
              src={getBestProductImage(product) || '/images/placeholders/product.svg'}
              alt={product.name}
              fill
              className="object-cover transform hover:scale-105 transition-transform"
              onError={(e) => {
                console.log("Image failed to load:", e.currentTarget.src);
                e.currentTarget.src = '/images/placeholders/product.svg';
              }}
              unoptimized={true}
              priority
            />
            {product.isSale && (
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                SALE {product.salePercentage > 0 && `-${product.salePercentage}%`}
              </div>
            )}
            {product.rating > 0 && (
              <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <span>⭐</span>
                <span>{product.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {product.name}
          </h3>

          <div className="mb-2">
            <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div>
                {product.isSale && product.salePrice ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      ${product.salePrice.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-gray-900">
                    ${product.price.toFixed(2)}
                  </span>
                )}
              </div>
              {product.stock > 0 ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <EnhancedQuickAddButton
                    product={{
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      salePrice: product.salePrice,
                      category: product.category,
                      image: getBestProductImage(product) || '/images/placeholders/product.svg',
                      description: product.description,
                      quantity: product.stock,
                      sellerId: product.sellerId || "",
                      sellerName: product.sellerName,
                      productId: product.productId,
                      isSale: product.isSale,
                    }}
                    className="flex items-center justify-center w-10 h-10"
                    showIcon={true}
                    variant="round"
                    size="md"
                    onClick={(e) => handleAddToCart(product, e)}
                  />
                </div>
              ) : (
                <span className="text-sm text-red-500 font-medium">Out of stock</span>
              )}
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>By {product.sellerName || 'Unknown Seller'}</span>
              <div className="flex items-center gap-2">                <span>{product.stock} in stock</span>
                {Array.isArray(product.reviews) && product.reviews.length > 0 && (
                  <span>({product.reviews.length} reviews)</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
      </div>
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        productName={selectedProduct?.name}
      />
    </>
  );
}
