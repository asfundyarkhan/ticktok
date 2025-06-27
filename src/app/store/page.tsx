"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import ProductGrid from "@/app/components/ProductGrid";
import CategoryBar from "@/app/components/CategoryBar";
import CartDrawer from "@/app/components/CartDrawer";
import AnimatedCartIcon from "@/app/components/AnimatedCartIcon";
import FilterSidebar from "@/app/components/FilterSidebar";
import LoginModal from "@/app/components/LoginModal";
import { useCart } from "@/app/components/NewCartContext";
import { FlyToCartAnimation } from "@/app/components/CartAnimations";
import { StockService } from "@/services/stockService";
import type { StockItem } from "@/types/marketplace";
import "rc-pagination/assets/index.css";
import { toast } from "react-hot-toast";
import { getBestProductImage, normalizeProductImages } from "../utils/imageHelpers";
import { generateUniqueId } from "@/utils/idGenerator";

// Keep the same categories
const categories = [
  { id: "all", name: "All" },
  { id: "casual", name: "Casual" },
  { id: "formal", name: "Formal" },
  { id: "party", name: "Party" },
  { id: "gym", name: "Gym" },
];

const animationSettings = {
  animationDuration: 800,
  animationDelay: 200,
  openCartAfterAdd: false,
  openCartDelay: 1000,
};

export default function StorePage() {
  const [products, setProducts] = useState<StockItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animatedProduct, setAnimatedProduct] = useState<StockItem | null>(null);
  const [animationStartPosition, setAnimationStartPosition] = useState({
    x: 0,
    y: 0,
  });
  const [animationEndPosition, setAnimationEndPosition] = useState({
    x: 0,
    y: 0,
  });  const cartIconRef = useRef<HTMLDivElement>(null);
  const { setIsCartOpen, isCartOpen, addToCart } = useCart();
  const { userProfile, loading } = useAuth();

  // Only redirect regular sellers, allow everyone else to access the store
  useEffect(() => {
    if (!loading && userProfile?.role === "seller") {
      // The type check shows we can only have one role type, so sellers will be redirected
      console.log("Seller attempted to access store page, redirecting to profile");
      window.location.href = "/profile";
      return;
    }
  }, [userProfile, loading]);

  useEffect(() => {
    // Update cart icon position for animation
    const updateCartPosition = () => {
      const cartIcon = cartIconRef.current;
      if (cartIcon) {
        const rect = cartIcon.getBoundingClientRect();
        setAnimationEndPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }
    };

    updateCartPosition();
    window.addEventListener("resize", updateCartPosition);
    return () => window.removeEventListener("resize", updateCartPosition);
  }, []);
  
  useEffect(() => {
    const loadProducts = async () => {
      try {
        // Try real-time subscription first
        const unsubscribe = StockService.subscribeToAllListings(
          (listings) => {
            const stockItems = listings.map((listing) => ({
              id: listing.productId, // Use productId instead of listing.id for navigation
              productId: listing.productId,
              productCode: listing.productCode || listing.productId,
              name: listing.name,
              description: listing.description,
              price: listing.price,
              stock: listing.quantity,
              images: listing.images || (listing.image ? [listing.image] : []),
              mainImage: listing.mainImage || listing.image,
              category: listing.category,
              listed: true,
              sellerId: listing.sellerId,
              sellerName: listing.sellerName,
              rating: listing.rating || 0,
              reviews: Array.isArray(listing.reviews) ? listing.reviews : [],
              isSale: false,
              salePercentage: 0,
              createdAt: listing.createdAt,
              updatedAt: listing.updatedAt,
            }));
            setProducts(stockItems);
          },
          (error) => {
            console.error("Real-time subscription failed, falling back to static load:", error);
            // Fallback to static load if subscription fails
            loadProductsStatic();
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error("Subscription setup failed, using static load:", error);
        // Fallback to static load if subscription setup fails
        loadProductsStatic();
      }
    };

    const loadProductsStatic = async () => {
      try {
        const stockItems = await StockService.getAllStockItems();
        setProducts(stockItems);
      } catch (error) {
        console.error("Failed to load products:", error);
        toast.error("Failed to load products. Please try again later.");
      }
    };

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" ||
        (product.category &&
          product.category.toLowerCase() === selectedCategory.toLowerCase());

      const matchesPrice =
        product.price >= priceRange[0] && product.price <= priceRange[1];      const matchesSize =
        selectedSizes.length === 0; // Remove size filtering since StockItem doesn't have sizes      // Basic search functionality
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.category &&
          product.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.description &&
          product.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesPrice && matchesSize && matchesSearch;
    });
  }, [selectedCategory, priceRange, selectedSizes, searchQuery, products]);

  const handleProductAddToCart = async (
    product: StockItem,
    event?: React.MouseEvent
  ) => {
    // Validate stock before adding to cart
    if (product.stock <= 0) {
      toast.error("This item is out of stock");
      return;
    }

    // Set animation start position from the click event or product position
    if (event) {
      setAnimationStartPosition({
        x: event.clientX,
        y: event.clientY,
      });
    }

    // Set the product being animated
    setAnimatedProduct(product);

    // Show animation
    setShowAnimation(true);    // Add to cart with a slight delay to allow animation to complete
    setTimeout(() => {      // Create a clean cart item from the product
      const cartItem = {
        id: product.id || product.productId || generateUniqueId('item'),
        productId: product.productId || generateUniqueId('prod'), // Ensure productId is never undefined
        name: product.name || "Unknown Product",
        price: typeof product.price === 'number' ? product.price : 0,
        salePrice: product.salePrice && typeof product.salePrice === 'number' ? product.salePrice : undefined,
        image: product.mainImage || "/images/placeholders/product.svg",
        quantity: 1,
        sellerId: product.sellerId || "",
        category: product.category || "Uncategorized",
        description: product.description || "",
        stock: typeof product.stock === 'number' ? product.stock : 0,
        rating: typeof product.rating === 'number' ? product.rating : 0,
      };

      console.log(`Adding to cart - product:`, product);
      console.log(`Cart item created:`, cartItem);

      addToCart(cartItem);

      // Show toast notification that item was added
      toast.success(`${product.name} added to cart!`);

      // Hide animation after it completes
      setTimeout(() => {
        setShowAnimation(false);
        setAnimatedProduct(null);

        // Don't automatically open cart drawer - let user continue shopping
      }, animationSettings.animationDuration);
    }, animationSettings.animationDelay);
  };

  // Show filtered products
  const totalItems = filteredProducts.length;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Shop</h1>
          <div className="relative" ref={cartIconRef}>
            <AnimatedCartIcon onClick={() => setIsCartOpen(true)} />
          </div>
        </div>

        {/* Cart Animation */}
        {showAnimation && animatedProduct && (
          <FlyToCartAnimation
            startPosition={animationStartPosition}
            endPosition={animationEndPosition}
            productImage={getBestProductImage(animatedProduct)}
            onAnimationComplete={() => setShowAnimation(false)}
          />
        )}

        {/* Categories */}
        <CategoryBar
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <div className="mt-8 grid grid-cols-12 gap-8">
          {/* Filters */}
          <div className="col-span-3">
            <FilterSidebar
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedSizes={selectedSizes}
              setSelectedSizes={setSelectedSizes}
            />
          </div>

          {/* Product Grid */}
          <div className="col-span-9">
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Showing {totalItems} products
              </p>
            </div>

            <ProductGrid
              products={filteredProducts}
              onAddToCart={handleProductAddToCart}
            />
          </div>
        </div>
      </div>      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
