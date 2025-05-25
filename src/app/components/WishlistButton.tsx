"use client";

import { useState } from "react";
import { useCart } from "../components/CartContext";
import { Heart, ShoppingBag } from "lucide-react";
import { toast } from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  description?: string;
  rating?: number;
  reviews?: number;
}

export default function WishlistButton({
  productId,
  product,
}: {
  productId: string;
  product: Product;
}) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const { addToCart } = useCart();

  const toggleWishlist = () => {
    setIsInWishlist(!isInWishlist);
    toast.success(
      isInWishlist
        ? `Removed ${product.name} from wishlist`
        : `Added ${product.name} to wishlist`
    );
  };

  const addItemToCart = () => {
    addToCart({
      id: productId,
      name: product.name,
      price: product.price,
      category: product.category || "stock",
      rating: product.rating || 0,
      image: product.image,
      reviews: product.reviews || 0,
      quantity: 1,
      description: product.description,
    });

    toast.success(`Added ${product.name} to your cart!`);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={toggleWishlist}
        className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
        aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart
          className={`h-5 w-5 ${
            isInWishlist ? "fill-[#FF0059] text-[#FF0059]" : "text-gray-500"
          }`}
        />
      </button>

      <button
        onClick={addItemToCart}
        className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
        aria-label="Add to cart"
      >
        <ShoppingBag className="h-5 w-5 text-gray-500" />
      </button>
    </div>
  );
}
