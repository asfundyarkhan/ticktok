"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import EnhancedQuickAddButton from "./EnhancedQuickAddButton";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

// Sample related products data - in a real app, this would come from an API
const sampleRelatedProducts = [
  {
    id: "rel1",
    name: "Vintage Watch",
    price: 129.99,
    salePrice: 99.99,
    category: "accessories",
    rating: 4.5,
    image: "/images/product1.jpg",
    reviews: 24,
    description: "Classic vintage timepiece with leather band.",
  },  {
    id: "rel2",
    name: "Silver Bracelet",
    price: 49.99,
    category: "accessories",
    rating: 4.2,
    image: "/images/product2.jpg",
    reviews: 18,
    description: "Elegant silver bracelet with minimalist design.",
  },
  {
    id: "rel3",
    name: "Gold Necklace",
    price: 79.99,
    salePrice: 69.99,
    category: "accessories",
    rating: 4.7,
    image: "/images/product3.jpg",
    reviews: 36,
    description: "Beautiful gold necklace with pendant.",
  },
  {
    id: "rel4",
    name: "Diamond Earrings",
    price: 199.99,
    category: "accessories",
    rating: 4.9,
    image: "/images/product4.jpg",
    reviews: 52,
    description: "Stunning diamond earrings with platinum finish.",
  },
];

interface RelatedProductsProps {
  products?: unknown[];
  title?: string;
}

export default function RelatedProducts({
  title = "You Might Also Like",
}: RelatedProductsProps) {
  const [relatedProducts] = useState(sampleRelatedProducts);
  return (
    <div className="mt-12 border-t border-gray-200 pt-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">{title}</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {relatedProducts.map((product) => (
          <motion.div
            key={product.id}
            className="group relative bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="relative">              <div className="aspect-square w-full overflow-hidden">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-100 flex items-center justify-center text-gray-500 text-2xl font-bold">
                    {product.name[0]}
                  </div>
                )}
              </div>

              {/* Quick add button - absolute positioned over the image */}
              <div className="absolute bottom-2 right-2">
                <EnhancedQuickAddButton
                  product={product}
                  showIcon={true}
                  variant="round"
                  size="sm"
                />
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                <Link
                  href={`/store/${product.id}`}
                  className="hover:text-[#FF0059]"
                >
                  {product.name}
                </Link>
              </h3>

              <div className="mt-1 flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.floor(product.rating || 0)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-1 text-xs text-gray-500">
                  ({product.reviews})
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {product.salePrice ? (
                    <>
                      <span className="text-sm font-medium text-gray-900">
                        ${product.salePrice}
                      </span>
                      <span className="text-xs text-gray-500 line-through">
                        ${product.price}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-gray-900">
                      ${product.price}
                    </span>
                  )}
                </div>
                {product.salePrice && (
                  <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-md font-medium">
                    {Math.round((1 - product.salePrice / product.price) * 100)}%
                    OFF
                  </span>
                )}{" "}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
