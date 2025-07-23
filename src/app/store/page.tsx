"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductGrid from "@/app/components/ProductGrid";
import CartDrawer from "@/app/components/CartDrawer";
import FilterSidebar from "@/app/components/FilterSidebar";
import FilterModal from "@/app/components/FilterModal";
import SellerProfileModal from "@/app/components/SellerProfileModal";
import { useCart } from "@/app/components/NewCartContext";
import { useAuth } from "@/context/AuthContext";
import { FlyToCartAnimation } from "@/app/components/CartAnimations";
import { StockService } from "@/services/stockService";
import type { StockItem, StockListing } from "@/types/marketplace";
import "rc-pagination/assets/index.css";
import { toast } from "react-hot-toast";
import { getBestProductImage } from "../utils/imageHelpers";
import { generateUniqueId } from "@/utils/idGenerator";

// Categories - will be updated dynamically based on actual products
const categories = [
  { id: "all", name: "All" },
  { id: "casual", name: "Casual" },
  { id: "formal", name: "Formal" },
  { id: "party", name: "Party" },
  { id: "gym", name: "Gym" },
  { id: "sports", name: "Sports" },
  { id: "accessories", name: "Accessories" },
  { id: "shoes", name: "Shoes" },
  { id: "bags", name: "Bags" },
  { id: "watches", name: "Watches" },
  { id: "jewelry", name: "Jewelry" },
  { id: "electronics", name: "Electronics" },
  { id: "home", name: "Home" },
  { id: "beauty", name: "Beauty" },
  { id: "books", name: "Books" },
  { id: "toys", name: "Toys" },
  { id: "other", name: "Other" },
];

const animationSettings = {
  animationDuration: 800,
  animationDelay: 200,
  openCartAfterAdd: false,
  openCartDelay: 1000,
};

