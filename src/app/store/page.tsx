"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import ProductGrid from "@/app/components/ProductGrid";
import CategoryBar from "@/app/components/CategoryBar";
import CartDrawer from "@/app/components/CartDrawer";
import AnimatedCartIcon from "@/app/components/AnimatedCartIcon";
import FilterSidebar from "@/app/components/FilterSidebar";
import LoginModal from "@/app/components/LoginModal";
import { useCart } from "@/app/components/NewCartContext";
import { FlyToCartAnimation } from "@/app/components/CartAnimations";
import { StockService } from "@/services/stockService";
import type { StockItem, StockListing } from "@/types/marketplace";
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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animatedProduct, setAnimatedProduct] = useState<StockItem | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [animationStartPosition, setAnimationStartPosition] = useState({
    x: 0,
    y: 0,
  });
  const [animationEndPosition, setAnimationEndPosition] = useState({
    x: 0,
    y: 0,
  });
  
  const cartIconRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const { setIsCartOpen, isCartOpen, addToCart } = useCart();
  
  // Debounce the search query to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Handle click outside to close search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchResultsRef.current && 
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Allow all users including sellers to access the store page

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
              sellerName: listing.sellerName || "Loading...",
              rating: listing.rating || 0,
              reviews: Array.isArray(listing.reviews) ? listing.reviews : [],
              isSale: false,
              salePercentage: 0,
              createdAt: listing.createdAt,
              updatedAt: listing.updatedAt,
            }));
            setProducts(stockItems);
            
            // After loading the basic stock items, fetch real seller names
            StockService.fetchSellerNamesForListings(listings, (updatedListings) => {
              // Map updated listings back to stock items format
              const updatedStockItems = updatedListings.map((listing) => ({
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
                sellerName: listing.sellerName, // This now has the real seller name
                rating: listing.rating || 0,
                reviews: Array.isArray(listing.reviews) ? listing.reviews : [],
                isSale: false,
                salePercentage: 0,
                createdAt: listing.createdAt,
                updatedAt: listing.updatedAt,
              }));
              setProducts(updatedStockItems);
            });
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
        
        // Also fetch real seller names for static loads
        // First convert to StockListing format
        const listingsFormat = stockItems.map(item => ({
          id: item.id || item.productId || "", // Ensure id is never undefined
          productId: item.productId,
          name: item.name,
          description: item.description,
          price: item.price,
          quantity: item.stock,
          image: item.mainImage,
          images: item.images,
          mainImage: item.mainImage,
          category: item.category,
          sellerId: item.sellerId || "", // Ensure sellerId is never undefined
          sellerName: item.sellerName,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        })) as StockListing[];
        
        // Then fetch real seller names
        StockService.fetchSellerNamesForListings(listingsFormat, (updatedListings) => {
          // Map back to StockItem format and update state
          const updatedStockItems = updatedListings.map((listing) => {
            const originalItem = stockItems.find(item => item.productId === listing.productId);
            if (!originalItem) return null;
            
            return {
              ...originalItem,
              sellerName: listing.sellerName // Update just the seller name
            };
          }).filter(Boolean) as StockItem[];
          
          setProducts(updatedStockItems);
        });
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
        product.price >= priceRange[0] && product.price <= priceRange[1];
        
      const matchesSize =
        selectedSizes.length === 0; // Remove size filtering since StockItem doesn't have sizes
        
      // Basic search functionality - using debouncedSearchQuery for better performance
      const query = debouncedSearchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.category && product.category.toLowerCase().includes(query)) ||
        (product.description && product.description.toLowerCase().includes(query)) || 
        (product.sellerName && product.sellerName.toLowerCase().includes(query));

      return matchesCategory && matchesPrice && matchesSize && matchesSearch;
    });
  }, [selectedCategory, priceRange, selectedSizes, debouncedSearchQuery, products]);

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
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Shop</h1>
          
          {/* Live Search Bar */}
          <div className="relative flex-grow max-w-xl w-full">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length >= 2) {
                    setShowSearchResults(true);
                  } else {
                    setShowSearchResults(false);
                  }
                }}
                onFocus={() => {
                  if (searchQuery.length >= 2) {
                    setShowSearchResults(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowSearchResults(false);
                  }
                }}
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF0059] focus:border-transparent transition-all duration-200"
                aria-label="Search products"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setShowSearchResults(false);
                    if (searchInputRef.current) {
                      searchInputRef.current.focus();
                    }
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Live Search Results */}
            {searchQuery && searchQuery.length >= 2 && showSearchResults && (
              <div 
                ref={searchResultsRef}
                className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-96 overflow-auto"
              >
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">No products found matching &ldquo;{searchQuery}&rdquo;</div>
                ) : (
                  <div>
                    {/* Show up to 5 quick results */}
                    {filteredProducts.slice(0, 5).map(product => (
                      <div 
                        key={product.id} 
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                        onClick={() => {
                          // Navigate to product page
                          window.location.href = `/store/${product.id}`;
                        }}
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                          {(() => {
                            const imageUrl = getBestProductImage(product);
                            return imageUrl ? (
                              <div className="relative w-full h-full">
                                {/* 
                                  Using img tag for simple thumbnail in search dropdown
                                  Next/Image not used here intentionally to reduce complexity
                                  for these small, temporary search result thumbnails
                                */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                  src={imageUrl}
                                  alt={product.name} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-xs text-gray-400">No image</span>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="ml-3 flex-grow">
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-sm text-gray-600">${product.price.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                    
                    {filteredProducts.length > 5 && (
                      <div className="p-3 text-center text-sm text-[#FF0059]">
                        {filteredProducts.length - 5} more products - scroll down to see all results
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="relative" ref={cartIconRef}>
            <AnimatedCartIcon onClick={() => setIsCartOpen(true)} />
          </div>
        </div>

        {/* Cart Animation */}
        {showAnimation && animatedProduct && (
          <FlyToCartAnimation
            startPosition={animationStartPosition}
            endPosition={animationEndPosition}
            productImage={getBestProductImage(animatedProduct) || undefined}
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