function StorePageContent() {
  const { userProfile, user } = useAuth();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<StockItem[]>([]);
  const [availableCategories, setAvailableCategories] = useState(categories);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedSeller, setSelectedSeller] = useState<string>("all");
  const [availableSellers, setAvailableSellers] = useState<Array<{id: string, name: string}>>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animatedProduct, setAnimatedProduct] = useState<StockItem | null>(null);
  const [animationStartPosition, setAnimationStartPosition] = useState({
    x: 0,
    y: 0,
  });
  const [animationEndPosition] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth - 100 : 800, // Approximate navbar cart position
    y: 20,
  });
  
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [selectedSellerInfo, setSelectedSellerInfo] = useState<{id: string, name: string} | null>(null);
  
  const { setIsCartOpen, isCartOpen, addToCart } = useCart();

  // Handle URL parameters on component mount
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    const sellerParam = searchParams.get('seller');
    
    if (categoryParam && categoryParam !== 'all') {
      setSelectedCategory(categoryParam);
    }
    
    if (searchParam) {
      setSearchQuery(searchParam);
      setDebouncedSearchQuery(searchParam);
    }
    
    if (sellerParam && sellerParam !== 'all') {
      setSelectedSeller(sellerParam);
    }
  }, [searchParams]);
  
  // Function to update available categories based on products
  const updateAvailableCategories = (productList: StockItem[]) => {
    const uniqueCategories = new Set<string>();
    productList.forEach(product => {
      if (product.category) {
        uniqueCategories.add(product.category.toLowerCase());
      }
    });

    const dynamicCategories = [
      { id: "all", name: "All" },
      ...Array.from(uniqueCategories).map(cat => ({
        id: cat,
        name: cat.charAt(0).toUpperCase() + cat.slice(1)
      }))
    ];

    setAvailableCategories(dynamicCategories);
  };

  // Function to update available sellers based on products
  const updateAvailableSellers = (productList: StockItem[]) => {
    const uniqueSellers = new Set<string>();
    const sellerNames = new Map<string, string>();
    
    productList.forEach(product => {
      if (product.sellerId && product.sellerName) {
        uniqueSellers.add(product.sellerId);
        sellerNames.set(product.sellerId, product.sellerName);
      }
    });

    const dynamicSellers = [
      { id: "all", name: "All Sellers" },
      ...Array.from(uniqueSellers).map(sellerId => ({
        id: sellerId,
        name: sellerNames.get(sellerId) || "Unknown Seller"
      }))
    ];

    setAvailableSellers(dynamicSellers);
  };

  // Function to update categories and sellers based on products
  useEffect(() => {
    updateAvailableCategories(products);
    updateAvailableSellers(products);
  }, [products]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Allow all users including sellers to access the store page

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
            
            // Remove duplicates by productId before setting state
            const uniqueStockItems = stockItems.filter((item, index, self) => 
              index === self.findIndex(t => t.productId === item.productId)
            );
            setProducts(uniqueStockItems);
            
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
              
              // Remove duplicates by productId before setting state
              const uniqueUpdatedStockItems = updatedStockItems.filter((item, index, self) => 
                index === self.findIndex(t => t.productId === item.productId)
              );
              setProducts(uniqueUpdatedStockItems);
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
        console.log('Store: Loading stock items...');
        const stockItems = await StockService.getAllStockItems();
        console.log('Store: Loaded stock items:', stockItems.length, stockItems);
        
        // Remove duplicates by productId before setting state
        const uniqueStockItems = stockItems.filter((item, index, self) => 
          index === self.findIndex(t => t.productId === item.productId)
        );
        setProducts(uniqueStockItems);
        
        // Also fetch real seller names for static loads
        // First convert to StockListing format
        const listingsFormat = uniqueStockItems.map(item => ({
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
            const originalItem = uniqueStockItems.find(item => item.productId === listing.productId);
            if (!originalItem) return null;
            
            return {
              ...originalItem,
              sellerName: listing.sellerName // Update just the seller name
            };
          }).filter(Boolean) as StockItem[];
          
          // Remove duplicates again after processing
          const finalUniqueStockItems = updatedStockItems.filter((item, index, self) => 
            index === self.findIndex(t => t.productId === item.productId)
          );
          
          setProducts(finalUniqueStockItems);
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

      const matchesSeller =
        selectedSeller === "all" ||
        product.sellerId === selectedSeller;

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

      return matchesCategory && matchesSeller && matchesPrice && matchesSize && matchesSearch;
    });
  }, [selectedCategory, selectedSeller, priceRange, selectedSizes, debouncedSearchQuery, products]);

  const handleProductAddToCart = async (
    product: StockItem,
    event?: React.MouseEvent
  ) => {
    // Check if user is logged in
    if (!user) {
      toast.error("Please log in to add items to cart", {
        duration: 4000,
        position: "top-center",
        style: {
          border: "1px solid #FF0059",
          padding: "16px",
          color: "#FF0059",
        },
      });
      return;
    }

    // Prevent sellers from adding items to cart
    if (userProfile?.role === "seller") {
      toast.error("Sellers cannot purchase items. Please browse as a regular user.");
      return;
    }

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

  const handleSellerClick = (sellerId: string, sellerName: string) => {
    setSelectedSellerInfo({ id: sellerId, name: sellerName });
    setShowSellerModal(true);
  };

  // Show filtered products
  const totalItems = filteredProducts.length;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Shop {userProfile?.role === "seller" && <span className="text-xs sm:text-sm font-normal text-orange-600">(Seller View)</span>}
            </h1>
            {/* Debug info */}
            <p className="text-xs text-gray-500 mt-1">
              Products: {products.length} | Filtered: {filteredProducts.length}
            </p>
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

        {/* Combined Filter Button for All Devices */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilterModal(true)}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors space-y-3 sm:space-y-0"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
              <span className="font-medium">Filter & Search</span>
            </div>
            
            {/* Active Filter Indicators with proper mobile spacing */}
            {(searchQuery || selectedCategory !== "all" || selectedSizes.length > 0 || priceRange[0] > 0 || priceRange[1] < 1000) && (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-4">
                {searchQuery && (
                  <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                    Search: {searchQuery.length > 8 ? searchQuery.substring(0, 8) + '...' : searchQuery}
                  </span>
                )}
                {selectedCategory !== "all" && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                    {availableCategories.find(cat => cat.id === selectedCategory)?.name}
                  </span>
                )}
                {(selectedSizes.length > 0 || priceRange[0] > 0 || priceRange[1] < 1000) && (
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                    {selectedSizes.length > 0 ? `${selectedSizes.length} sizes` : 'Price'}
                  </span>
                )}
              </div>
            )}
          </button>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Desktop Filters */}
          <div className="hidden lg:block lg:col-span-3">
            <FilterSidebar
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedSizes={selectedSizes}
              setSelectedSizes={setSelectedSizes}
            />
          </div>

          {/* Product Grid */}
          <div className="lg:col-span-9">
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Showing {totalItems} products
              </p>
            </div>

            <ProductGrid
              products={filteredProducts}
              onAddToCart={handleProductAddToCart}
              onSellerClick={handleSellerClick}
            />
          </div>
        </div>
      </div>
      
      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      
      {/* Mobile Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        selectedSizes={selectedSizes}
        setSelectedSizes={setSelectedSizes}
        categories={availableCategories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedSeller={selectedSeller}
        setSelectedSeller={setSelectedSeller}
        availableSellers={availableSellers}
      />
      
      {/* Seller Profile Modal */}
      <SellerProfileModal
        isOpen={showSellerModal}
        onClose={() => setShowSellerModal(false)}
        sellerId={selectedSellerInfo?.id || ""}
        sellerName={selectedSellerInfo?.name || ""}
      />
    </div>
  );
}

export default function StorePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <StorePageContent />
    </Suspense>
  );
}
